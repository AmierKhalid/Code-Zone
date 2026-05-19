"use client";

import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Post } from "@/app/types/index";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import PostStats from "./PostStats";

type GridPostListProps = {
  posts: Post[];
  showUser?: boolean;
  showStats?: boolean;
};

const GridPostItem = memo(function GridPostItem({
  post,
  currentUserId,
  showUser,
  showStats,
}: {
  post: Post;
  currentUserId?: string;
  showUser: boolean;
  showStats: boolean;
}) {
  const imageSrc =
    post.mediaUrl?.trim() || "/icons/profile-placeholder.svg";

  const likedByMe = Boolean(
    currentUserId && post.likes?.some((l) => l.userId === currentUserId),
  );
  const savedByMe = Boolean(
    currentUserId && post.saves?.some((s) => s.userId === currentUserId),
  );
  const postStatsKey = `${post.id}:${post.likesCount}:${post.sharesCount ?? 0}:${likedByMe ? 1 : 0}:${savedByMe ? 1 : 0}`;

  return (
    <li className="relative w-full h-80 rounded-[24px] border border-dark-4 overflow-hidden bg-dark-2 isolate">
      <Link href={`/posts/${post.id}`} className="absolute inset-0 w-full h-full z-0">
        <Image
          src={imageSrc}
          alt="post"
          className="h-full w-full object-cover"
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading="lazy"
        />
      </Link>

      <div className="grid-post_user pointer-events-none z-10">
        {showUser && post.author && (
          <div className="flex items-center justify-start gap-2 flex-1 min-w-0 pointer-events-auto">
            <Link href={`/profile/${post.author.id}`} className="flex items-center gap-2">
              <Image
                src={post.author.image || "/icons/profile-placeholder.svg"}
                alt={post.author.name || "creator"}
                className="w-8 h-8 rounded-full shrink-0 object-cover"
                width={32}
                height={32}
              />
              <p className="line-clamp-1 text-light-1 small-medium hover:underline">
                {post.author.name ?? post.author.username ?? "User"}
              </p>
            </Link>
          </div>
        )}

        {showStats && (
          <div
            className={`pointer-events-auto ${
              showUser && post.author
                ? "flex-1 min-w-0 pl-2"
                : "w-full min-w-0"
            }`}
          >
            <PostStats
              key={postStatsKey}
              post={post}
              currentUserId={currentUserId}
              variant="grid"
            />
          </div>
        )}
      </div>
    </li>
  );
});

export default function GridPostList({
  posts,
  showUser = true,
  showStats = true,
}: GridPostListProps) {
  const { user } = useCurrentUser();

  if (posts.length === 0) {
    return (
      <div className="flex-center w-full min-h-[200px]">
        <p className="text-light-4 small-medium">No posts to display</p>
      </div>
    );
  }

  return (
    <ul className="grid-container">
      {posts.map((post) => (
        <GridPostItem
          key={post.id}
          post={post}
          currentUserId={user?.id}
          showUser={showUser}
          showStats={showStats}
        />
      ))}
    </ul>
  );
}
