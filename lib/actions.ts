"use server"

import { prisma } from "./prisma"; // تأكدي إن المسار ده صح عندك (ممكن يكون ../lib/prisma)
import { revalidatePath } from "next/cache";

// 1. الفانكشن دي اللي كانت مسببة الـ Error (ضفتها هنا عشان نصلحها)
export async function saveUserToDB(userId: string, email: string, name: string, image: string) {
  try {
    // استخدمنا findFirst بدل findUnique عشان نضمن إن الصفحة متضربش
    const existingUser = await prisma.user.findFirst({
      where: { accountId: userId },
    });

    if (existingUser) return existingUser;

    const newUser = await prisma.user.create({
      data: {
        accountId: userId,
        email: email,
        name: name,
        image: image,
        username: email.split("@")[0] + Math.floor(Math.random() * 1000),
      },
    });

    return newUser;
  } catch (error) {
    console.error("Error saving user:", error);
    return null;
  }
}

// 2. فانكشن اللايك (زي ما هي بس اتأكدت إنها متظبطة)
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
            postId: postId, // عدلت دي عشان تكون أبسط ومباشرة
            userId: userId,
          },
        }),
        prisma.post.update({
          where: { id: postId },
          data: { likesCount: { increment: 1 } },
        }),
      ]);
    }
    revalidatePath("/CreatePost");
    revalidatePath("/");
  } catch (error) {
    console.error("Like Error:", error);
  }
}

// 3. فانكشن السيف
export async function toggleSavePost(postId: string, userId: string) {
  try {
    const existingSave = await prisma.save.findFirst({
      where: { 
        postId: postId, 
        userId: userId 
      },
    });

    if (existingSave) {
      await prisma.save.delete({ 
        where: { id: existingSave.id } 
      });
    } else {
      await prisma.save.create({ 
        data: { postId, userId } 
      });
    }
    
    revalidatePath("/CreatePost");
    revalidatePath("/"); 
  } catch (error) {
    console.error("Save Error:", error);
  }
}