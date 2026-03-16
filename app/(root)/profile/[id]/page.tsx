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
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col items-center">

      <div className="w-full flex flex-col items-center text-center gap-6 md:flex-row md:items-center md:justify-center md:text-left md:gap-10">

        <Image
          src={profileUser.image ?? "/icons/profile-placeholder.svg"}
          alt={displayName}
          className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 lg:w-48 lg:h-48 rounded-full object-cover"
          width={192}
          height={192}
        />

        <div className="flex flex-col items-center md:items-start max-w-xl">

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            {displayName}
          </h1>

          <p className="text-lg sm:text-xl text-gray-500">
            {displayUsername}
          </p>

          {profileUser.bio && (
            <p className="mt-3 text-base sm:text-lg text-gray-700 leading-relaxed">
              {profileUser.bio}
            </p>
          )}

          <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-600">
            <span>Points: {profileUser.totalPoints ?? 0}</span>
            {profileUser.isVerified && <span>Verified</span>}
          </div>

        </div>
      </div>

      <div className="w-full mt-14 text-center md:text-left">
        <h2 className="text-xl sm:text-2xl font-bold mb-6">
          Posts
        </h2>

        <p className="text-gray-500">
          No posts yet.
        </p>
      </div>

    </div>
  );
}