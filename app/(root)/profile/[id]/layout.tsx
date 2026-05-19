import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getFollowState } from "@/app/actions/userAction";
import { getProfileUser } from "@/lib/profileData";
import ProfileHeader from "@/components/shared/ProfileHeader";
import ProfileTabs from "@/components/shared/ProfileTabs";

export default async function ProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Parallelize: fetch profile + resolve current user identity at the same time
  const [profile, { userId }] = await Promise.all([
    getProfileUser(id),
    auth(),
  ]);
  if (!profile) notFound();

  const currentUserId = userId
    ? (
        await db.user.findUnique({
          where: { accountId: userId },
          select: { id: true },
        })
      )?.id ?? null
    : null;

  const isOwnProfile = currentUserId === id;

  const followState =
    currentUserId && !isOwnProfile
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

      {/* Tab bar — always show Posts; show Liked/Saved only for the profile owner */}
      <ProfileTabs profileId={id} isOwnProfile={isOwnProfile} />

      <div className="flex min-h-0 w-full max-w-5xl flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}
