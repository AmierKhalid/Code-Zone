"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { HOME_FEED_CACHE_TAG } from "@/lib/homeFeed";

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

export async function toggleLikePost(postId: string) {
  try {
    const authResult = await requireDbUserId();
    if ("error" in authResult) {
      return { success: false as const, error: authResult.error };
    }
    const { dbUserId } = authResult;

    const outcome = await db.$transaction(async (tx) => {
      const post = await tx.post.findUnique({
        where: { id: postId },
        select: { id: true },
      });
      if (!post) return { ok: false as const, reason: "not_found" as const };

      const existing = await tx.like.findFirst({
        where: { userId: dbUserId, postId },
      });

      if (existing) {
        await tx.like.delete({ where: { id: existing.id } });
        const updated = await tx.post.update({
          where: { id: postId },
          data: { likesCount: { decrement: 1 } },
          select: { likesCount: true },
        });
        let nextCount = updated.likesCount;
        if (nextCount < 0) {
          const clamped = await tx.post.update({
            where: { id: postId },
            data: { likesCount: 0 },
            select: { likesCount: true },
          });
          nextCount = clamped.likesCount;
        }
        return { ok: true as const, liked: false as const, likesCount: nextCount };
      }

      await tx.like.create({
        data: { userId: dbUserId, postId },
      });
      const updated = await tx.post.update({
        where: { id: postId },
        data: { likesCount: { increment: 1 } },
        select: { likesCount: true },
      });
      return { ok: true as const, liked: true as const, likesCount: updated.likesCount };
    });

    if (!outcome.ok) {
      return { success: false as const, error: "Post not found" };
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

export async function toggleSavePost(postId: string) {
  try {
    const authResult = await requireDbUserId();
    if ("error" in authResult) {
      return { success: false as const, error: authResult.error };
    }
    const { dbUserId } = authResult;

    const outcome = await db.$transaction(async (tx) => {
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
