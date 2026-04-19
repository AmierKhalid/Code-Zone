"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { CommentContentValidation } from "@/lib/validations";
import { parseMentionUsernames } from "@/lib/commentMentions";
import { createCommentNotification } from "@/app/actions/notificationActions";
import type { Prisma } from "@/lib/generated/prisma/client";

async function countCommentSubtree(
  tx: Prisma.TransactionClient,
  commentId: string,
): Promise<number> {
  const children = await tx.comment.findMany({
    where: { parentId: commentId },
    select: { id: true },
  });
  let total = 1;
  for (const ch of children) {
    total += await countCommentSubtree(tx, ch.id);
  }
  return total;
}

async function resolveMentionUserIds(usernames: string[]): Promise<Map<string, string>> {
  if (usernames.length === 0) return new Map();
  const users = await db.user.findMany({
    where: {
      OR: usernames.map((u) => ({
        username: { equals: u, mode: "insensitive" as const },
      })),
    },
    select: { id: true, username: true },
  });
  const map = new Map<string, string>();
  for (const u of users) {
    if (u.username) map.set(u.username.toLowerCase(), u.id);
  }
  return map;
}

export async function createComment(input: {
  postId: string;
  content: string;
  parentId?: string | null;
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false as const, error: "Unauthorized" };
    }

    const me = await db.user.findUnique({
      where: { accountId: userId },
      select: { id: true, username: true },
    });
    if (!me) {
      return { success: false as const, error: "User not found" };
    }

    const parsed = CommentContentValidation.safeParse(input.content.trim());
    if (!parsed.success) {
      const msg =
        parsed.error.issues[0]?.message ??
        "Invalid comment";
      return { success: false as const, error: msg };
    }
    const content = parsed.data;
    const post = await db.post.findUnique({
      where: { id: input.postId },
      select: { id: true, authorId: true },
    });
    if (!post) {
      return { success: false as const, error: "Post not found" };
    }

    const parentId =
      input.parentId && String(input.parentId).trim() !== ""
        ? String(input.parentId).trim()
        : null;

    let parentAuthorId: string | null = null;
    if (parentId) {
      const parent = await db.comment.findFirst({
        where: { id: parentId, postId: input.postId },
        select: { id: true, authorId: true },
      });
      if (!parent) {
        return { success: false as const, error: "Parent comment not found" };
      }
      parentAuthorId = parent.authorId;
    }

    const mentionNames = parseMentionUsernames(content);
    const mentionMap = await resolveMentionUserIds(mentionNames);
    const mentionedUserIds = [...new Set(mentionMap.values())];

    const comment = await db.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: {
          postId: input.postId,
          authorId: me.id,
          parentId,
          content,
          mentionedUserIds,
        },
      });

      await tx.post.update({
        where: { id: input.postId },
        data: { commentsCount: { increment: 1 } },
      });

      return created;
    });

    const notifyIds = new Set<string>();

    if (post.authorId !== me.id) {
      notifyIds.add(post.authorId);
    }
    if (parentAuthorId && parentAuthorId !== me.id) {
      notifyIds.add(parentAuthorId);
    }
    for (const uid of mentionedUserIds) {
      if (uid !== me.id) notifyIds.add(uid);
    }

    for (const recipientId of notifyIds) {
      await createCommentNotification({
        recipientId,
        actorId: me.id,
        postId: input.postId,
      });
    }

    revalidatePath(`/posts/${input.postId}`);
    revalidatePath("/");

    return { success: true as const, commentId: comment.id };
  } catch (error) {
    console.error("createComment:", error);
    const message =
      error instanceof Error ? error.message : "Failed to add comment";
    return { success: false as const, error: message };
  }
}

export async function deleteComment(commentId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false as const, error: "Unauthorized" };
    }

    const me = await db.user.findUnique({
      where: { accountId: userId },
      select: { id: true },
    });
    if (!me) {
      return { success: false as const, error: "User not found" };
    }

    const existing = await db.comment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true, postId: true },
    });
    if (!existing) {
      return { success: false as const, error: "Comment not found" };
    }
    if (existing.authorId !== me.id) {
      return { success: false as const, error: "Forbidden" };
    }

    await db.$transaction(async (tx) => {
      const removeCount = await countCommentSubtree(tx, commentId);
      await tx.comment.delete({ where: { id: commentId } });

      const post = await tx.post.findUnique({
        where: { id: existing.postId },
        select: { commentsCount: true },
      });
      const next = Math.max(0, (post?.commentsCount ?? 0) - removeCount);
      await tx.post.update({
        where: { id: existing.postId },
        data: { commentsCount: next },
      });
    });

    revalidatePath(`/posts/${existing.postId}`);
    revalidatePath("/");

    return { success: true as const };
  } catch (error) {
    console.error("deleteComment:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete comment";
    return { success: false as const, error: message };
  }
}
