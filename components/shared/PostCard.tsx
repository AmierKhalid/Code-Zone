"use client";

import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Post } from "@/app/types/index";
import PostStats from "./PostStats";

type PostCardProps = {
  post: Post;
  currentUserId?: string;
};

const PostCard = memo(function PostCard({ post, currentUserId }: PostCardProps) {
  if (!post.author) return null;

  const likedByMe = Boolean(
    currentUserId && post.likes?.some((l) => l.userId === currentUserId),
  );
  const savedByMe = Boolean(
    currentUserId && post.saves?.some((s) => s.userId === currentUserId),
  );
  const postStatsKey = `${post.id}:${post.likesCount}:${post.sharesCount ?? 0}:${likedByMe ? 1 : 0}:${savedByMe ? 1 : 0}`;

  return (
    <div className="post-card">
      <div className="flex-between">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.author.id}`}>
            <Image
              src={post.author.image || "/icons/profile-placeholder.svg"}
              alt={post.author.name || "creator"}
              className="w-12 h-12 rounded-full object-cover"
              width={48}
              height={48}
            />
          </Link>

          <div className="flex flex-col">
            <p className="base-medium lg:body-bold text-light-1">
              {post.author.name || post.author.username}
            </p>
            <div className="flex-center gap-2 text-light-3">
              <p suppressHydrationWarning className="subtle-semibold lg:small-regular">
                {new Date(post.createdAt).toLocaleDateString()}
              </p>
              {post.location && (
                <>
                  •
                  <p className="subtle-semibold lg:small-regular">
                    {post.location}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <Link
          href={`/update-post/${post.id}`}
          prefetch={false}
          className={currentUserId !== post.author.id ? "hidden" : ""}
        >
          <Image src="/icons/edit.svg" alt="edit" width={20} height={20} />
        </Link>
      </div>

      <Link href={`/posts/${post.id}`}>
        <div className="small-medium lg:base-medium py-5">
          <p>{post.content}</p>
          {post.tags && post.tags.length > 0 && (
            <ul className="flex gap-1 mt-2">
              {post.tags.map((tag: string, index: number) => (
                <li
                  key={`${tag}${index}`}
                  className="text-light-3 small-regular"
                >
                  #{tag}
                </li>
              ))}
            </ul>
          )}
        </div>

        {post.mediaUrl && (
          <Image
            src={post.mediaUrl}
            alt="post media"
            className="post-card_img"
            width={600}
            height={450}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
            loading="lazy"
          />
        )}
      </Link>

      <PostStats key={postStatsKey} post={post} currentUserId={currentUserId} />
    </div>
  );
});

export default PostCard;
