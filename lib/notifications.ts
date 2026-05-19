import { NotificationType } from "@/lib/generated/prisma/client";
import { createNotificationInternal } from "@/app/actions/notificationActions";

export interface ErrorNotificationData {
  errorId: string;
  errorTitle: string;
  solverId: string;
  solverName: string;
  authorId: string;
  solutionId?: string;
  points?: number;
  rating?: number;
  category?: string;
  newTitle?: string;
}

export async function notifyErrorSolved(data: ErrorNotificationData) {
  await createNotificationInternal({
    recipientId: data.authorId,
    actorId: data.solverId,
    type: NotificationType.ERROR_SOLVED,
    postId: data.errorId,
  });
}

export async function notifySolutionApproved(data: ErrorNotificationData) {
  await createNotificationInternal({
    recipientId: data.solverId,
    actorId: data.authorId,
    type: NotificationType.SOLUTION_APPROVED,
    postId: data.solutionId,
  });
}

export async function notifyTitleEarned(userId: string, newTitle: string) {
  await createNotificationInternal({
    recipientId: userId,
    actorId: userId, // Self notification for title promotion
    type: NotificationType.TITLE_EARNED,
    postId: null,
  });
}

export async function notifyNewErrorInCategory(userId: string, errorId: string, category: string) {
  await createNotificationInternal({
    recipientId: userId,
    actorId: userId, // System notification
    type: NotificationType.NEW_ERROR_IN_CATEGORY,
    postId: errorId,
  });
}

export async function notifySolutionRated(data: ErrorNotificationData) {
  await createNotificationInternal({
    recipientId: data.solverId,
    actorId: data.authorId,
    type: NotificationType.SOLUTION_RATED,
    postId: data.solutionId,
  });
}
