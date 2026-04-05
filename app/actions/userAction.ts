"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// --- 1. التعريفات (Types) ---
export type CurrentUserResult =
  | { success: true; user: any }
  | { success: false; error: string };

// --- 2. حفظ المستخدم عند التسجيل (النسخة المحسنة والمحمية) ---
export async function saveUserToDB() {
  try {
    // 1. جلب الـ ID من Clerk
    const { userId } = await auth();
    if (!userId) {
      console.warn("No userId found in auth()");
      return null;
    }

    // 2. جلب بيانات المستخدم من Clerk Client
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    // 3. التأكد من وجود الإيميل (حقل إجباري في السكيما)
    const email = clerkUser.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      console.error("Critical: User has no email in Clerk");
      return null;
    }

    // 4. تجهيز البيانات الأساسية
    const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "User";
    const image = clerkUser.imageUrl || "";

    // 5. التعامل مع الـ Username (عشان الـ Unique constraint)
    const fallbackUsername = `${email.split("@")[0]}${Math.floor(1000 + Math.random() * 9000)}`;
    const finalUsername = clerkUser.username || fallbackUsername;

    // 6. عملية الـ Upsert (تحديث لو موجود / إنشاء لو جديد)
    return await db.user.upsert({
      where: { 
        accountId: userId 
      },
      update: { 
        name, 
        image,
        email: email, 
      },
      create: {
        accountId: userId,
        name,
        username: finalUsername,
        email: email,
        image,
        accountType: "standard",
        totalPoints: 0,
        isVerified: false,
      },
    });
  } catch (error: any) {
    console.error("❌ Prisma Upsert Error Detail:", error);
    return null;
  }
}

// --- 3. جلب المستخدم الحالي ---
export async function getCurrentUser(): Promise<CurrentUserResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const user = await db.user.findUnique({
      where: { accountId: userId },
    });

    if (!user) return { success: false, error: "User not found" };

    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- 4. جلب بيانات البروفايل (مع حالة الفولو) ---
export async function getProfileData(targetUserId: string) {
  try {
    const { userId: clerkId } = await auth();
    
    let currentDbUser = null;
    if (clerkId) {
      currentDbUser = await db.user.findUnique({
        where: { accountId: clerkId }
      });
    }

    const userProfile = await db.user.findUnique({
      where: { id: targetUserId },
      include: {
        _count: {
          select: { followers: true, following: true, posts: true },
        },
        followers: {
          where: { followerId: currentDbUser?.id || "" },
        },
      },
    });

    if (!userProfile) return null;

    return {
      ...userProfile,
      followersCount: userProfile._count.followers,
      followingCount: userProfile._count.following,
      postsCount: userProfile._count.posts,
      isFollowing: userProfile.followers.length > 0,
    };
  } catch (error) {
    console.error("Error in getProfileData:", error);
    return null;
  }
}

// --- 5. نظام المتابعة (Toggle Follow) ---
export async function toggleFollow(targetUserId: string) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { success: false, error: "Unauthorized" };

    const currentUser = await db.user.findUnique({
      where: { accountId: clerkId },
    });

    if (!currentUser) return { success: false, error: "User not found" };
    if (currentUser.id === targetUserId) return { success: false, error: "Cannot follow yourself" };

    const existingFollow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      await db.follow.delete({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: targetUserId,
          },
        },
      });
    } else {
      await db.follow.create({
        data: {
          followerId: currentUser.id,
          followingId: targetUserId,
        },
      });
    }

    revalidatePath(`/profile/${targetUserId}`);
    revalidatePath(`/profile/${currentUser.id}`);
    
    return { success: true };
  } catch (error) {
    console.error("Error in toggleFollow Action:", error);
    return { success: false };
  }
}

// --- 6. جلب قوائم المتابعين والمتابعين ---
export async function getFollowersList(targetUserId: string) {
  try {
    const followers = await db.follow.findMany({
      where: { followingId: targetUserId },
      include: { 
        follower: {
          select: { id: true, name: true, username: true, image: true }
        } 
      },
    });
    return followers.map(f => f.follower);
  } catch (error) {
    console.error("Error fetching followers list:", error);
    return [];
  }
}

export async function getFollowingList(targetUserId: string) {
  try {
    const following = await db.follow.findMany({
      where: { followerId: targetUserId },
      include: { 
        following: {
          select: { id: true, name: true, username: true, image: true }
        } 
      },
    });
    return following.map(f => f.following);
  } catch (error) {
    console.error("Error fetching following list:", error);
    return [];
  }
}

// --- 7. البحث عن المستخدمين ---
export async function searchUsers(query: string) {
  try {
    if (!query || query.trim() === "") return [];
    
    return await db.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { username: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
      },
      take: 10,
    });
  } catch (error) {
    console.error("Error in searchUsers:", error);
    return [];
  }
}


export async function getPostLikers(postId: string) {
  try {
    const likes = await db.like.findMany({
      where: { postId: postId },
      include: {
        user: true, // تأكدي إن دي موجودة عشان يسحب (الاسم، الصورة، اليوزرنيم)
      },
    });

    // اتأكدي إننا بنرجع مصفوفة فيها بيانات اليوزر
    return likes.map((l) => l.user);
  } catch (error) {
    console.error(error);
    return [];
  }
}