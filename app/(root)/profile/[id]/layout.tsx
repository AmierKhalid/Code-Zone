import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
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

  return (
    <div className="profile-container">
      <ProfileHeader
        profile={profile}
        profileId={id}
        currentUserId={currentUserId}
      />
      <div className="w-full max-w-5xl flex flex-col flex-1">{children}</div>
    </div>
  );
}
