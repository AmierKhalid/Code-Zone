"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Post } from "@/app/types/index";
import {
  toggleLikePost,
  toggleSavePost,
} from "@/app/actions/togglePostEngagement";
type PostStatsProps = {
  post: Post;
  currentUserId?: string;
  /** Grid tiles: no comment icon; save pinned to the far right */
  variant?: "default" | "grid";
};

function initialLiked(post: Post, currentUserId?: string) {
  return Boolean(
    currentUserId &&
    (post.likes?.some((l) => l.userId === currentUserId) ?? false),
  );
}

function initialSaved(post: Post, currentUserId?: string) {
  return Boolean(
    currentUserId &&
    (post.saves?.some((s) => s.userId === currentUserId) ?? false),
  );
}

const PostStats = ({
  post,
  currentUserId,
  variant = "default",
}: PostStatsProps) => {
  const router = useRouter();
  const [likesCount, setLikesCount] = useState(() => post.likesCount ?? 0);
  const [isLiked, setIsLiked] = useState(() =>
    initialLiked(post, currentUserId),
  );
  const [isSaved, setIsSaved] = useState(() =>
    initialSaved(post, currentUserId),
  );
  const [likePending, startLikeTransition] = useTransition();
  const [savePending, startSaveTransition] = useTransition();

  const handleLike = () => {
    if (!currentUserId) {
      toast.error("Sign in to like posts");
      return;
    }
    if (likePending) return;

    const prev = { isLiked, likesCount };
    const nextLiked = !isLiked;
    const nextCount = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1);
    setIsLiked(nextLiked);
    setLikesCount(nextCount);

    startLikeTransition(async () => {
      const result = await toggleLikePost(post.id);
      if (!result.success) {
        setIsLiked(prev.isLiked);
        setLikesCount(prev.likesCount);
        toast.error(result.error);
        return;
      }
      setIsLiked(result.liked);
      setLikesCount(result.likesCount);
      router.refresh();
    });
  };

  const handleSave = () => {
    if (!currentUserId) {
      toast.error("Sign in to save posts");
      return;
    }
    if (savePending) return;

    const prev = isSaved;
    setIsSaved(!isSaved);

    startSaveTransition(async () => {
      const result = await toggleSavePost(post.id);
      if (!result.success) {
        setIsSaved(prev);
        toast.error(result.error);
        return;
      }
      setIsSaved(result.saved);
      router.refresh();
    });
  };

  if (variant === "grid") {
    return (
      <div className="flex w-full min-w-0 items-center justify-between gap-2 z-20">
        <div className="flex items-center gap-2 shrink-0">
          <img
            src={isLiked ? "/icons/liked.svg" : "/icons/like.svg"}
            alt="like"
            width={20}
            height={20}
            onClick={handleLike}
            className={
              likePending ? "cursor-pointer opacity-80" : "cursor-pointer"
            }
          />
          <p className="small-medium lg:base-medium">{likesCount}</p>
        </div>
        <div className="flex shrink-0 ml-auto">
          <img
            src={isSaved ? "/icons/saved.svg" : "/icons/save.svg"}
            alt="save"
            width={20}
            height={20}
            onClick={handleSave}
            className={
              savePending ? "cursor-pointer opacity-80" : "cursor-pointer"
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center z-20">
      <div className="flex gap-2 mr-5">
        <img
          src={isLiked ? "/icons/liked.svg" : "/icons/like.svg"}
          alt="like"
          width={20}
          height={20}
          onClick={handleLike}
          className={
            likePending ? "cursor-pointer opacity-80" : "cursor-pointer"
          }
        />
        <p className="small-medium lg:base-medium">{likesCount}</p>
        <img
          src="/icons/chat.svg"
          alt="comment"
          width={20}
          height={20}
          className="cursor-pointer"
        />
      </div>

      <div className="flex gap-2 mr-5" />

      <div className="flex gap-2">
        <img
          src={isSaved ? "/icons/saved.svg" : "/icons/save.svg"}
          alt="save"
          width={20}
          height={20}
          onClick={handleSave}
          className={
            savePending ? "cursor-pointer opacity-80" : "cursor-pointer"
          }
        />
      </div>
    </div>
  );
};

export default PostStats;
