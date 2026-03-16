import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Image from "next/image";

import { IUser } from "@/app/types";

interface ProfilePageProps {
  params: { id: string };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const profileUserRaw = await db.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      accountId: true,
      name: true,
      username: true,
      email: true,
      image: true,
      bio: true,
      accountType: true,
      totalPoints: true,
      isVerified: true,
    },
  });

  if (!profileUserRaw) {
    notFound();
  }

  const profileUser: IUser = {
    ...profileUserRaw,
    totalPoints: profileUserRaw.totalPoints ?? null,
    isVerified: profileUserRaw.isVerified ?? null,
    name: profileUserRaw.name ?? null,
    username: profileUserRaw.username ?? null,
    bio: profileUserRaw.bio ?? null,
    image: profileUserRaw.image ?? null,
  };

  const displayName = profileUser.name ?? profileUser.username ?? "User";
  const displayUsername = profileUser.username
    ? `@${profileUser.username}`
    : "";

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
        <Image
          src={profileUser.image ?? "/icons/profile-placeholder.svg"}
          alt={displayName}
          className="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover"
          width={192}
          height={192}
        />
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-bold">{displayName}</h1>
          <p className="text-xl text-gray-500">{displayUsername}</p>
          {profileUser.bio && <p className="mt-4 text-lg">{profileUser.bio}</p>}
          <div className="mt-4 flex gap-4 text-sm text-gray-600">
            <span>Points: {profileUser.totalPoints ?? 0}</span>
            {profileUser.isVerified && <span>Verified</span>}
          </div>
        </div>
      </div>
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Posts</h2>
        <p className="text-gray-500">No posts yet.</p>
       
      </div>
    </div>
  );
}
