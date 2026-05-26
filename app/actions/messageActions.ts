"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  ChatAttachmentsArrayValidation,
  MessageBodyValidation,
  MessageCaptionWithSnippetValidation,
  SnippetCodeValidation,
  SnippetLangValidation,
} from "@/lib/validations";
import { findOrCreateDmConversation } from "@/lib/messageData";
import { isTrustedMessageAssetUrl } from "@/lib/messageAssetUrl";
import type { ChatAttachmentKind } from "@/lib/chatAttachments";
import type { Message, MessageAttachment } from "@/lib/generated/prisma/client";

type SenderType = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
};

type MessageWithDetails = Message & {
  sender: SenderType;
  attachments: MessageAttachment[];
};

async function getDbUserId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const u = await db.user.findUnique({
    where: { accountId: userId },
    select: { id: true },
  });
  return u?.id ?? null;
}

async function assertConversationMember(
  conversationId: string,
  dbUserId: string,
): Promise<boolean> {
  const p = await db.conversationParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId, userId: dbUserId },
    },
    select: { userId: true },
  });
  return Boolean(p);
}

export type MessageAttachmentDTO = {
  id: string;
  kind: ChatAttachmentKind;
  url: string;
  fileName: string | null;
  mimeType: string | null;
  byteSize: number | null;
};

export type MessageDTO = {
  id: string;
  content: string;
  snippetCode: string | null;
  snippetLang: string | null;
  isRead: boolean;
  createdAt: string;
  senderId: string;
  attachments: MessageAttachmentDTO[];
  sender: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
};

export async function fetchMessagesForConversation(
  conversationId: string,
): Promise<
  | { success: true; messages: MessageDTO[] }
  | { success: false; error: string }
> {
  const me = await getDbUserId();
  if (!me) return { success: false, error: "Unauthorized" };
  if (!(await assertConversationMember(conversationId, me))) {
    return { success: false, error: "Forbidden" };
  }

  const messages = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: {
        select: { id: true, name: true, username: true, image: true },
      },
      attachments: {
        orderBy: { id: "asc" },
      },
    },
  });

  // Mark all unread messages sent by the other user as read
  await db.message.updateMany({
    where: {
      conversationId,
      senderId: { not: me },
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return {
    success: true,
    messages: messages.map((m: MessageWithDetails) => ({
      id: m.id,
      content: m.content,
      snippetCode: m.snippetCode,
      snippetLang: m.snippetLang,
      isRead: m.isRead,
      createdAt: m.createdAt.toISOString(),
      senderId: m.senderId,
      sender: m.sender,
      attachments: m.attachments.map((a: MessageAttachment) => ({
        id: a.id,
        kind: a.kind as ChatAttachmentKind,
        url: a.url,
        fileName: a.fileName,
        mimeType: a.mimeType,
        byteSize: a.byteSize,
      })),
    })),
  };
}

export type SendChatAttachmentInput = {
  url: string;
  kind: ChatAttachmentKind;
  fileName?: string | null;
  mimeType?: string | null;
  byteSize?: number | null;
};

export type SendChatPayload = {
  content: string;
  snippetCode?: string | null;
  snippetLang?: string | null;
  attachments?: SendChatAttachmentInput[];
};

export async function sendMessage(
  conversationId: string,
  payload: SendChatPayload,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const me = await getDbUserId();
    if (!me) return { success: false, error: "Unauthorized" };
    if (!(await assertConversationMember(conversationId, me))) {
      return { success: false, error: "Forbidden" };
    }

    const rawCaption = payload.content ?? "";
    const capParsed = MessageCaptionWithSnippetValidation.safeParse(rawCaption);
    if (!capParsed.success) {
      return {
        success: false,
        error: capParsed.error.issues[0]?.message ?? "Invalid message",
      };
    }
    const captionTrimmed = capParsed.data.trim();

    const rawSnippet = (payload.snippetCode ?? "").trim();
    let snippetCode: string | null = null;
    let snippetLang: string | null = null;

    if (rawSnippet) {
      const codeParsed = SnippetCodeValidation.safeParse(rawSnippet);
      if (!codeParsed.success) {
        return {
          success: false,
          error: codeParsed.error.issues[0]?.message ?? "Invalid snippet",
        };
      }
      snippetCode = codeParsed.data;

      const langRaw = (payload.snippetLang ?? "plaintext").trim() || "plaintext";
      const langParsed = SnippetLangValidation.safeParse(langRaw);
      if (!langParsed.success) {
        return {
          success: false,
          error: langParsed.error.issues[0]?.message ?? "Invalid language",
        };
      }
      snippetLang = langParsed.data.toLowerCase();
    }

    const attRaw = payload.attachments ?? [];
    const attParsed = ChatAttachmentsArrayValidation.safeParse(attRaw);
    if (!attParsed.success) {
      return {
        success: false,
        error: attParsed.error.issues[0]?.message ?? "Invalid attachments",
      };
    }
    const attachments = attParsed.data;

    for (const a of attachments) {
      if (!isTrustedMessageAssetUrl(a.url)) {
        return {
          success: false,
          error: "One or more attachments could not be verified.",
        };
      }
    }

    if (!captionTrimmed && !snippetCode && attachments.length === 0) {
      return {
        success: false,
        error: "Add a message, code snippet, or attachment.",
      };
    }

    if (!snippetCode && attachments.length === 0) {
      const textOnly = MessageBodyValidation.safeParse(captionTrimmed);
      if (!textOnly.success) {
        return {
          success: false,
          error: textOnly.error.issues[0]?.message ?? "Invalid message",
        };
      }
    }

    const contentForDb = captionTrimmed;

    await db.$transaction(async (txClient) => {
      const tx = txClient as typeof db;
      await tx.message.create({
        data: {
          conversationId,
          senderId: me,
          content: contentForDb,
          snippetCode,
          snippetLang,
          attachments:
            attachments.length > 0
              ? {
                  create: attachments.map((a: SendChatAttachmentInput) => ({
                    kind: a.kind,
                    url: a.url,
                    fileName: a.fileName ?? null,
                    mimeType: a.mimeType ?? null,
                    byteSize: a.byteSize ?? null,
                  })),
                }
              : undefined,
        },
      });
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
    });

    revalidatePath("/Message");
    return { success: true };
  } catch (e) {
    console.error("sendMessage:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to send",
    };
  }
}

export async function getOrCreateConversationWith(otherUserId: string): Promise<
  | { success: true; conversationId: string }
  | { success: false; error: string }
> {
  const me = await getDbUserId();
  if (!me) return { success: false, error: "Unauthorized" };

  const conv = await findOrCreateDmConversation(me, otherUserId);
  if (!conv) {
    return { success: false, error: "Could not start conversation" };
  }

  revalidatePath("/Message");
  return { success: true, conversationId: conv.id };
}

import { getConversationListForUser, type ConversationListItemDTO } from "@/lib/messageData";

export async function fetchConversationListAction(): Promise<
  | { success: true; conversations: ConversationListItemDTO[] }
  | { success: false; error: string }
> {
  const me = await getDbUserId();
  if (!me) return { success: false, error: "Unauthorized" };
  try {
    const conversations = await getConversationListForUser(me);
    return { success: true, conversations };
  } catch (error) {
    return { success: false, error: "Failed to load conversations" };
  }
}
