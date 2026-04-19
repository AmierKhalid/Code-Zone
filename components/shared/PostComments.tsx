"use client";

import Image from "next/image";
import Link from "next/link";
import { AtSign } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import { createComment, deleteComment } from "@/app/actions/commentActions";
import {
  buildCommentTree,
  type CommentTreeNode,
  type PostCommentRow,
} from "@/lib/postComments";
import {
  filterMentionCandidates,
  type MentionCandidate,
} from "@/lib/mentionUsers";
import { getActiveMention, replaceMentionToken } from "@/lib/mentionTyping";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function mentionLookup(users: MentionCandidate[]) {
  const byLower = new Map<string, { id: string; username: string }>();
  for (const u of users) {
    byLower.set(u.username.toLowerCase(), { id: u.id, username: u.username });
  }
  return byLower;
}

function CommentContentText({
  content,
  lookup,
}: {
  content: string;
  lookup: Map<string, { id: string; username: string }>;
}) {
  const parts = content.split(/(@[a-zA-Z0-9_]+)/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^@([a-zA-Z0-9_]+)$/);
        if (m) {
          const u = lookup.get(m[1].toLowerCase());
          if (u) {
            return (
              <Link
                key={i}
                href={`/profile/${u.id}`}
                className="text-primary-500 hover:underline font-medium"
              >
                @{u.username}
              </Link>
            );
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function formatCommentTime(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CandidateRow({
  u,
  active,
}: {
  u: MentionCandidate;
  active?: boolean;
}) {
  return (
    <div
      className={`flex cursor-pointer gap-2.5 rounded-xl px-2.5 py-2 transition-colors ${
        active
          ? "bg-primary-500/15 ring-1 ring-primary-500/40"
          : "hover:bg-dark-4/90"
      }`}
    >
      <Image
        src={u.image || "/icons/profile-placeholder.svg"}
        alt=""
        width={34}
        height={34}
        className="h-[34px] w-[34px] shrink-0 rounded-full object-cover"
      />
      <div className="min-w-0 flex-1 text-left">
        <p className="small-medium truncate text-light-1">
          {u.name ?? u.username}
        </p>
        <p className="tiny-medium text-light-4">@{u.username}</p>
      </div>
    </div>
  );
}

function MentionPicker({
  candidates,
  currentUserId,
  onPick,
  disabled,
}: {
  candidates: MentionCandidate[];
  currentUserId?: string;
  onPick: (username: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => filterMentionCandidates(candidates, currentUserId, query),
    [candidates, currentUserId, query],
  );

  if (candidates.filter((c) => c.id !== currentUserId).length === 0) {
    return null;
  }

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          disabled={disabled}
          onPointerDown={(e) => e.preventDefault()}
          className="h-9 gap-1.5 rounded-xl border border-dark-4/80 bg-dark-4/40 px-2.5 text-light-3 shadow-sm transition hover:border-primary-500/30 hover:bg-dark-4 hover:text-light-1"
        >
          <AtSign className="h-4 w-4 shrink-0 text-primary-500" aria-hidden />
          <span className="small-medium">Mention</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="top"
        className="w-[min(300px,calc(100vw-2rem))] p-0"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div
          className="border-b border-dark-4 p-2"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Input
            placeholder="Search people…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            className="h-9 rounded-lg border-dark-4 bg-dark-3 text-sm text-light-1 placeholder:text-light-4 focus-visible:ring-primary-500"
          />
        </div>
        <div className="max-h-[240px] overflow-y-auto custom-scrollbar p-1.5">
          {filtered.length === 0 ? (
            <p className="px-2 py-6 text-center small-regular text-light-4">
              No one matches
            </p>
          ) : (
            filtered.map((u) => (
              <DropdownMenuItem
                key={u.id}
                className="cursor-pointer rounded-xl p-0 focus:bg-transparent"
                onSelect={() => {
                  onPick(u.username);
                  setOpen(false);
                  setQuery("");
                }}
              >
                <CandidateRow u={u} />
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CommentBranch({
  node,
  depth,
  currentUserId,
  lookup,
  replyParentId,
  setReplyParentId,
  onDeleted,
}: {
  node: CommentTreeNode;
  depth: number;
  currentUserId?: string;
  lookup: Map<string, { id: string; username: string }>;
  replyParentId: string | null;
  setReplyParentId: (id: string | null) => void;
  onDeleted: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const isMine = currentUserId === node.authorId;

  const handleDelete = () => {
    if (!confirm("Delete this comment and its replies?")) return;
    startTransition(async () => {
      const res = await deleteComment(node.id);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Comment removed");
      onDeleted();
    });
  };

  return (
    <div
      className={
        depth > 0
          ? "mt-3 ml-1 border-l-2 border-dark-4/80 pl-3 md:ml-3 md:pl-4"
          : "mt-3 first:mt-0"
      }
    >
      <div className="group/row -mx-2 flex gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-dark-4/35">
        <Link href={`/profile/${node.author.id}`} className="shrink-0">
          <Image
            src={node.author.image || "/icons/profile-placeholder.svg"}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover ring-2 ring-dark-4/50 md:h-11 md:w-11"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <Link
              href={`/profile/${node.author.id}`}
              className="small-semibold md:base-medium text-light-1 hover:underline"
            >
              {node.author.name ?? node.author.username ?? "User"}
            </Link>
            <span className="tiny-medium text-light-4">
              @{node.author.username ?? "user"}
            </span>
            <span className="tiny-medium text-light-4">
              · {formatCommentTime(node.createdAt)}
            </span>
          </div>
          <p className="small-regular md:base-regular mt-1 whitespace-pre-wrap break-words text-light-2">
            <CommentContentText content={node.content} lookup={lookup} />
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setReplyParentId(replyParentId === node.id ? null : node.id)
              }
              className="tiny-medium text-primary-500 hover:underline md:small-medium"
            >
              {replyParentId === node.id ? "Cancel reply" : "Reply"}
            </button>
            {isMine && (
              <button
                type="button"
                disabled={pending}
                onClick={handleDelete}
                className="tiny-medium text-red hover:underline disabled:opacity-50 md:small-medium"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {node.replies.map((r) => (
        <CommentBranch
          key={r.id}
          node={r}
          depth={depth + 1}
          currentUserId={currentUserId}
          lookup={lookup}
          replyParentId={replyParentId}
          setReplyParentId={setReplyParentId}
          onDeleted={onDeleted}
        />
      ))}
    </div>
  );
}

type Props = {
  postId: string;
  initialComments: PostCommentRow[];
  mentionCandidates: MentionCandidate[];
  currentUserId?: string;
  variant?: "inline" | "modal";
};

export default function PostComments({
  postId,
  initialComments,
  mentionCandidates,
  currentUserId,
  variant = "inline",
}: Props) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionListRef = useRef<HTMLDivElement>(null);
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [mentionContext, setMentionContext] = useState<{
    start: number;
    query: string;
  } | null>(null);
  const [mentionHighlight, setMentionHighlight] = useState(0);
  const [pending, startTransition] = useTransition();

  const lookup = useMemo(
    () => mentionLookup(mentionCandidates),
    [mentionCandidates],
  );
  const tree = buildCommentTree(initialComments);

  const filteredInline = useMemo(
    () =>
      mentionContext
        ? filterMentionCandidates(
            mentionCandidates,
            currentUserId,
            mentionContext.query,
          )
        : [],
    [mentionContext, mentionCandidates, currentUserId],
  );

  useEffect(() => {
    setMentionHighlight(0);
  }, [mentionContext?.query]);

  useEffect(() => {
    setMentionHighlight((h) =>
      filteredInline.length === 0 ? 0 : Math.min(h, filteredInline.length - 1),
    );
  }, [filteredInline.length]);

  useLayoutEffect(() => {
    if (!mentionListRef.current || filteredInline.length === 0) return;
    const row = mentionListRef.current.querySelector<HTMLElement>(
      `[data-mention-index="${mentionHighlight}"]`,
    );
    row?.scrollIntoView({ block: "nearest" });
  }, [mentionHighlight, filteredInline.length, mentionContext]);

  const syncMentionFromTextarea = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const active = getActiveMention(ta.value, ta.selectionStart);
    setMentionContext(active);
  }, []);

  const applyMention = useCallback((username: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setBody((b) => {
        const needsSpace = b.length > 0 && !/\s$/.test(b);
        return b + (needsSpace ? " " : "") + `@${username} `;
      });
      setMentionContext(null);
      return;
    }
    const value = ta.value;
    const cur = ta.selectionStart;
    const active = getActiveMention(value, cur);
    if (active) {
      const { value: next, caret } = replaceMentionToken(
        value,
        active.start,
        cur,
        username,
      );
      setBody(next);
      setMentionContext(null);
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(caret, caret);
      });
      return;
    }
    const before = value.slice(0, cur);
    const after = value.slice(ta.selectionEnd);
    const token = `@${username} `;
    const next = before + token + after;
    setBody(next);
    setMentionContext(null);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = cur + token.length;
      ta.setSelectionRange(pos, pos);
    });
  }, []);

  const submit = useCallback(() => {
    const text = body.trim();
    if (!text) {
      toast.error("Write something first");
      return;
    }
    if (!currentUserId) {
      toast.error("Sign in to comment");
      return;
    }

    startTransition(async () => {
      const res = await createComment({
        postId,
        content: text,
        parentId: replyParentId,
      });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setBody("");
      setReplyParentId(null);
      setMentionContext(null);
      toast.success("Comment posted");
      router.refresh();
    });
  }, [body, currentUserId, postId, replyParentId, router]);

  const handleTextareaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    const menuOpen = Boolean(mentionContext && filteredInline.length > 0);

    if (menuOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionHighlight((i) => (i + 1) % filteredInline.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionHighlight(
          (i) => (i - 1 + filteredInline.length) % filteredInline.length,
        );
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const u = filteredInline[mentionHighlight];
        if (u) applyMention(u.username);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionContext(null);
        return;
      }
    } else if (mentionContext && e.key === "Escape") {
      e.preventDefault();
      setMentionContext(null);
      return;
    }

    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
  };

  const isModal = variant === "modal";
  const replyTarget = replyParentId
    ? initialComments.find((c) => c.id === replyParentId)
    : null;

  const canMentionAnyone =
    mentionCandidates.filter((c) => c.id !== currentUserId).length > 0;

  return (
    <section
      id={isModal ? undefined : "post-comments"}
      className={`w-full ${isModal ? "pt-1 pb-1" : "mt-8 md:mt-10"}`}
    >
      {!isModal && (
        <h3 className="body-bold md:h3-bold mb-4 border-b border-dark-4 pb-3">
          Comments{" "}
          <span className="small-medium font-normal text-light-3">
            ({initialComments.length})
          </span>
        </h3>
      )}

      {currentUserId ? (
        <div
          className={`relative rounded-2xl border border-dark-4/90 bg-gradient-to-br from-dark-3/80 to-dark-4/40 p-4 shadow-inner md:p-5 ${
            isModal ? "mb-3" : "mb-8"
          }`}
        >
          {replyTarget && (
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-primary-500/25 bg-primary-500/10 px-3 py-2 small-regular text-light-2">
              <span>
                Replying to{" "}
                <span className="font-medium text-primary-500">
                  @{replyTarget.author.username ?? "user"}
                </span>
              </span>
              <button
                type="button"
                className="ml-auto text-light-4 underline transition hover:text-light-2"
                onClick={() => setReplyParentId(null)}
              >
                Cancel
              </button>
            </div>
          )}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => {
                const v = e.target.value;
                setBody(v);
                setMentionContext(getActiveMention(v, e.target.selectionStart));
              }}
              onSelect={syncMentionFromTextarea}
              onKeyUp={syncMentionFromTextarea}
              onKeyDown={handleTextareaKeyDown}
              placeholder={
                replyParentId
                  ? "Write a reply…"
                  : "Write a comment… Type @ to mention"
              }
              className="min-h-[100px] resize-none rounded-xl border-dark-4/80 bg-dark-4/70 text-light-1 shadow-sm placeholder:text-light-4 focus-visible:border-primary-500/50 focus-visible:ring-2 focus-visible:ring-primary-500/40 md:min-h-[120px]"
              disabled={pending}
              maxLength={2000}
              aria-autocomplete="list"
              aria-expanded={Boolean(
                mentionContext && filteredInline.length > 0,
              )}
            />

            {mentionContext && filteredInline.length > 0 && (
              <div
                ref={mentionListRef}
                role="listbox"
                aria-label="Mention suggestions"
                className="absolute left-0 right-0 top-full z-[160] mt-2 max-h-[min(240px,40vh)] overflow-y-auto rounded-xl border border-dark-4 bg-dark-2/98 p-1.5 shadow-xl ring-1 ring-black/20 backdrop-blur-sm"
              >
                {filteredInline.map((u, idx) => (
                  <button
                    key={u.id}
                    type="button"
                    role="option"
                    aria-selected={idx === mentionHighlight}
                    data-mention-index={idx}
                    className="w-full text-left"
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setMentionHighlight(idx)}
                    onClick={() => applyMention(u.username)}
                  >
                    <CandidateRow u={u} active={idx === mentionHighlight} />
                  </button>
                ))}
              </div>
            )}

            {mentionContext &&
              filteredInline.length === 0 &&
              canMentionAnyone && (
                <div className="absolute left-0 right-0 top-full z-[160] mt-2 rounded-xl border border-dark-4 bg-dark-2/98 px-3 py-2.5 shadow-lg ring-1 ring-black/20">
                  <p className="small-regular text-light-4">
                    No matching people — adjust your search or use Mention
                  </p>
                </div>
              )}
          </div>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <MentionPicker
                candidates={mentionCandidates}
                currentUserId={currentUserId}
                onPick={applyMention}
                disabled={pending}
              />
              <span className="tiny-medium text-light-4 hidden sm:inline">
                <kbd className="rounded border border-dark-4 bg-dark-4 px-1.5 py-0.5 font-mono text-[10px]">
                  Ctrl
                </kbd>
                {" + "}
                <kbd className="rounded border border-dark-4 bg-dark-4 px-1.5 py-0.5 font-mono text-[10px]">
                  Enter
                </kbd>
                {" to send"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`tiny-medium tabular-nums ${
                  body.length > 1900 ? "text-amber-400" : "text-light-4"
                }`}
              >
                {body.length}/2000
              </span>
              <Button
                type="button"
                className="shad-button_primary rounded-xl px-5 disabled:opacity-60"
                disabled={pending || !body.trim()}
                onClick={submit}
              >
                {pending ? "Sending…" : replyParentId ? "Reply" : "Comment"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="small-regular mb-8 text-light-4">
          Sign in to join the conversation.
        </p>
      )}

      <div className="flex flex-col">
        {tree.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-dark-4/80 bg-dark-4/20 py-10 text-center">
            <p className="small-regular text-light-4">
              No comments yet. Say something nice.
            </p>
          </div>
        ) : (
          tree.map((node) => (
            <CommentBranch
              key={node.id}
              node={node}
              depth={0}
              currentUserId={currentUserId}
              lookup={lookup}
              replyParentId={replyParentId}
              setReplyParentId={setReplyParentId}
              onDeleted={() => router.refresh()}
            />
          ))
        )}
      </div>
    </section>
  );
}
