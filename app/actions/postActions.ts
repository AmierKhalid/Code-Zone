"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { HOME_FEED_CACHE_TAG } from "@/lib/homeFeed";
import { PostValidation } from "@/lib/validations";
import { z } from "zod";

type CreatePostInput = z.infer<typeof PostValidation> & { mediaUrl?: string | null };

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

    const tags = validatedData.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const post = await db.post.create({
      data: {
        authorId: author.id,
        caption: validatedData.caption,
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
