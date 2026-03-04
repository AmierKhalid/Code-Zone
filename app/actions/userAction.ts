"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  AccountType,
  ClerkProfile,
  CurrentUser,
  CurrentUserResult,
  SaveUserResult,
} from "@/app/types";

async function getAuthenticatedUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId ?? null;
}

async function fetchClerkUserAndClient(userId: string) {
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  return { client, clerkUser };
}

function extractPrimaryEmail(clerkUser: any): string {
  const primaryEmail = clerkUser.emailAddresses.find(
    (e: { id: string }) => e.id === clerkUser.primaryEmailAddressId
  );
  const email =
    primaryEmail?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new Error("User has no email");
  }
  return email;
}

function resolveAccountType(clerkUser: any): AccountType {
  const hasGoogle = clerkUser.externalAccounts?.some(
    (e: { provider: string }) => e.provider === "oauth_google"
  );
  const hasGithub = clerkUser.externalAccounts?.some(
    (e: { provider: string }) => e.provider === "oauth_github"
  );
  if (hasGoogle) return "google";
  if (hasGithub) return "github";
  return "standard";
}

function resolveName(clerkUser: any): string | null {
  const firstName = clerkUser.firstName ?? "";
  const lastName = clerkUser.lastName ?? "";
  const name = [firstName, lastName].filter(Boolean).join(" ");
  return name || null;
}

async function ensureUsernameInClerkAndDb(
  clerkUser: any,
  email: string,
  client: Awaited<ReturnType<typeof clerkClient>>
): Promise<string | null> {
  let username: string | null = clerkUser.username ?? null;

  if (!username && email) {
    username = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
  }

  if (!username) {
    return null;
  }

  const existingUserByUsername = await db.user.findUnique({
    where: { username },
  });

  if (existingUserByUsername && existingUserByUsername.email !== email) {
    username = `${username}_${Math.floor(Math.random() * 1000)}`;
  }

  if (!clerkUser.username) {
    await client.users.updateUser(clerkUser.id, { username });
  }

  return username;
}

async function buildClerkProfile(
  userId: string
): Promise<{ profile: ClerkProfile; client: Awaited<ReturnType<typeof clerkClient>> }> {
  const { client, clerkUser } = await fetchClerkUserAndClient(userId);
  const email = extractPrimaryEmail(clerkUser);
  const accountType = resolveAccountType(clerkUser);
  const name = resolveName(clerkUser);
  const username = await ensureUsernameInClerkAndDb(clerkUser, email, client);

  const profile: ClerkProfile = {
    clerkUserId: clerkUser.id,
    email,
    name,
    username,
    accountType,
    imageUrl: clerkUser.imageUrl ?? null,
  };

  return { profile, client };
}

async function upsertUserInDatabase(profile: ClerkProfile): Promise<void> {
  const existingUserByEmail = await db.user.findUnique({
    where: { email: profile.email },
  });

  if (existingUserByEmail) {
    await db.user.update({
      where: { id: existingUserByEmail.id },
      data: {
        accountId: profile.clerkUserId,
        image: existingUserByEmail.image ?? profile.imageUrl,
        name: existingUserByEmail.name ?? profile.name,
        username: existingUserByEmail.username ?? profile.username,
      },
    });
    return;
  }

  await db.user.create({
    data: {
      accountId: profile.clerkUserId,
      accountType: profile.accountType,
      name: profile.name,
      username: profile.username,
      email: profile.email,
      image: profile.imageUrl,
    },
  });
}

export async function saveUserToDB(): Promise<SaveUserResult> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const existingUser = await db.user.findUnique({
      where: { accountId: userId },
    });
    if (existingUser) {
      return { success: true };
    }

    const { profile } = await buildClerkProfile(userId);
    await upsertUserInDatabase(profile);

    return { success: true };
  } catch (error) {
    console.error("Error in saveUserToDB:", error);
    const message =
      error instanceof Error ? error.message : "Failed to save user";
    return { success: false, error: message };
  }
}

export async function getCurrentUser(): Promise<CurrentUserResult> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    let user = await db.user.findUnique({
      where: { accountId: userId },
    });

    if (!user) {
      const saved = await saveUserToDB();
      if (saved.success) {
        user = await db.user.findUnique({
          where: { accountId: userId },
        });
      }
      if (!user) {
        return { success: false, error: "User not found" };
      }
    }

    return {
      success: true,
      user: {
        id: user.id,
        accountId: user.accountId,
        name: user.name,
        username: user.username,
        email: user.email,
        image: user.image,
        bio: user.bio,
        accountType: user.accountType,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get user";
    return { success: false, error: message };
  }
}
