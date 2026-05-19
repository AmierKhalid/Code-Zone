"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { saveUserToDB } from "@/app/actions/userAction";
import {
  CollabInviteStatus,
  NotificationType,
} from "@/lib/generated/prisma/client";

async function getDbUserId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const u = await db.user.findUnique({
    where: { accountId: userId },
    select: { id: true },
  });
  return u?.id ?? null;
}

function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@+/, "").toLowerCase();
}

export async function sendCollabInvite(input: {
  inviteeUsername: string;
  sessionId: string;
}) {
  try {
    let inviterId = await getDbUserId();
    if (!inviterId) {
      const synced = await saveUserToDB();
      if (synced.success) {
        inviterId = await getDbUserId();
      }
    }
    if (!inviterId) {
      return {
        success: false as const,
        error:
          "Your profile is not synced yet. Refresh the page or sign out and sign in again, then try inviting.",
      };
    }

    const username = normalizeUsername(input.inviteeUsername);
    if (!username) {
      return { success: false as const, error: "Enter a username" };
    }

    const sessionId = input.sessionId.trim();
    if (!sessionId) {
      return { success: false as const, error: "Missing collaboration session" };
    }

    const invitee = await db.user.findFirst({
      where: {
        username: { equals: username, mode: "insensitive" },
      },
      select: { id: true, username: true },
    });

    if (!invitee) {
      return { success: false as const, error: "User not found" };
    }

    if (invitee.id === inviterId) {
      return { success: false as const, error: "You cannot invite yourself" };
    }

    await db.$transaction(async (tx) => {
      const pending = await tx.collabInvite.findMany({
        where: {
          inviterId,
          inviteeId: invitee.id,
          status: CollabInviteStatus.PENDING,
        },
        select: { id: true },
      });
      if (pending.length > 0) {
        await tx.collabInvite.deleteMany({
          where: { id: { in: pending.map((p) => p.id) } },
        });
      }

      const invite = await tx.collabInvite.create({
        data: {
          sessionId,
          inviterId,
          inviteeId: invitee.id,
          status: CollabInviteStatus.PENDING,
        },
      });

      await tx.notification.create({
        data: {
          recipientId: invitee.id,
          actorId: inviterId,
          type: NotificationType.COLLAB_INVITE,
          postId: null,
          collabInviteId: invite.id,
          isRead: false,
        },
      });
    });

    revalidatePath("/", "layout");
    return { success: true as const };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send invite";
    return { success: false as const, error: message };
  }
}

export async function respondToCollabInvite(input: {
  inviteId: string;
  accept: boolean;
}) {
  try {
    let me = await getDbUserId();
    if (!me) {
      const synced = await saveUserToDB();
      if (synced.success) me = await getDbUserId();
    }
    if (!me) {
      return {
        success: false as const,
        error:
          "Your profile is not synced yet. Refresh the page or sign in again.",
      };
    }

    const invite = await db.collabInvite.findFirst({
      where: { id: input.inviteId, inviteeId: me },
      select: { id: true, sessionId: true, status: true },
    });

    if (!invite) {
      return { success: false as const, error: "Invite not found" };
    }

    if (invite.status !== CollabInviteStatus.PENDING) {
      return {
        success: false as const,
        error: "This invite is no longer pending",
      };
    }

    if (input.accept) {
      await db.$transaction([
        db.collabInvite.update({
          where: { id: invite.id },
          data: { status: CollabInviteStatus.ACCEPTED },
        }),
        db.notification.updateMany({
          where: { collabInviteId: invite.id },
          data: { isRead: true },
        }),
      ]);
    } else {
      await db.collabInvite.delete({ where: { id: invite.id } });
    }

    revalidatePath("/", "layout");
    return {
      success: true as const,
      sessionId: input.accept ? invite.sessionId : undefined,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update invite";
    return { success: false as const, error: message };
  }
}
