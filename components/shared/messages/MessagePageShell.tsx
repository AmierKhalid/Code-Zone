"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Bot, Code2, Loader2, Paperclip, Send, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";
import {
  fetchMessagesForConversation,
  sendMessage,
  fetchConversationListAction,
  type MessageDTO,
} from "@/app/actions/messageActions";
import type { ConversationListItemDTO } from "@/lib/messageData";
import { shortRelativeTime } from "@/lib/messageTime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MessageCodeSnippet from "@/components/shared/messages/MessageCodeSnippet";
import MessageAttachmentsBlock from "@/components/shared/messages/MessageAttachmentsBlock";
import { CHAT_SNIPPET_LANGUAGES } from "@/lib/chatSnippetLanguages";
import {
  CHAT_MAX_ATTACHMENTS,
  CHAT_MAX_FILE_BYTES,
  CHAT_FILE_ACCEPT,
  formatByteSize,
  mimeToAttachmentKind,
  type ChatAttachmentKind,
  cloudinaryResourceToKind,
} from "@/lib/chatAttachments";
import { effectiveMimeForChatFile } from "@/lib/chatUploadMime";
import { assertChatUploadAllowed } from "@/app/api/upload/chatUploadPolicy";
import { cn } from "@/lib/utils";

/* ── Lazy-loaded heavy modals (code-split into separate chunks) ── */
const AIChatModal = dynamic(
  () => import("@/components/shared/messages/AIChatModal"),
  { ssr: false },
);
const CodeEditorModal = dynamic(
  () => import("@/components/shared/messages/CodeEditorModal"),
  { ssr: false },
);

type Props = {
  currentUser: { id: string; name: string | null; username: string | null; image: string | null };
  initialConversations: ConversationListItemDTO[];
  initialSelectedConversationId: string | null;
};

function displayName(u: { name: string | null; username: string | null }) {
  return u.name?.trim() || u.username || "User";
}

type StagedAttachment = {
  clientId: string;
  url: string | null;
  kind: ChatAttachmentKind;
  fileName: string | null;
  mimeType: string | null;
  byteSize: number | null;
  uploading: boolean;
  error?: string;
};

export default function MessagePageShell({
  currentUser,
  initialConversations,
  initialSelectedConversationId,
}: Props) {
  const router = useRouter();
  const [conversations, setConversations] =
    useState<ConversationListItemDTO[]>(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedConversationId,
  );
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [composer, setComposer] = useState("");
  const [snippetOpen, setSnippetOpen] = useState(false);
  const [snippetCode, setSnippetCode] = useState("");
  const [snippetLang, setSnippetLang] = useState("typescript");
  const [search, setSearch] = useState("");
  const [loadingThread, setLoadingThread] = useState(false);
  const [pending, startTransition] = useTransition();
  const [stagedAttachments, setStagedAttachments] = useState<
    StagedAttachment[]
  >([]);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const threadBodyRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  const loadMessages = useCallback(async (conversationId: string) => {
    const res = await fetchMessagesForConversation(conversationId);
    if (!res.success) {
      toast.error(res.error);
      setMessages([]);
      return;
    }
    setMessages(res.messages);
  }, []);

  useEffect(() => {
    setStagedAttachments([]);
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    setLoadingThread(true);
    loadMessages(selectedId).finally(() => setLoadingThread(false));
  }, [selectedId, loadMessages]);

  useEffect(() => {
    const pollConversations = async () => {
      const res = await fetchConversationListAction();
      if (res.success) {
        setConversations(res.conversations);
      }
    };
    
    // Poll conversations list every 5 seconds
    const convInterval = setInterval(pollConversations, 5000);
    return () => clearInterval(convInterval);
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const t = setInterval(() => {
      loadMessages(selectedId);
    }, 2000);
    return () => clearInterval(t);
  }, [selectedId, loadMessages]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("collab")) {
      setIsCodeEditorOpen(true);
    }
  }, [searchParams]);

  // Listen for AI chat explanation requests
  useEffect(() => {
    const handleAIChatExplanation = (event: CustomEvent) => {
      const { code, language } = event.detail;
      // Open AI chat with explanation request
      setIsAIChatOpen(true);

      // Store the explanation request for the AI chat modal
      setTimeout(() => {
        const explanationPrompt = `Please explain this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nProvide a detailed explanation of what this code does, its key components, and any potential improvements.`;
        // This will be picked up by the AI chat modal
        localStorage.setItem("aiChatInitialPrompt", explanationPrompt);
      }, 200);
    };

    window.addEventListener(
      "openAIChatWithExplanation",
      handleAIChatExplanation as EventListener,
    );
    return () => {
      window.removeEventListener(
        "openAIChatWithExplanation",
        handleAIChatExplanation as EventListener,
      );
    };
  }, []);

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const name = (c.otherUser.name ?? "").toLowerCase();
      const un = (c.otherUser.username ?? "").toLowerCase();
      return name.includes(q) || un.includes(q);
    });
  }, [conversations, search]);

  const openConversation = (id: string) => {
    setSelectedId(id);
  };

  const backToList = () => setSelectedId(null);

  const handleQueueAndUploadFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const batch = files.map((file) => ({
      clientId: crypto.randomUUID(),
      file,
    }));
    let scheduled: { clientId: string; file: File }[] = [];

    flushSync(() => {
      setStagedAttachments((prev) => {
        const room = Math.max(0, CHAT_MAX_ATTACHMENTS - prev.length);
        scheduled = batch.slice(0, room);
        const newRows: StagedAttachment[] = scheduled.map(
          ({ clientId, file }) => {
            const mime = effectiveMimeForChatFile(file);
            return {
              clientId,
              url: null,
              kind: mimeToAttachmentKind(mime),
              fileName: file.name,
              mimeType: file.type || mime,
              byteSize: file.size,
              uploading: true,
            };
          },
        );
        return [...prev, ...newRows];
      });
    });

    if (scheduled.length < batch.length && scheduled.length > 0) {
      toast.info(
        `You can add up to ${CHAT_MAX_ATTACHMENTS} files per message.`,
      );
    }

    if (scheduled.length === 0) {
      toast.info("Maximum attachments reached. Remove one to add more.");
      return;
    }

    for (const { clientId, file } of scheduled) {
      if (file.size > CHAT_MAX_FILE_BYTES) {
        const msg = `Max ${CHAT_MAX_FILE_BYTES / (1024 * 1024)} MB per file.`;
        setStagedAttachments((prev) =>
          prev.map((r) =>
            r.clientId === clientId
              ? { ...r, uploading: false, error: msg }
              : r,
          ),
        );
        toast.error(msg);
        continue;
      }
      try {
        const policyErr = assertChatUploadAllowed(file);
        if (policyErr) throw new Error(policyErr);

        // 1. Get signature
        const sigRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "getSignature", folder: "messages" }),
        });
        const sigData = await sigRes.json();
        if (!sigRes.ok) {
          throw new Error(sigData.error || "Failed to get upload signature");
        }

        // 2. Upload directly to Cloudinary
        const body = new FormData();
        body.append("file", file);
        body.append("api_key", sigData.apiKey);
        body.append("timestamp", sigData.timestamp.toString());
        body.append("signature", sigData.signature);
        body.append("folder", "messages");

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${sigData.cloudName}/auto/upload`,
          { method: "POST", body }
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error?.message || "Upload failed");
        }
        if (!data.secure_url) throw new Error("Upload failed");

        const mime = effectiveMimeForChatFile(file);
        const resolvedKind = cloudinaryResourceToKind(data.resource_type, mime);

        setStagedAttachments((prev) =>
          prev.map((r) =>
            r.clientId === clientId
              ? {
                  ...r,
                  url: data.secure_url,
                  kind: resolvedKind,
                  byteSize: data.bytes ?? file.size,
                  mimeType: mime,
                  fileName: file.name,
                  uploading: false,
                  error: undefined,
                }
              : r,
          ),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setStagedAttachments((prev) =>
          prev.map((r) =>
            r.clientId === clientId
              ? { ...r, uploading: false, error: msg }
              : r,
          ),
        );
        toast.error(msg);
      }
    }
  }, []);

  const removeStaged = useCallback((clientId: string) => {
    setStagedAttachments((prev) => prev.filter((r) => r.clientId !== clientId));
  }, []);

  const handleSend = () => {
    const text = composer.trim();
    const snip = snippetCode.trim();
    const ready = stagedAttachments.filter((a) => a.url && !a.error);
    const uploading = stagedAttachments.some((a) => a.uploading);
    const hasError = stagedAttachments.some((a) => a.error);
    if ((!text && !snip && ready.length === 0) || !selectedId) return;
    if (uploading || hasError) return;
    startTransition(async () => {
      const res = await sendMessage(selectedId, {
        content: composer,
        snippetCode: snip || undefined,
        snippetLang: snip ? snippetLang : undefined,
        attachments:
          ready.length > 0
            ? ready.map((a) => ({
                url: a.url!,
                kind: a.kind,
                fileName: a.fileName,
                mimeType: a.mimeType,
                byteSize: a.byteSize,
              }))
            : undefined,
      });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      
      // Optimistic update
      const newMessage: MessageDTO = {
        id: "temp-" + Date.now(),
        content: composer,
        snippetCode: snip || null,
        snippetLang: snip ? snippetLang : null,
        createdAt: new Date().toISOString(),
        senderId: currentUser.id,
        isRead: false,
        attachments: ready.map((a, i) => ({
          id: "temp-att-" + i,
          kind: a.kind,
          url: a.url!,
          fileName: a.fileName ?? null,
          mimeType: a.mimeType ?? null,
          byteSize: a.byteSize ?? null,
        })),
        sender: {
          id: currentUser.id,
          name: currentUser.name,
          username: currentUser.username,
          image: currentUser.image,
        }
      };
      setMessages((prev) => [...prev, newMessage]);

      setComposer("");
      setSnippetCode("");
      setSnippetOpen(false);
      setStagedAttachments([]);
      await loadMessages(selectedId);
      router.refresh();
    });
  };

  const readyAttachments = stagedAttachments.filter((a) => a.url && !a.error);
  const uploadingAttachment = stagedAttachments.some((a) => a.uploading);
  const attachmentError = stagedAttachments.some((a) => a.error);
  const canSend =
    Boolean(selectedId) &&
    !uploadingAttachment &&
    !attachmentError &&
    Boolean(
      composer.trim() || snippetCode.trim() || readyAttachments.length > 0,
    );

  const onKeyDownComposer = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onComposerPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = e.clipboardData?.files;
    if (files && files.length > 0) {
      e.preventDefault();
      void handleQueueAndUploadFiles(Array.from(files));
    }
  };

  const onComposerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files?.length) void handleQueueAndUploadFiles(Array.from(files));
  };

  return (
    <div className="message-container">
      <div className="message-inner flex-1 min-h-0">
        <div
          className="message-shell flex-1"
          data-thread-open={selectedId ? "true" : "false"}
        >
          <aside className="message-sidebar">
            <div className="message-sidebar-header">
              <div className="flex w-full items-center gap-2 rounded-xl bg-dark-4 px-2 md:rounded-lg md:px-1">
                <Image
                  src="/icons/search.svg"
                  width={22}
                  height={22}
                  alt=""
                  className="ml-1 shrink-0 opacity-70 md:h-5 md:w-5 lg:h-6 lg:w-6"
                />
                <Input
                  type="search"
                  placeholder="Search by name or @username"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="explore-search h-12 border-0 bg-transparent text-base shadow-none focus-visible:ring-0 md:h-11 md:text-sm lg:h-12 lg:text-base"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsAIChatOpen(true)}
                className="flex w-full items-center gap-3 rounded-xl border border-primary-500/20 bg-gradient-to-br from-primary-500/10 to-dark-3/40 p-3 text-left transition hover:border-primary-500/35 hover:from-primary-500/15 md:p-3.5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-500/15 text-primary-500">
                  <Bot className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block small-semibold text-light-1 md:base-medium">
                    AI Assistant
                  </span>
                  <span className="mt-0.5 block tiny-medium leading-snug text-light-4">
                    Powered by Groq  - Ask me anything!
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsCodeEditorOpen(true)}
                className="flex w-full items-center gap-3 rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-dark-3/40 p-3 text-left transition hover:border-purple-500/35 hover:from-purple-500/15 md:p-3.5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-purple-500">
                  <Code2 className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block small-semibold text-light-1 md:base-medium">
                    Advanced Code Editor
                  </span>
                  <span className="mt-0.5 block tiny-medium leading-snug text-light-4">
                    AI-powered development environment
                  </span>
                </span>
              </button>
            </div>

            <div className="message-conversation-list" role="list">
              {filteredConversations.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <p className="small-regular text-light-4">
                    {conversations.length === 0
                      ? "No conversations yet. Visit a profile and tap Message."
                      : "No matches."}
                  </p>
                  {conversations.length === 0 && (
                    <Link
                      href="/Explore"
                      className="mt-3 inline-block text-primary-500 small-medium hover:underline"
                    >
                      Explore people
                    </Link>
                  )}
                </div>
              ) : (
                filteredConversations.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="listitem"
                    onClick={() => openConversation(c.id)}
                    className={`message-conversation-item ${
                      selectedId === c.id
                        ? "message-conversation-item--active"
                        : ""
                    }`}
                  >
                    <Image
                      src={
                        c.otherUser.image ?? "/icons/profile-placeholder.svg"
                      }
                      alt=""
                      width={56}
                      height={56}
                      className="h-14 w-14 shrink-0 rounded-full object-cover sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-[3.75rem] lg:w-[3.75rem]"
                    />
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex-between gap-2">
                        <p className="small-semibold truncate text-light-1 md:base-semibold lg:text-lg lg:font-semibold">
                          {displayName(c.otherUser)}
                        </p>
                        <span className="tiny-medium shrink-0 text-light-4 sm:small-regular flex items-center gap-2">
                          {c.unreadCount > 0 && (
                            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-500 text-[11px] font-bold text-white">
                              {c.unreadCount > 99 ? "99+" : c.unreadCount}
                            </span>
                          )}
                          {shortRelativeTime(
                            c.lastMessage?.createdAt ?? c.updatedAt,
                          )}
                        </span>
                      </div>
                      <p className="tiny-medium truncate text-light-3 sm:small-regular">
                        @{c.otherUser.username ?? "user"}
                      </p>
                      <p className="mt-0.5 truncate small-regular text-light-4 md:mt-1 md:text-[15px]">
                        {c.lastMessage?.preview ?? "No messages yet"}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className="message-thread">
            {selected ? (
              <>
                <div className="message-thread-header">
                  <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-4">
                    <Button
                      type="button"
                      variant="ghost"
                      className="shad-button_ghost h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 p-0 md:hidden"
                      onClick={backToList}
                      aria-label="Back to conversations"
                    >
                      <Image
                        src="/icons/back.svg"
                        width={24}
                        height={24}
                        alt=""
                      />
                    </Button>
                    <Link href={`/profile/${selected.otherUser.id}`}>
                      <Image
                        src={
                          selected.otherUser.image ??
                          "/icons/profile-placeholder.svg"
                        }
                        alt=""
                        width={48}
                        height={48}
                        className="h-12 w-12 shrink-0 rounded-full object-cover md:h-14 md:w-14 lg:h-16 lg:w-16"
                      />
                    </Link>
                    <div className="min-w-0">
                      <Link href={`/profile/${selected.otherUser.id}`}>
                        <p className="small-semibold truncate text-light-1 md:body-bold lg:text-xl lg:font-bold hover:underline">
                          {displayName(selected.otherUser)}
                        </p>
                      </Link>
                      <p className="tiny-medium truncate text-light-3 sm:small-regular md:base-regular">
                        @{selected.otherUser.username ?? "user"}
                      </p>
                    </div>
                  </div>
                </div>

                <div ref={threadBodyRef} className="message-thread-body">
                  {loadingThread && messages.length === 0 ? (
                    <p className="small-regular text-light-4">Loading…</p>
                  ) : messages.length === 0 ? (
                    <div className="message-thread-empty rounded-2xl border border-dashed border-dark-4 bg-dark-2/50 md:rounded-3xl lg:mx-auto lg:w-full lg:max-w-2xl">
                      <Image
                        src="/icons/chat.svg"
                        width={48}
                        height={48}
                        alt=""
                        className="opacity-50 md:h-14 md:w-14 lg:h-16 lg:w-16"
                      />
                      <p className="small-medium text-light-2 md:body-medium lg:text-lg">
                        Say hello
                      </p>
                      <p className="max-w-xs small-regular text-light-4 md:max-w-md md:text-base">
                        Send a message below to start the thread.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {messages.map((m) => {
                        const mine = m.senderId === currentUser.id;
                        const showText = Boolean(m.content.trim());
                        const showSnippet = Boolean(m.snippetCode?.trim());
                        const showAttachments =
                          Array.isArray(m.attachments) &&
                          m.attachments.length > 0;
                        return (
                          <div
                            key={m.id}
                            className={`flex flex-col gap-2 ${
                              mine ? "items-end" : "items-start"
                            }`}
                          >
                            {showAttachments && (
                              <MessageAttachmentsBlock
                                attachments={m.attachments}
                                align={mine ? "end" : "start"}
                              />
                            )}
                            {showText && (
                              <div
                                className={`max-w-[min(85%,28rem)] rounded-2xl px-3.5 py-2.5 md:px-4 ${
                                  mine
                                    ? "bg-primary-500 text-light-1"
                                    : "bg-dark-4 text-light-2"
                                }`}
                              >
                                <p className="small-regular whitespace-pre-wrap break-words md:base-regular">
                                  {m.content.trim()}
                                </p>
                              </div>
                            )}
                            {showSnippet && (
                              <div className="w-full max-w-[min(92%,36rem)]">
                                <MessageCodeSnippet
                                  code={m.snippetCode!}
                                  lang={m.snippetLang}
                                />
                              </div>
                            )}
                            {mine && (
                              <div className="flex items-center gap-1 mt-1 justify-end">
                                <span className="tiny-medium text-light-4/60">
                                  {new Date(m.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                {m.isRead ? (
                                  <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7 M5 13l4 4L19 7" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 13l4 4L23 7" className="translate-x-1" />
                                  </svg>
                                ) : (
                                  <svg className="w-3.5 h-3.5 text-light-4/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                                {m.isRead && <span className="tiny-medium text-blue-500 ml-1">Seen</span>}
                              </div>
                            )}
                            {!mine && (
                              <span className="mt-1 block tiny-medium text-light-4/60">
                                {new Date(m.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                          </div>
                        );
                      })}
                      <div ref={threadEndRef} />
                    </div>
                  )}
                </div>

                <div
                  className="message-composer"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onComposerDrop}
                >
                  <div className="flex w-full min-w-0 flex-col gap-2">
                    {stagedAttachments.length > 0 && (
                      <ul
                        className="flex flex-wrap gap-2"
                        aria-label="Attachments to send"
                      >
                        {stagedAttachments.map((a) => (
                          <li
                            key={a.clientId}
                            className="flex max-w-[min(100%,14rem)] items-center gap-2 rounded-xl border border-dark-4 bg-dark-3/70 py-1.5 pl-2.5 pr-1"
                          >
                            <span className="min-w-0 flex-1 truncate tiny-medium text-light-2">
                              {a.uploading ? (
                                <span className="flex items-center gap-1.5 text-light-4">
                                  <Loader2
                                    className="h-3.5 w-3.5 shrink-0 animate-spin"
                                    aria-hidden
                                  />
                                  Uploading…
                                </span>
                              ) : a.error ? (
                                <span className="text-red-400">{a.error}</span>
                              ) : (
                                <>
                                  <span className="text-light-1">
                                    {a.fileName}
                                  </span>
                                  {a.byteSize != null ? (
                                    <span className="text-light-4">
                                      {" "}
                                      · {formatByteSize(a.byteSize)}
                                    </span>
                                  ) : null}
                                </>
                              )}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 shrink-0 p-0 text-light-4 hover:text-light-1"
                              disabled={a.uploading}
                              aria-label="Remove attachment"
                              onClick={() => removeStaged(a.clientId)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                      <textarea
                        className="message-input min-w-0 flex-1"
                        placeholder="Enter to send · Shift+Enter for newline · paste or drop files"
                        rows={2}
                        value={composer}
                        disabled={pending}
                        onChange={(e) => setComposer(e.target.value)}
                        onKeyDown={onKeyDownComposer}
                        onPaste={onComposerPaste}
                        maxLength={5000}
                      />
                      <Button
                        type="button"
                        className="shad-button_primary flex h-12 w-12 min-h-[48px] min-w-[48px] shrink-0 items-center justify-center self-center p-0 md:h-11 md:w-11 lg:h-12 lg:w-12"
                        disabled={pending || !canSend}
                        aria-label="Send message"
                        onClick={handleSend}
                      >
                        <Send className="h-5 w-5 md:h-5 lg:h-6 lg:w-6" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        className={cn(
                          "relative inline-flex h-9 min-h-9 cursor-pointer items-center gap-1.5 overflow-hidden rounded-xl border border-dark-4 bg-dark-3/50 px-3 small-medium text-light-3 transition-colors hover:bg-dark-3 hover:text-light-1",
                          pending && "pointer-events-none opacity-50",
                        )}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="absolute inset-0 z-[1] h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                          aria-label="Choose files to attach"
                          multiple
                          accept={CHAT_FILE_ACCEPT}
                          disabled={pending}
                          onChange={(e) => {
                            const fl = e.target.files;
                            e.target.value = "";
                            if (fl?.length) {
                              void handleQueueAndUploadFiles(Array.from(fl));
                            }
                          }}
                        />
                        <span className="pointer-events-none inline-flex items-center gap-1.5">
                          <Paperclip className="h-4 w-4 shrink-0" aria-hidden />
                          Attach
                        </span>
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSnippetOpen((o) => !o)}
                        className={`h-9 gap-1.5 rounded-xl border px-3 small-medium ${
                          snippetOpen
                            ? "border-primary-500/50 bg-primary-500/10 text-primary-500"
                            : "border-dark-4 bg-dark-3/50 text-light-3 hover:text-light-1"
                        }`}
                      >
                        <Code2 className="h-4 w-4 shrink-0" aria-hidden />
                        Code snippet
                      </Button>
                      <span className="ml-auto tiny-medium text-light-4 max-md:hidden">
                        Up to {CHAT_MAX_ATTACHMENTS} files · max{" "}
                        {CHAT_MAX_FILE_BYTES / (1024 * 1024)} MB each
                      </span>
                    </div>
                    <p className="tiny-medium text-light-4 md:hidden">
                      Max {CHAT_MAX_ATTACHMENTS} files,{" "}
                      {CHAT_MAX_FILE_BYTES / (1024 * 1024)} MB each · drag &
                      drop or paste
                    </p>
                    {snippetOpen && (
                      <div className="rounded-xl border border-primary-500/20 bg-dark-3/60 p-3 md:p-4">
                        <label className="mb-1.5 block tiny-medium uppercase tracking-wide text-light-4">
                          Language
                        </label>
                        <select
                          value={snippetLang}
                          onChange={(e) => setSnippetLang(e.target.value)}
                          disabled={pending}
                          className="mb-3 w-full max-w-xs rounded-lg border border-dark-4 bg-dark-4 px-3 py-2 text-sm text-light-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                        >
                          {CHAT_SNIPPET_LANGUAGES.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <label className="mb-1.5 block tiny-medium uppercase tracking-wide text-light-4">
                          Code
                        </label>
                        <textarea
                          value={snippetCode}
                          onChange={(e) => setSnippetCode(e.target.value)}
                          disabled={pending}
                          placeholder="Paste or write code…"
                          spellCheck={false}
                          maxLength={20000}
                          rows={8}
                          className="message-input min-h-[140px] font-mono text-[13px] leading-relaxed md:text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="message-thread-empty flex-1 px-4">
                <Image
                  src="/icons/chat.svg"
                  width={56}
                  height={56}
                  alt=""
                  className="opacity-40 md:h-16 md:h-16 lg:h-20 lg:w-20"
                />
                <p className="body-medium text-light-2 md:h3-bold lg:text-3xl">
                  Your messages
                </p>
                <p className="max-w-sm small-regular text-light-4 md:max-w-lg md:text-base lg:text-lg">
                  Pick a conversation from the list, or open someone&apos;s
                  profile and choose Message to start chatting.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* AI Chat Modal */}
      <AIChatModal
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
      />

      {/* Code Editor Modal */}
      <CodeEditorModal
        isOpen={isCodeEditorOpen}
        onClose={() => {
          setIsCodeEditorOpen(false);
          if (searchParams.get("collab")) {
            const url = new URL(window.location.href);
            url.searchParams.delete("collab");
            router.replace(url.pathname + url.search, { scroll: false });
          }
        }}
        initialCode=""
        language="typescript"
        onSave={(code) => {
          setSnippetCode(code);
          setSnippetOpen(true);
          toast.success("Code saved to message composer");
        }}
        currentUserName={
          typeof currentUser !== "undefined" && currentUser
            ? currentUser.name || currentUser.username || "Developer"
            : "Developer"
        }
        currentUserImage={currentUser?.image || null}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}
