"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { SaveUserResult, CurrentUserResult } from "../types";

export async function saveUserToDB(): Promise<SaveUserResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const existingUser = await db.user.findUnique({
      where: { accountId: userId },
    });
    if (existingUser) {
      return { success: true };
    }

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    const primaryEmail = clerkUser.emailAddresses.find(
      (e: { id: string }) => e.id === clerkUser.primaryEmailAddressId,
    );
    const email =
      primaryEmail?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      return { success: false, error: "User has no email" };
    }

    const hasGoogle = clerkUser.externalAccounts?.some(
      (e: { provider: string }) => e.provider === "oauth_google",
    );
    const hasGithub = clerkUser.externalAccounts?.some(
      (e: { provider: string }) => e.provider === "oauth_github",
    );
    const accountType = hasGoogle
      ? ("google" as const)
      : hasGithub
        ? ("github" as const)
        : ("standard" as const);

    console.log(
      `[saveUserToDB] Processing user: ${userId} | ${email} | ${accountType}`,
    );

    const firstName = clerkUser.firstName ?? "";
    const lastName = clerkUser.lastName ?? "";
    const name = [firstName, lastName].filter(Boolean).join(" ") || null;
    let username = clerkUser.username ?? null;

    // Generate username if missing (common for Google)
    if (!username && email) {
      // Sanitize email handle: remove special chars, keep alphanumeric
      username = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
    }

    console.log(`[saveUserToDB] Resolved username: ${username}`);

    if (username) {
      const existingUserByUsername = await db.user.findUnique({
        where: { username },
      });
      if (existingUserByUsername && existingUserByUsername.email !== email) {
        username = `${username}_${Math.floor(Math.random() * 1000)}`;
        console.log(`[saveUserToDB] Username conflict resolved: ${username}`);
      }

      // If Clerk user is missing username, sync it back to Clerk as well
      if (!clerkUser.username) {
        await client.users.updateUser(userId, { username });
        console.log(`[saveUserToDB] Synced username to Clerk: ${username}`);
      }
    }

    // Check if user exists by email
    const existingUserByEmail = await db.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      console.log(
        `[saveUserToDB] Updating existing user: ${existingUserByEmail.id}`,
      );
      // Update the existing user's accountId to match the new Clerk ID
      await db.user.update({
        where: { id: existingUserByEmail.id },
        data: {
          accountId: clerkUser.id,
          image: existingUserByEmail.image ?? clerkUser.imageUrl,
          name: existingUserByEmail.name ?? name,
          username: existingUserByEmail.username ?? username,
        },
      });
      return { success: true };
    }

    console.log(`[saveUserToDB] Creating new user`);
    await db.user.create({
      data: {
        accountId: clerkUser.id,
        accountType,
        name,
        username,
        email,
        image: clerkUser.imageUrl ?? null,
      },
    });

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
    const { userId } = await auth();
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
