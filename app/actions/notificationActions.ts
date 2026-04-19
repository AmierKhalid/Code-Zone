"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NotificationType } from "@/lib/generated/prisma/client";

type CreateNotificationInput = {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  postId?: string | null;
};

async function getCurrentDbUserId() {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await db.user.findUnique({
    where: { accountId: userId },
    select: { id: true },
  });
  return user?.id ?? null;
}

async function createNotificationInternal(input: CreateNotificationInput) {
  if (input.actorId === input.recipientId) return null;

  if (input.postId) {
    return db.notification.upsert({
      where: {
        recipientId_actorId_postId_type: {
          recipientId: input.recipientId,
          actorId: input.actorId,
          postId: input.postId,
          type: input.type,
        },
      },
      update: {
        isRead: false,
        createdAt: new Date(),
      },
      create: {
        recipientId: input.recipientId,
        actorId: input.actorId,
        postId: input.postId,
        type: input.type,
      },
    });
  }

  const existing = await db.notification.findFirst({
    where: {
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: input.type,
      postId: null,
    },
    select: { id: true },
  });
  if (existing) {
    return db.notification.update({
      where: { id: existing.id },
      data: { isRead: false, createdAt: new Date() },
    });
  }

  return db.notification.create({
    data: {
      recipientId: input.recipientId,
      actorId: input.actorId,
      postId: null,
      type: input.type,
    },
  });
}

export async function createNotification(input: CreateNotificationInput) {
  try {
    await createNotificationInternal(input);
    return { success: true as const };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create notification";
    return { success: false as const, error: message };
  }
}

export async function createCommentNotification(input: {
  recipientId: string;
  actorId: string;
  postId: string;
}) {
  return createNotification({
    recipientId: input.recipientId,
    actorId: input.actorId,
    postId: input.postId,
    type: NotificationType.COMMENT,
  });
}

export async function getUnreadNotificationCount() {
  try {
    const dbUserId = await getCurrentDbUserId();
    if (!dbUserId) return { success: false as const, error: "Unauthorized" };

    const count = await db.notification.count({
      where: { recipientId: dbUserId, isRead: false },
    });
    return { success: true as const, count };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load unread count";
    return { success: false as const, error: message };
  }
}

export async function listMyNotifications(limit = 20) {
  try {
    const dbUserId = await getCurrentDbUserId();
    if (!dbUserId) return { success: false as const, error: "Unauthorized" };

    const notifications = await db.notification.findMany({
      where: { recipientId: dbUserId },
      orderBy: { createdAt: "desc" },
      take: Math.max(1, Math.min(limit, 50)),
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        post: {
          select: {
            id: true,
            caption: true,
          },
        },
      },
    });

    return { success: true as const, notifications };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load notifications";
    return { success: false as const, error: message };
  }
}

export async function markAllNotificationsRead() {
  try {
    const dbUserId = await getCurrentDbUserId();
    if (!dbUserId) return { success: false as const, error: "Unauthorized" };

    await db.notification.updateMany({
      where: { recipientId: dbUserId, isRead: false },
      data: { isRead: true },
    });

    return { success: true as const };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to mark as read";
    return { success: false as const, error: message };
  }
}

