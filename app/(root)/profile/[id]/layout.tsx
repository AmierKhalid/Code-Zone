import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getFollowState } from "@/app/actions/userAction";
import { getProfileUser } from "@/lib/profileData";
import ProfileHeader from "@/components/shared/ProfileHeader";

export default async function ProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getProfileUser(id);
  if (!profile) notFound();

  const { userId } = await auth();
  const currentUserId = userId
    ? (await db.user.findUnique({
        where: { accountId: userId },
        select: { id: true },
      }))?.id ?? null
    : null;
  const followState =
    currentUserId && currentUserId !== id
      ? await getFollowState(id)
      : { success: true as const, isFollowing: false };
  const initialIsFollowing =
    followState.success ? followState.isFollowing : false;

  return (
    <div className="profile-container">
      <ProfileHeader
        profile={profile}
        profileId={id}
        currentUserId={currentUserId}
        initialIsFollowing={initialIsFollowing}
      />
      <div className="flex min-h-0 w-full max-w-5xl flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}
