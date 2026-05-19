"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

type ProfileTabsProps = {
  profileId: string;
  isOwnProfile: boolean;
};

export default function ProfileTabs({ profileId, isOwnProfile }: ProfileTabsProps) {
  const pathname = usePathname();
  const base = `/profile/${profileId}`;
  const likedPath = `${base}/liked-posts`;
  const savedPath = `${base}/saved-posts`;

  const isPosts = pathname === base || pathname === `${base}/`;
  const isLiked = pathname === likedPath;
  const isSaved = pathname === savedPath;

  return (
    <div className="flex max-w-5xl w-full">
      <Link
        href={base}
        className={`profile-tab rounded-l-lg ${isPosts ? "profile-tab--active" : ""} ${
          !isOwnProfile ? "rounded-r-lg" : ""
        }`}
      >
        <Image src="/icons/posts.svg" alt="posts" width={20} height={20} />
        Posts
      </Link>

      {isOwnProfile && (
        <>
          <Link
            href={likedPath}
            className={`profile-tab ${isLiked ? "profile-tab--active" : ""}`}
          >
            <Image src="/icons/like.svg" alt="liked" width={20} height={20} />
            Liked Posts
          </Link>

          <Link
            href={savedPath}
            className={`profile-tab rounded-r-lg ${isSaved ? "profile-tab--active" : ""}`}
          >
            <Image src="/icons/save.svg" alt="saved" width={20} height={20} />
            Saved Posts
          </Link>
        </>
      )}
    </div>
  );
}
