"use client";

import { MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PostComments from "@/components/shared/PostComments";
import type { MentionCandidate } from "@/lib/mentionUsers";
import type { PostCommentRow } from "@/lib/postComments";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  initialComments: PostCommentRow[];
  mentionCandidates: MentionCandidate[];
  currentUserId?: string;
};

export default function PostCommentsModal({
  open,
  onOpenChange,
  postId,
  initialComments,
  mentionCandidates,
  currentUserId,
}: Props) {
  const count = initialComments.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(88vh,860px)] w-[calc(100vw-2rem)] max-w-4xl flex-col gap-0 overflow-hidden rounded-3xl border border-dark-4 bg-dark-2 p-0 text-light-1 shadow-2xl sm:w-[min(96vw,56rem)]">
        <div
          className="h-1 w-full shrink-0 bg-gradient-to-r from-primary-500/20 via-primary-500 to-primary-500/20"
          aria-hidden
        />
        <DialogHeader className="shrink-0 space-y-1 border-b border-dark-4/90 px-5 pb-4 pt-4 text-left">
          <div className="flex items-start gap-3 pr-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-500/12 ring-1 ring-primary-500/25">
              <MessageCircle
                className="h-5 w-5 text-primary-500"
                strokeWidth={2}
                aria-hidden
              />
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <DialogTitle className="h3-bold text-light-1">
                Comments
              </DialogTitle>
              <DialogDescription className="small-regular text-light-3">
                {count === 0
                  ? "Start the thread"
                  : `${count} ${count === 1 ? "comment" : "comments"} on this post`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div
          id="post-comments"
          className="min-h-0 flex-1 overflow-y-auto custom-scrollbar px-4 pb-5 pt-1 md:px-5"
        >
          <PostComments
            postId={postId}
            initialComments={initialComments}
            mentionCandidates={mentionCandidates}
            currentUserId={currentUserId}
            variant="modal"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
