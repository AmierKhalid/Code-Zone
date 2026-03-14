"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { IUpdateProfile } from "@/app/types";

export type UpdateProfileResult =
  | {
      success: true;
      user: {
        id: string;
        name: string | null;
        username: string | null;
        bio: string | null;
        image: string | null;
      };
    }
  | { success: false; error: string };

export async function updateProfile(
  data: IUpdateProfile,
): Promise<UpdateProfileResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate username uniqueness if provided
    if (data.username) {
      const existing = await db.user.findUnique({
        where: { username: data.username },
      });
      if (existing && existing.accountId !== userId) {
        return { success: false, error: "Username already taken" };
      }
    }

    const updatedUser = await db.user.update({
      where: { accountId: userId },
      data: {
        name: data.name || undefined,
        username: data.username || undefined,
        bio: data.bio || undefined,
        image: data.image || undefined,
      },
    });

    return {
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        username: updatedUser.username,
        bio: updatedUser.bio,
        image: updatedUser.image,
      },
    };
  } catch (error) {
    console.error("updateProfile error:", error);
    return { success: false, error: "Failed to update profile" };
  }
}
