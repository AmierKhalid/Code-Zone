"use client";

import Link from "next/link";
import type { Post } from "@/app/types/index";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import PostStats from "./PostStats";

type GridPostListProps = {
  posts: Post[];
  showUser?: boolean;
  showStats?: boolean;
};

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
      {posts.map((post) => {
        const imageSrc =
          post.mediaUrl?.trim() || "/icons/profile-placeholder.svg";

        const likedByMe = Boolean(
          user?.id && post.likes?.some((l) => l.userId === user.id),
        );
        const savedByMe = Boolean(
          user?.id && post.saves?.some((s) => s.userId === user.id),
        );
        const postStatsKey = `${post.id}:${post.likesCount}:${post.sharesCount ?? 0}:${likedByMe ? 1 : 0}:${savedByMe ? 1 : 0}`;

        return (
          <li key={post.id} className="relative min-w-80 h-80">
            <Link href={`/posts/${post.id}`} className="grid-post_link">
              <img
                src={imageSrc}
                alt="post"
                className="h-full w-full object-cover"
              />
            </Link>

            <div className="grid-post_user">
              {showUser && post.author && (
                <div className="flex items-center justify-start gap-2 flex-1 min-w-0">
                  <img
                    src={post.author.image || "/icons/profile-placeholder.svg"}
                    alt="creator"
                    className="w-8 h-8 rounded-full shrink-0 object-cover"
                  />
                  <p className="line-clamp-1 text-light-1 small-medium">
                    {post.author.name ?? post.author.username ?? "User"}
                  </p>
                </div>
              )}

              {showStats && (
                <div
                  className={
                    showUser && post.author
                      ? "flex-1 min-w-0 pl-2"
                      : "w-full min-w-0"
                  }
                >
                  <PostStats
                    key={postStatsKey}
                    post={post}
                    currentUserId={user?.id}
                    variant="grid"
                  />
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
