"use server"

import { prisma } from "./prisma";
import { revalidatePath } from "next/cache";


export async function likePost(postId: string, userId: string) {
  try {
    const existingLike = await prisma.like.findFirst({
      where: { postId, userId },
    });

    if (existingLike) {
      await prisma.$transaction([
        prisma.like.delete({ where: { id: existingLike.id } }),
        prisma.post.update({
          where: { id: postId },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);
    } else {
      await prisma.$transaction([
        prisma.like.create({
          data: {
            post: { connect: { id: postId } },
            user: { connect: { id: userId } },
          },
        }),
        prisma.post.update({
          where: { id: postId },
          data: { likesCount: { increment: 1 } },
        }),
      ]);
    }
    revalidatePath("/CreatePost");
  } catch (error) {
    console.error("Like Error:", error);
  }
}


export async function savePost(postId: string, userId: string) {
  try {
    const existingSave = await prisma.save.findFirst({
      where: { postId, userId },
    });

    if (existingSave) {
      await prisma.save.delete({
        where: { id: existingSave.id },
      });
    } else {
      await prisma.save.create({
        data: { postId, userId },
      });
    }
    revalidatePath("/CreatePost");
  } catch (error) {
    console.error("Save Error:", error);
  }
}