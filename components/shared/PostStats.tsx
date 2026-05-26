"use client";

import {
  useState,
  useTransition,
  useCallback,
  memo
} from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Post } from "@/app/types/index";
import { shareOrCopyLink } from "@/lib/shareLink";

type PostStatsProps = {
  post: Post;
  currentUserId?: string;
  /** Grid tiles: no comment icon; save pinned to the far right */
  variant?: "default" | "grid";
  /** Opens comments UI (e.g. sheet on post detail) instead of scrolling to #post-comments */
  onCommentClick?: () => void;
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

const PostStats = memo(function PostStats({
  post,
  currentUserId,
  variant = "default",
  onCommentClick,
}: PostStatsProps) {
  const router = useRouter();
  const [likesCount, setLikesCount] = useState(() => post.likesCount ?? 0);
  const [sharesCount, setSharesCount] = useState(() => post.sharesCount ?? 0);
  const [isLiked, setIsLiked] = useState(() =>
    initialLiked(post, currentUserId),
  );
  const [isSaved, setIsSaved] = useState(() =>
    initialSaved(post, currentUserId),
  );
  const [likePending, startLikeTransition] = useTransition();
  const [savePending, startSaveTransition] = useTransition();
  const [sharePending, startShareTransition] = useTransition();

  const handleLike = useCallback(() => {
    if (!currentUserId) {
      toast.error("Sign in to like posts");
      return;
    }
    if (likePending) return;

    // Optimistically update
    setIsLiked((prevLiked) => {
      const nextLiked = !prevLiked;
      setLikesCount((prevCount) =>
        nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1)
      );
      
      startLikeTransition(async () => {
        try {
          const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || "Failed to update like");
          }
          const result = await res.json();
          setIsLiked(result.liked);
          setLikesCount(result.likesCount);
        } catch (error) {
          // Revert on error
          setIsLiked(prevLiked);
          setLikesCount((prevCount) =>
            prevLiked ? prevCount : Math.max(0, prevCount - 1)
          );
          toast.error(error instanceof Error ? error.message : "Failed to like post");
        }
      });

      return nextLiked;
    });
  }, [currentUserId, likePending, post.id]);

  const handleSave = useCallback(() => {
    if (!currentUserId) {
      toast.error("Sign in to save posts");
      return;
    }
    if (savePending) return;

    setIsSaved((prevSaved) => {
      const nextSaved = !prevSaved;
      
      startSaveTransition(async () => {
        try {
          const res = await fetch(`/api/posts/${post.id}/save`, { method: "POST" });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || "Failed to save post");
          }
          const result = await res.json();
          setIsSaved(result.saved);
        } catch (error) {
          setIsSaved(prevSaved);
          toast.error(error instanceof Error ? error.message : "Failed to save post");
        }
      });

      return nextSaved;
    });
  }, [currentUserId, post.id, savePending]);

  const handleShare = useCallback(() => {
    if (sharePending) return;

    startShareTransition(async () => {
      const caption = (post.content ?? "").trim();
      const text =
        caption.length > 160 ? `${caption.slice(0, 160)}…` : caption || undefined;

      try {
        const result = await shareOrCopyLink({
          path: `/posts/${post.id}`,
          title: `Post by ${post.author.name ?? post.author.username ?? "Code Zone"}`,
          text,
        });
        if (result === "cancelled") return;
        if (result === "copied") {
          toast.success("Link copied to clipboard");
        }

        if (currentUserId) {
          const res = await fetch(`/api/posts/${post.id}/share`, { method: "POST" });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || "Failed to record share");
          }
          const rec = await res.json();
          setSharesCount(rec.sharesCount);
        }
      } catch (e) {
        if (e instanceof Error && e.message === "CLIPBOARD_UNAVAILABLE") {
          toast.error(
            "Could not copy the link. Try copying from the address bar.",
          );
        } else {
          toast.error("Could not share this post.");
        }
      }
    });
  }, [currentUserId, post, sharePending]);

  const shareBlock = (
    <button
      type="button"
      onClick={handleShare}
      disabled={sharePending}
      className="flex items-center gap-1.5 text-light-2 hover:text-light-1 disabled:opacity-60"
      aria-label="Share post"
    >
      <Image
        src="/icons/share.svg"
        alt=""
        width={20}
        height={20}
        className={
          sharePending ? "cursor-pointer opacity-80" : "cursor-pointer"
        }
      />
      <span className="small-medium lg:base-medium">{sharesCount}</span>
    </button>
  );

  if (variant === "grid") {
    return (
      <div className="flex w-full min-w-0 items-center justify-end gap-5 z-20">
        <div className="flex shrink-0 items-center gap-3">
          <Image
            src={isLiked ? "/icons/liked.svg" : "/icons/like.svg"}
            alt="like"
            width={20}
            height={20}
            onClick={handleLike}
            className={
              likePending ? "cursor-pointer opacity-80" : "cursor-pointer"
            }
          />
          {shareBlock}
        </div>
        <Image
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
    );
  }

  return (
    <div className="flex justify-between items-center z-20">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mr-5">
        <Image
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
        {onCommentClick ? (
          <button
            type="button"
            onClick={onCommentClick}
            className="flex items-center gap-1.5 ml-1 text-light-2 hover:text-light-1"
          >
            <Image
              src="/icons/comment.svg"
              alt="Comments"
              width={20}
              height={20}
              className="cursor-pointer pointer-events-none"
            />
            <span className="small-medium lg:base-medium">
              {post.commentsCount ?? 0}
            </span>
          </button>
        ) : (
          <Link
            href={`/posts/${post.id}#post-comments`}
            className="flex items-center gap-1.5 ml-1 text-light-2 hover:text-light-1"
          >
            <Image
              src="/icons/comment.svg"
              alt="comment"
              width={20}
              height={20}
              className="cursor-pointer"
            />
            <span className="small-medium lg:base-medium">
              {post.commentsCount ?? 0}
            </span>
          </Link>
        )}
        <span className="ml-1">{shareBlock}</span>
      </div>

      <div className="flex gap-2 mr-5" />

      <div className="flex gap-2">
        <Image
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
});

export default PostStats;
