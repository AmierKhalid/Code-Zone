"use client";

import { useEffect, useState } from "react";
import type { Post } from "@/app/types/index";
import PostStats from "@/components/shared/PostStats";
import PostCommentsModal from "@/components/shared/PostCommentsModal";
import type { MentionCandidate } from "@/lib/mentionUsers";
import type { PostCommentRow } from "@/lib/postComments";

type Props = {
  post: Post;
  currentUserId?: string;
  commentsFlat: PostCommentRow[];
  mentionCandidates: MentionCandidate[];
};

export default function PostDetailCommentsBridge({
  post,
  currentUserId,
  commentsFlat,
  mentionCandidates,
}: Props) {
  const [commentsOpen, setCommentsOpen] = useState(false);

  useEffect(() => {
    const syncFromHash = () => {
      if (typeof window === "undefined") return;
      if (window.location.hash === "#post-comments") {
        setCommentsOpen(true);
      }
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  return (
    <>
      <PostStats
        post={post}
        currentUserId={currentUserId}
        onCommentClick={() => setCommentsOpen(true)}
      />
      <PostCommentsModal
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        postId={post.id}
        initialComments={commentsFlat}
        mentionCandidates={mentionCandidates}
        currentUserId={currentUserId}
      />
    </>
  );
}
