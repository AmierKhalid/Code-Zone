"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type ProfileTabsProps = {
  profileId: string;
};

export default function ProfileTabs({ profileId }: ProfileTabsProps) {
  const pathname = usePathname();
  const base = `/profile/${profileId}`;
  const postsPath = base;
  const likedPath = `${base}/liked-posts`;
  const savedPath = `${base}/saved-posts`;

  const isPosts =
    pathname === base || pathname === `${base}/`;
  const isLiked = pathname === likedPath;
  const isSaved = pathname === savedPath;

  return (
    <div className="flex max-w-5xl w-full">
      <Link
        href={postsPath}
        className={`profile-tab rounded-l-lg ${isPosts ? "!bg-dark-3" : ""}`}
      >
        <img src="/icons/posts.svg" alt="posts" width={20} height={20} />
        Posts
      </Link>
      <Link
        href={likedPath}
        className={`profile-tab ${isLiked ? "!bg-dark-3" : ""}`}
      >
        <img src="/icons/like.svg" alt="liked" width={20} height={20} />
        Liked Posts
      </Link>
      <Link
        href={savedPath}
        className={`profile-tab rounded-r-lg ${isSaved ? "!bg-dark-3" : ""}`}
      >
        <img src="/icons/save.svg" alt="saved" width={20} height={20} />
        Saved Posts
      </Link>
    </div>
  );
}
