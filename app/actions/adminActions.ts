"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { HOME_FEED_CACHE_TAG } from "@/lib/homeFeed";
import { Categories, difficulties, tilteType } from "@/lib/generated/prisma/client";

// Helper to check if current authenticated user is an admin
export async function isAdminAuth(): Promise<boolean> {
  try {
    const { userId } = await auth();
    if (!userId) return false;

    // Fetch user from DB to check their email
    const user = await db.user.findUnique({
      where: { accountId: userId },
      select: { email: true },
    });
    if (!user) return false;

    const adminEmailsStr = process.env.ADMIN_EMAILS || "";
    const adminEmails = adminEmailsStr
      .split(",")
      .map((e) => e.trim().toLowerCase());

    return adminEmails.includes(user.email.toLowerCase());
  } catch (error) {
    console.error("[isAdminAuth] Error:", error);
    return false;
  }
}

// ----------------------------------------------------
// 1. STATS ACTION
// ----------------------------------------------------
export async function getAdminStats() {
  if (!(await isAdminAuth())) return { success: false, error: "Unauthorized" };

  try {
    const [
      userCount,
      postCount,
      errorCount,
      solutionCount,
      commentCount,
      verifiedUserCount,
    ] = await Promise.all([
      db.user.count(),
      db.post.count(),
      db.errorReport.count(),
      db.solution.count(),
      db.comment.count(),
      db.user.count({ where: { isVerified: true } }),
    ]);

    // Grouping
    const errorsByCategory = await db.errorReport.groupBy({
      by: ["category"],
      _count: { id: true },
    });

    const errorsByDifficulty = await db.errorReport.groupBy({
      by: ["difficulty"],
      _count: { id: true },
    });

    return {
      success: true,
      stats: {
        users: userCount,
        posts: postCount,
        errors: errorCount,
        solutions: solutionCount,
        comments: commentCount,
        verifiedUsers: verifiedUserCount,
        errorsByCategory: errorsByCategory.map((item) => ({
          category: item.category || "Unassigned",
          count: item._count.id,
        })),
        errorsByDifficulty: errorsByDifficulty.map((item) => ({
          difficulty: item.difficulty || "Unassigned",
          count: item._count.id,
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return { success: false, error: "Failed to load dashboard statistics" };
  }
}

// ----------------------------------------------------
// 2. USERS CRUD
// ----------------------------------------------------
export async function getAdminUsers(search: string = "", page: number = 1, limit: number = 10) {
  if (!(await isAdminAuth())) return { success: false, error: "Unauthorized" };

  try {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { username: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    return { success: true, users, total };
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return { success: false, error: "Failed to fetch users" };
  }
}

export async function createAdminUser(data: {
  email: string;
  username: string;
  name?: string;
  password?: string;
  bio?: string;
  totalPoints?: number;
  isVerified?: boolean;
  title?: string;
}) {
  if (!(await isAdminAuth())) return { success: false, error: "Unauthorized" };

  try {
    const client = await clerkClient();
    const cleanPassword = data.password || "TempPassword123!";

    // Create user in Clerk first
    const clerkUser = await client.users.createUser({
      emailAddress: [data.email],
      username: data.username,
      password: cleanPassword,
      firstName: data.name ? data.name.split(" ")[0] : undefined,
      lastName: data.name ? data.name.split(" ").slice(1).join(" ") : undefined,
    });

    const user = await db.user.create({
      data: {
        accountId: clerkUser.id,
        email: data.email.toLowerCase(),
        username: data.username,
        name: data.name || null,
        bio: data.bio || null,
        totalPoints: data.totalPoints || 0,
        isVerified: !!data.isVerified,
        title: (data.title as tilteType) || null,
        image: clerkUser.imageUrl || null,
      },
    });

    return { success: true, user };
  } catch (error) {
    console.error("Error creating user:", error);
    const message = error instanceof Error ? error.message : "Failed to create user";
    return { success: false, error: message };
  }
}

export async function updateAdminUser(
  id: string,
  data: {
    name?: string | null;
    username?: string | null;
    email?: string;
    bio?: string | null;
    totalPoints?: number | null;
    isVerified?: boolean | null;
    title?: string | null;
  }
) {
  if (!(await isAdminAuth())) return { success: false, error: "Unauthorized" };

  try {
    // 1. Fetch current user from DB to find accountId
    const currentUser = await db.user.findUnique({
      where: { id },
      select: { accountId: true },
    });

    if (!currentUser) return { success: false, error: "User not found in database" };

    // 2. Update Clerk info if username or name changed
    try {
      const client = await clerkClient();
      await client.users.updateUser(currentUser.accountId, {
        username: data.username || undefined,
        firstName: data.name ? data.name.split(" ")[0] : undefined,
        lastName: data.name ? data.name.split(" ").slice(1).join(" ") : undefined,
      });
    } catch (clerkErr) {
      console.warn("Clerk user update warning:", clerkErr);
    }

    // 3. Update database
    const user = await db.user.update({
      where: { id },
      data: {
        name: data.name,
        username: data.username,
        email: data.email ? data.email.toLowerCase() : undefined,
        bio: data.bio,
        totalPoints: data.totalPoints,
        isVerified: data.isVerified,
        title: (data.title as tilteType) || null,
      },
    });

    return { success: true, user };
  } catch (error) {
    console.error("Error updating user:", error);
    const message = error instanceof Error ? error.message : "Failed to update user";
    return { success: false, error: message };
  }
}

export async function deleteAdminUser(id: string) {
  if (!(await isAdminAuth())) return { success: false, error: "Unauthorized" };

  try {
    const userRow = await db.user.findUnique({
      where: { id },
      select: { accountId: true },
    });

    if (!userRow) return { success: false, error: "User not found" };

    // 1. Delete from Clerk
    try {
      const client = await clerkClient();
      await client.users.deleteUser(userRow.accountId);
    } catch (clerkErr) {
      console.warn("Clerk deletion failed, proceeding with DB cleanup:", clerkErr);
    }

    // 2. Transact DB deletion
    await db.$transaction(async (tx) => {
      // Delete Follow relations
      await tx.follow.deleteMany({
        where: { OR: [{ followerId: id }, { followingId: id }] },
      });

      // Delete Saves & Likes
      await tx.save.deleteMany({ where: { userId: id } });
      await tx.like.deleteMany({ where: { userId: id } });

      // Delete Conversation Participants
      await tx.conversationParticipant.deleteMany({ where: { userId: id } });

      // Delete message attachments first, then messages
      const userMessages = await tx.message.findMany({
        where: { senderId: id },
        select: { id: true },
      });
      const msgIds = userMessages.map((m) => m.id);
      if (msgIds.length > 0) {
        await tx.messageAttachment.deleteMany({
          where: { messageId: { in: msgIds } },
        });
        await tx.message.deleteMany({ where: { id: { in: msgIds } } });
      }

      // Delete user posts and related details
      const userPosts = await tx.post.findMany({
        where: { authorId: id },
        select: { id: true },
      });
      const postIds = userPosts.map((p) => p.id);
      if (postIds.length > 0) {
        await tx.comment.deleteMany({ where: { postId: { in: postIds } } });
        await tx.like.deleteMany({ where: { postId: { in: postIds } } });
        await tx.save.deleteMany({ where: { postId: { in: postIds } } });
        await tx.postShare.deleteMany({ where: { postId: { in: postIds } } });
        await tx.notification.deleteMany({ where: { postId: { in: postIds } } });
        await tx.post.deleteMany({ where: { authorId: id } });
      }

      // Delete user Solutions & ErrorReports
      await tx.solution.deleteMany({ where: { authorId: id } });
      await tx.errorReport.deleteMany({ where: { authorId: id } });

      // Delete actual user
      await tx.user.delete({ where: { id } });
    });

    revalidateTag(HOME_FEED_CACHE_TAG, "max");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    const message = error instanceof Error ? error.message : "Failed to delete user";
    return { success: false, error: message };
  }
}

// ----------------------------------------------------
// 3. POSTS CRUD
// ----------------------------------------------------
export async function getAdminPosts(search: string = "", page: number = 1, limit: number = 10) {
  if (!(await isAdminAuth())) return { success: false, error: "Unauthorized" };

  try {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { caption: { contains: search, mode: "insensitive" as const } },
            { tags: { has: search } },
            { author: { name: { contains: search, mode: "insensitive" as const } } },
            { author: { username: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {};

    const [posts, total] = await Promise.all([
      db.post.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, username: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.post.count({ where }),
    ]);

    return { success: true, posts, total };
  } catch (error) {
    console.error("Error fetching admin posts:", error);
    return { success: false, error: "Failed to fetch posts" };
  }
}

export async function createAdminPost(data: {
  authorId: string;
  caption: string;
  location?: string;
  tags?: string;
  mediaUrl?: string;
}) {
  if (!(await isAdminAuth())) return { success: false, error: "Unauthorized" };

  try {
    const splitTags = data.tags
      ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const post = await db.post.create({
      data: {
        authorId: data.authorId,
        caption: data.caption,
        location: data.location || null,
        tags: splitTags,
        mediaUrl: data.mediaUrl || null,
      },
    });

    revalidateTag(HOME_FEED_CACHE_TAG, "max");
    return { success: true, post };
  } catch (error) {
    console.error("Error creating post:", error);
    const message = error instanceof Error ? error.message : "Failed to create post";
    return { success: false, error: message };
  }
}

export async function updateAdminPost(
  id: string,
  data: {
    caption?: string;
    location?: string | null;
    tags?: string;
    mediaUrl?: string | null;
    likesCount?: number;
    commentsCount?: number;
    sharesCount?: number;
  }
) {
  if (!(await isAdminAuth())) return { success: false, error: "Unauthorized" };

  try {
    const splitTags = data.tags !== undefined
      ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : undefined;

    const post = await db.post.update({
      where: { id },
      data: {
        caption: data.caption,
        location: data.location,
        tags: splitTags,
        mediaUrl: data.mediaUrl,
        likesCount: data.likesCount,
        commentsCount: data.commentsCount,
        sharesCount: data.sharesCount,
      },
    });

    revalidateTag(HOME_FEED_CACHE_TAG, "max");
    return { success: true, post };
  } catch (error) {
    console.error("Error updating post:", error);
    const message = error instanceof Error ? error.message : "Failed to update post";
    return { success: false, error: message };
  }
}

export async function deleteAdminPost(id: string) {
  if (!(await isAdminAuth())) return { success: false, error: "Unauthorized" };

  try {
    await db.$transaction(async (tx) => {
      await tx.comment.deleteMany({ where: { postId: id } });
      await tx.like.deleteMany({ where: { postId: id } });
      await tx.save.deleteMany({ where: { postId: id } });
      await tx.postShare.deleteMany({ where: { postId: id } });
      await tx.notification.deleteMany({ where: { postId: id } });
      await tx.post.delete({ where: { id } });
    });

    revalidateTag(HOME_FEED_CACHE_TAG, "max");
    return { success: true };
  } catch (error) {
    console.error("Error deleting post:", error);
    const message = error instanceof Error ? error.message : "Failed to delete post";
    return { success: false, error: message };
  }
}

// ----------------------------------------------------
// 4. ERROR REPORTS CRUD
// ----------------------------------------------------
export async function getAdminErrors(search: string = "", page: number = 1, limit: number = 10) {
  if (!(await isAdminAuth())) return { success: false, error: "Unauthorized" };

  try {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
            { author: { name: { contains: search, mode: "insensitive" as const } } },
            { author: { username: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {};

    const [errors, total] = await Promise.all([
      db.errorReport.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, username: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.errorReport.count({ where }),
    ]);

    return { success: true, errors, total };
  } catch (error) {
    console.error("Error fetching admin errors:", error);
    return { success: false, error: "Failed to fetch error reports" };
  }
}

export async function createAdminError(data: {
  authorId: string;
  title: string;
  description?: string;
  code?: string;
  points?: number;
  category?: string;
  difficulty?: string;
  isSolved?: boolean;
}) {
  if (!(await isAdminAuth())) return { success: false, error: "Unauthorized" };

  try {
    const errorReport = await db.errorReport.create({
      data: {
        authorId: data.authorId,
        title: data.title,
        description: data.description || null,
        code: data.code || null,
        points: data.points !== undefined ? Number(data.points) : 0,
        category: (data.category as Categories) || null,
        difficulty: (data.difficulty as difficulties) || null,
        isSolved: !!data.isSolved,
      },
    });

    return { success: true, errorReport };
  } catch (error) {
    console.error("Error creating error report:", error);
    const message = error instanceof Error ? error.message : "Failed to create error report";
    return { success: false, error: message };
  }
}

export async function updateAdminError(
  id: string,
  data: {
    title?: string;
    description?: string | null;
    code?: string | null;
    points?: number;
    category?: string | null;
    difficulty?: string | null;
    isSolved?: boolean;
  }
) {
  if (!(await isAdminAuth())) return { success: false, error: "Unauthorized" };

  try {
    const errorReport = await db.errorReport.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        code: data.code,
        points: data.points !== undefined ? Number(data.points) : undefined,
        category: (data.category as Categories) || null,
        difficulty: (data.difficulty as difficulties) || null,
        isSolved: data.isSolved,
      },
    });

    return { success: true, errorReport };
  } catch (error) {
    console.error("Error updating error report:", error);
    const message = error instanceof Error ? error.message : "Failed to update error report";
    return { success: false, error: message };
  }
}

export async function deleteAdminError(id: string) {
  if (!(await isAdminAuth())) return { success: false, error: "Unauthorized" };

  try {
    await db.errorReport.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Error deleting error report:", error);
    const message = error instanceof Error ? error.message : "Failed to delete error report";
    return { success: false, error: message };
  }
}

// ----------------------------------------------------
// 5. SOLUTIONS CRUD
// ----------------------------------------------------
export async function getAdminSolutions(search: string = "", page: number = 1, limit: number = 10) {
  if (!(await isAdminAuth())) return { success: false, error: "Unauthorized" };

  try {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { content: { contains: search, mode: "insensitive" as const } },
            { error: { title: { contains: search, mode: "insensitive" as const } } },
            { author: { name: { contains: search, mode: "insensitive" as const } } },
            { author: { username: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {};

    const [solutions, total] = await Promise.all([
      db.solution.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, username: true } },
          error: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.solution.count({ where }),
    ]);

    return { success: true, solutions, total };
  } catch (error) {
    console.error("Error fetching admin solutions:", error);
    return { success: false, error: "Failed to fetch solutions" };
  }
}

export async function createAdminSolution(data: {
  errorId: string;
  authorId: string;
  content: string;
  isApproved?: boolean;
  rate?: number;
  earnedPoints?: number;
}) {
  if (!(await isAdminAuth())) return { success: false, error: "Unauthorized" };

  try {
    const solution = await db.solution.create({
      data: {
        errorId: data.errorId,
        authorId: data.authorId,
        content: data.content,
        isApproved: !!data.isApproved,
        rate: data.rate !== undefined ? Number(data.rate) : 0,
        earnedPoints: data.earnedPoints !== undefined ? Number(data.earnedPoints) : 0,
      },
    });

    return { success: true, solution };
  } catch (error) {
    console.error("Error creating solution:", error);
    const message = error instanceof Error ? error.message : "Failed to create solution";
    return { success: false, error: message };
  }
}

export async function updateAdminSolution(
  id: string,
  data: {
    content?: string;
    isApproved?: boolean;
    rate?: number;
    earnedPoints?: number;
  }
) {
  if (!(await isAdminAuth())) return { success: false, error: "Unauthorized" };

  try {
    const solution = await db.solution.update({
      where: { id },
      data: {
        content: data.content,
        isApproved: data.isApproved,
        rate: data.rate !== undefined ? Number(data.rate) : undefined,
        earnedPoints: data.earnedPoints !== undefined ? Number(data.earnedPoints) : undefined,
      },
    });

    return { success: true, solution };
  } catch (error) {
    console.error("Error updating solution:", error);
    const message = error instanceof Error ? error.message : "Failed to update solution";
    return { success: false, error: message };
  }
}

export async function deleteAdminSolution(id: string) {
  if (!(await isAdminAuth())) return { success: false, error: "Unauthorized" };

  try {
    await db.solution.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Error deleting solution:", error);
    const message = error instanceof Error ? error.message : "Failed to delete solution";
    return { success: false, error: message };
  }
}

// ----------------------------------------------------
// 6. COMMENTS CRUD
// ----------------------------------------------------
export async function getAdminComments(search: string = "", page: number = 1, limit: number = 10) {
  if (!(await isAdminAuth())) return { success: false, error: "Unauthorized" };

  try {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { content: { contains: search, mode: "insensitive" as const } },
            { author: { name: { contains: search, mode: "insensitive" as const } } },
            { author: { username: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {};

    const [comments, total] = await Promise.all([
      db.comment.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, username: true } },
          post: { select: { id: true, caption: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.comment.count({ where }),
    ]);

    return { success: true, comments, total };
  } catch (error) {
    console.error("Error fetching admin comments:", error);
    return { success: false, error: "Failed to fetch comments" };
  }
}

export async function createAdminComment(data: {
  postId: string;
  authorId: string;
  content: string;
  parentId?: string;
}) {
  if (!(await isAdminAuth())) return { success: false, error: "Unauthorized" };

  try {
    const comment = await db.comment.create({
      data: {
        postId: data.postId,
        authorId: data.authorId,
        content: data.content,
        parentId: data.parentId || null,
      },
    });

    // Increment commentsCount in post
    await db.post.update({
      where: { id: data.postId },
      data: { commentsCount: { increment: 1 } },
    });

    revalidateTag(HOME_FEED_CACHE_TAG, "max");
    return { success: true, comment };
  } catch (error) {
    console.error("Error creating comment:", error);
    const message = error instanceof Error ? error.message : "Failed to create comment";
    return { success: false, error: message };
  }
}

export async function updateAdminComment(id: string, data: { content?: string; likesCount?: number }) {
  if (!(await isAdminAuth())) return { success: false, error: "Unauthorized" };

  try {
    const comment = await db.comment.update({
      where: { id },
      data: {
        content: data.content,
        likesCount: data.likesCount !== undefined ? Number(data.likesCount) : undefined,
      },
    });

    return { success: true, comment };
  } catch (error) {
    console.error("Error updating comment:", error);
    const message = error instanceof Error ? error.message : "Failed to update comment";
    return { success: false, error: message };
  }
}

export async function deleteAdminComment(id: string) {
  if (!(await isAdminAuth())) return { success: false, error: "Unauthorized" };

  try {
    const comment = await db.comment.findUnique({
      where: { id },
      select: { postId: true },
    });

    if (comment) {
      await db.$transaction([
        db.comment.delete({ where: { id } }),
        db.post.update({
          where: { id: comment.postId },
          data: { commentsCount: { decrement: 1 } },
        }),
      ]);
    }

    revalidateTag(HOME_FEED_CACHE_TAG, "max");
    return { success: true };
  } catch (error) {
    console.error("Error deleting comment:", error);
    const message = error instanceof Error ? error.message : "Failed to delete comment";
    return { success: false, error: message };
  }
}

export async function getAdminUserOptions() {
  if (!(await isAdminAuth())) return { success: false, error: "Unauthorized" };
  try {
    const users = await db.user.findMany({
      select: { id: true, name: true, username: true, email: true },
      orderBy: { name: "asc" },
    });
    return { success: true, users };
  } catch (error) {
    return { success: false, error: "Failed to fetch users list" };
  }
}

export async function getAdminErrorOptions() {
  if (!(await isAdminAuth())) return { success: false, error: "Unauthorized" };
  try {
    const errors = await db.errorReport.findMany({
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    });
    return { success: true, errors };
  } catch (error) {
    return { success: false, error: "Failed to fetch errors list" };
  }
}

export async function getAdminPostOptions() {
  if (!(await isAdminAuth())) return { success: false, error: "Unauthorized" };
  try {
    const posts = await db.post.findMany({
      select: { id: true, caption: true },
      orderBy: { createdAt: "desc" },
    });
    return {
      success: true,
      posts: posts.map((p) => ({
        id: p.id,
        caption: p.caption ? (p.caption.length > 50 ? p.caption.substring(0, 50) + "..." : p.caption) : `Post ${p.id.substring(0, 6)}`,
      })),
    };
  } catch (error) {
    return { success: false, error: "Failed to fetch posts list" };
  }
}
