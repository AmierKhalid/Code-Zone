import { db } from "@/lib/db";
import { resolvedStoredAttachmentKind } from "@/lib/chatAttachments";

export type ConversationListItemDTO = {
  id: string;
  updatedAt: string;
  otherUser: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  lastMessage: { preview: string; createdAt: string } | null;
  unreadCount: number;
};

function attachmentPreviewLine(
  attachments:
    | { kind: string; mimeType: string | null; fileName: string | null }[]
    | undefined,
): string | null {
  const att = attachments ?? [];
  if (att.length === 0) return null;
  const resolved = att.map((a) =>
    resolvedStoredAttachmentKind(a.kind, a.mimeType, a.fileName),
  );
  const img = resolved.filter((k) => k === "image").length;
  const vid = resolved.filter((k) => k === "video").length;
  const fil = resolved.filter((k) => k === "file").length;
  const parts: string[] = [];
  if (img) parts.push(img === 1 ? "Photo" : `${img} photos`);
  if (vid) parts.push(vid === 1 ? "Video" : `${vid} videos`);
  if (fil) parts.push(fil === 1 ? "Attachment" : `${fil} attachments`);
  return parts.join(" · ") || "Attachment";
}

function lastMessagePreview(msg: {
  content: string;
  snippetCode: string | null;
  snippetLang: string | null;
  attachments?: {
    kind: string;
    mimeType: string | null;
    fileName: string | null;
  }[];
}): string {
  const cap = msg.content.trim();
  const hasSnippet = Boolean(msg.snippetCode?.trim());
  const attLine = attachmentPreviewLine(msg.attachments);

  let core = "";
  if (hasSnippet) {
    const lang = msg.snippetLang?.trim() || "code";
    core = cap ? `${cap} · Snippet (${lang})` : `Snippet · ${lang}`;
  } else {
    core = cap;
  }

  if (attLine && core) return `${attLine} · ${core}`;
  if (attLine) return attLine;
  if (core) return core;
  return "Message";
}

async function createDmPair(a: string, b: string): Promise<{ id: string }> {
  return db.$transaction(async (tx) => {
    const c = await tx.conversation.create({ data: {} });
    await tx.conversationParticipant.createMany({
      data: [
        { conversationId: c.id, userId: a },
        { conversationId: c.id, userId: b },
      ],
    });
    return { id: c.id };
  });
}

/** Find existing 1:1 DM or create one. Returns null if invalid (self, missing user). */
export async function findOrCreateDmConversation(
  myUserId: string,
  otherUserId: string,
): Promise<{ id: string } | null> {
  if (myUserId === otherUserId) return null;
  const other = await db.user.findUnique({
    where: { id: otherUserId },
    select: { id: true },
  });
  if (!other) return null;

  const mine = await db.conversationParticipant.findMany({
    where: { userId: myUserId },
    select: { conversationId: true },
  });
  const cids = mine.map((m) => m.conversationId);
  if (cids.length === 0) {
    return createDmPair(myUserId, otherUserId);
  }

  const existing = await db.conversation.findFirst({
    where: {
      id: { in: cids },
      participants: { some: { userId: otherUserId } },
    },
    include: { _count: { select: { participants: true } } },
  });

  if (existing && existing._count.participants === 2) {
    return { id: existing.id };
  }

  return createDmPair(myUserId, otherUserId);
}

export async function getConversationListForUser(
  userId: string,
): Promise<ConversationListItemDTO[]> {
  const rows = await db.conversation.findMany({
    where: { participants: { some: { userId } } },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, name: true, username: true, image: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          content: true,
          createdAt: true,
          snippetCode: true,
          snippetLang: true,
          attachments: {
            select: { kind: true, mimeType: true, fileName: true },
          },
        },
      },
      _count: {
        select: {
          messages: {
            where: {
              senderId: { not: userId },
              isRead: false,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const out: ConversationListItemDTO[] = [];
  const seenOtherUserIds = new Set<string>();

  for (const c of rows) {
    const otherParticipant = c.participants.find((p) => p.userId !== userId);
    if (!otherParticipant) continue;

    const otherUserId = otherParticipant.user.id;

    // Skip if we already have a conversation with this user
    if (seenOtherUserIds.has(otherUserId)) continue;
    seenOtherUserIds.add(otherUserId);

    const other = otherParticipant.user;
    const last = c.messages[0];
    out.push({
      id: c.id,
      updatedAt: c.updatedAt.toISOString(),
      otherUser: {
        id: other.id,
        name: other.name,
        username: other.username,
        image: other.image,
      },
      lastMessage: last
        ? {
            preview: lastMessagePreview(last),
            createdAt: last.createdAt.toISOString(),
          }
        : null,
      unreadCount: c._count?.messages || 0,
    });
  }
  return out;
}
