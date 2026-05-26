"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { HOME_FEED_CACHE_TAG } from "@/lib/homeFeed";
import { NotificationType } from "@/lib/generated/prisma/client";


import { PostValidation } from "@/lib/validations";
import { z } from "zod";

type CreatePostInput = z.infer<typeof PostValidation> & {
  mediaUrl?: string | null;
};

async function requireDbUserId() {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" as const };

  const user = await db.user.findUnique({
    where: { accountId: userId },
    select: { id: true },
  });
  if (!user) return { error: "User not found" as const };

  return { dbUserId: user.id };
}

export async function createPost(formData: CreatePostInput) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = PostValidation.parse(formData);

    const author = await db.user.findUnique({
      where: { accountId: userId },
      select: { id: true },
    });
    if (!author) {
      return { success: false, error: "User not found" };
    }

    const tags = (validatedData.tags ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const post = await db.post.create({
      data: {
        authorId: author.id,
        caption: validatedData.caption,
        location: validatedData.location || null,
        tags: tags,
        mediaUrl: formData.mediaUrl ?? null,
      },
    });

    revalidateTag(HOME_FEED_CACHE_TAG, "max");

    return { success: true, post };
  } catch (error) {
    console.error("Error creating post:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create post";
    return { success: false, error: message };
  }
}

export async function deletePostById(postId: string) {
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

    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });
    if (!post) {
      return { success: false as const, error: "Post not found" };
    }
    if (post.authorId !== me.id) {
      return { success: false as const, error: "Forbidden" };
    }

    await db.$transaction(async (txClient) => {
      const tx = txClient as typeof db;
      await tx.comment.deleteMany({ where: { postId } });
      await tx.like.deleteMany({ where: { postId } });
      await tx.save.deleteMany({ where: { postId } });
      await tx.postShare.deleteMany({ where: { postId } });
      await tx.notification.deleteMany({ where: { postId } });
      await tx.post.delete({ where: { id: postId } });
    });

    revalidateTag(HOME_FEED_CACHE_TAG, "max");
    return { success: true as const };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete post";
    return { success: false as const, error: message };
  }
}

export async function toggleLikePost(postId: string) {
  try {
    const authResult = await requireDbUserId();
    if ("error" in authResult) {
      return { success: false as const, error: authResult.error };
    }
    const { dbUserId } = authResult;

    const outcome = await db.$transaction(async (txClient) => {
      const tx = txClient as typeof db;
      const post = await tx.post.findUnique({
        where: { id: postId },
        select: { id: true, authorId: true },
      });
      if (!post) return { ok: false as const, reason: "not_found" as const, authorId: null };

      const existing = await tx.like.findFirst({
        where: { userId: dbUserId, postId },
        select: { id: true },
      });

      if (existing) {
        // Unlike: delete + decrement (clamped to 0)
        const [, updated] = await Promise.all([
          tx.like.delete({ where: { id: existing.id } }),
          tx.post.update({
            where: { id: postId },
            data: { likesCount: { decrement: 1 } },
            select: { likesCount: true },
          }),
        ]);
        const nextCount = Math.max(0, updated.likesCount);
        if (updated.likesCount < 0) {
          await tx.post.update({ where: { id: postId }, data: { likesCount: 0 } });
        }
        return { ok: true as const, liked: false as const, likesCount: nextCount, authorId: post.authorId };
      }

      // Like: create + increment (parallel)
      const [, updated] = await Promise.all([
        tx.like.create({ data: { userId: dbUserId, postId } }),
        tx.post.update({
          where: { id: postId },
          data: { likesCount: { increment: 1 } },
          select: { likesCount: true },
        }),
      ]);
      return { ok: true as const, liked: true as const, likesCount: updated.likesCount, authorId: post.authorId };
    });

    if (!outcome.ok) {
      return { success: false as const, error: "Post not found" };
    }

    // Fire-and-forget notification — doesn't block the response
    if (outcome.liked && outcome.authorId && outcome.authorId !== dbUserId) {
      db.notification.findFirst({
        where: { recipientId: outcome.authorId, actorId: dbUserId, postId, type: NotificationType.LIKE, collabInviteId: null },
        select: { id: true },
      }).then((existing) => {
        if (existing) {
          return db.notification.update({ where: { id: existing.id }, data: { isRead: false, createdAt: new Date() } });
        }
        return db.notification.create({
          data: { recipientId: outcome.authorId!, actorId: dbUserId, postId, type: NotificationType.LIKE },
        });
      }).catch((e: unknown) => console.error("[notification] like:", e));
    }

    revalidateTag(HOME_FEED_CACHE_TAG, "max");

    const { liked, likesCount } = outcome;
    return { success: true as const, liked, likesCount };
  } catch (err: unknown) {
    console.error("Error toggling like:", err);
    const message =
      err instanceof Error ? err.message : "Failed to update like";
    return { success: false as const, error: message };
  }
}

/** Records an in-app share after the user completes native share or copy link. */
export async function recordPostShare(postId: string) {
  try {
    const authResult = await requireDbUserId();
    if ("error" in authResult) {
      return { success: false as const, error: authResult.error };
    }
    const { dbUserId } = authResult;

    const outcome = await db.$transaction(async (txClient) => {
      const tx = txClient as typeof db;
      const post = await tx.post.findUnique({
        where: { id: postId },
        select: { id: true },
      });
      if (!post) return { ok: false as const, reason: "not_found" as const };

      await tx.postShare.create({
        data: { userId: dbUserId, postId },
      });
      const updated = await tx.post.update({
        where: { id: postId },
        data: { sharesCount: { increment: 1 } },
        select: { sharesCount: true },
      });
      return { ok: true as const, sharesCount: updated.sharesCount };
    });

    if (!outcome.ok) {
      return { success: false as const, error: "Post not found" };
    }

    revalidateTag(HOME_FEED_CACHE_TAG, "max");
    return {
      success: true as const,
      sharesCount: outcome.sharesCount,
    };
  } catch (err: unknown) {
    console.error("Error recording post share:", err);
    const message =
      err instanceof Error ? err.message : "Failed to record share";
    return { success: false as const, error: message };
  }
}

export async function toggleSavePost(postId: string) {
  try {
    const authResult = await requireDbUserId();
    if ("error" in authResult) {
      return { success: false as const, error: authResult.error };
    }
    const { dbUserId } = authResult;

    const outcome = await db.$transaction(async (txClient) => {
      const tx = txClient as typeof db;
      const post = await tx.post.findUnique({
        where: { id: postId },
        select: { id: true },
      });
      if (!post) return { ok: false as const, reason: "not_found" as const };

      const existing = await tx.save.findUnique({
        where: {
          userId_postId: { userId: dbUserId, postId },
        },
      });

      if (existing) {
        await tx.save.delete({ where: { id: existing.id } });
        return { ok: true as const, saved: false };
      }

      await tx.save.create({
        data: { userId: dbUserId, postId },
      });
      return { ok: true as const, saved: true };
    });

    if (!outcome.ok) {
      return { success: false as const, error: "Post not found" };
    }

    revalidateTag(HOME_FEED_CACHE_TAG, "max");

    const { saved } = outcome;
    return { success: true as const, saved };
  } catch (err: unknown) {
    console.error("Error toggling save:", err);
    const message =
      err instanceof Error ? err.message : "Failed to update save";
    return { success: false as const, error: message };
  }
}
