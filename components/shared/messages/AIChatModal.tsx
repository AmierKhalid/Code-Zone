"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  loadAIChatHistory,
  saveAIChatHistory,
  clearAIChatHistory,
} from "@/lib/aiChatStorage";
import { AssistantMarkdown } from "./AssistantMarkdown";

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
];

const GROQ_MODEL_LABELS: Record<string, string> = {
  "llama-3.3-70b-versatile": "Llama 3.3 70B",
  "llama-3.1-8b-instant": "Llama 3.1 8B (fast)",
  "mixtral-8x7b-32768": "Mixtral 8x7B",
  "gemma2-9b-it": "Gemma 2 9B"
};

const MAX_HISTORY_MESSAGES = 40;

function modelSelectorLabel(model: string): string {
  return GROQ_MODEL_LABELS[model] ?? model;
}

function modelButtonShortLabel(model: string): string {
  return GROQ_MODEL_LABELS[model] ?? model;
}

function chatApiUrl(): string {
  if (typeof window === "undefined") return "/api/ai/chat";
  return `${window.location.origin}/api/ai/chat`;
}

/** One retry helps transient dev-server / network blips that show as "Failed to fetch" */
async function chatFetch(
  input: string,
  init: RequestInit,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await fetch(input, init);
    } catch (e) {
      lastError = e;
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 450));
      }
    }
  }
  throw lastError;
}

/** HTML sign-in or error pages are not JSON — avoid opaque parse errors */
async function readResponseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  const t = text.trim();
  if (
    t.startsWith("<!DOCTYPE") ||
    t.startsWith("<!doctype") ||
    t.startsWith("<html")
  ) {
    throw new Error(
      "The server returned a web page instead of JSON. If you are signed in, try restarting the dev server.",
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Invalid JSON response: ${t.slice(0, 200)}${t.length > 200 ? "…" : ""}`,
    );
  }
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIChatModal({ isOpen, onClose }: AIChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>(GROQ_MODELS);
  const [selectedModel, setSelectedModel] = useState("llama-3.3-70b-versatile");
  const [aiBackend, setAiBackend] = useState<"groq">("groq");
  const [isServiceAvailable, setIsServiceAvailable] = useState<boolean>(true);
  const [showModelSelector, setShowModelSelector] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      checkAIService();
      const savedHistory = loadAIChatHistory();
      setMessages(savedHistory);

      // Check for initial prompt (e.g., from code explanation request)
      const initialPrompt = localStorage.getItem("aiChatInitialPrompt");
      if (initialPrompt) {
        localStorage.removeItem("aiChatInitialPrompt");
        // Automatically send the initial request
        setTimeout(() => {
          void handleSend(initialPrompt);
        }, 500);
      }

      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Escape to close modal
      if (e.key === "Escape") {
        onClose();
        return;
      }

      // Ctrl/Cmd + K to focus input
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }

      // Ctrl/Cmd + Shift + C to clear chat
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "C") {
        e.preventDefault();
        clearChat();
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    scrollToBottom();
    if (messages.length > 0) {
      saveAIChatHistory(messages);
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkAIService = async () => {
    try {
      const response = await chatFetch(chatApiUrl(), {
        credentials: "same-origin",
      });
      if (response.ok) {
        const data = await readResponseJson<{
          models?: string[];
          defaultModel?: string;
          service?: string;
        }>(response);
        console.log("AI Service data:", data);

        let nextModels: string[] = [];
        if (
          data.service === "groq" &&
          Array.isArray(data.models) &&
          data.models.length > 0
        ) {
          nextModels = data.models;
        } else {
          nextModels = GROQ_MODELS;
        }

        setAiBackend("groq");
        setIsServiceAvailable(true);
        setAvailableModels(nextModels);

        const preferred =
          data.defaultModel && nextModels.includes(data.defaultModel)
            ? data.defaultModel
            : nextModels[0];
        if (!nextModels.includes(selectedModel)) {
          setSelectedModel(preferred ?? nextModels[0] ?? "llama-3.3-70b-versatile");
        }
      } else {
        console.log("AI Service response not ok");
        setIsServiceAvailable(false);
      }
    } catch (error) {
      console.log("AI Service error:", error);
      setIsServiceAvailable(false);
    }
  };

  const handleSend = async (rawMessage?: string) => {
    // Callers may pass a React mouse event if bound as onClick={handleSend} — only accept real strings
    const source =
      typeof rawMessage === "string" ? rawMessage : input;
    const text = String(source ?? "").trim();
    if (!text || isLoading || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setIsStreaming(true);

    try {
      console.log("Sending message with:", { selectedModel, service: aiBackend });
      const historySlice = messages
        .slice(-MAX_HISTORY_MESSAGES)
        .map((msg) => ({ role: msg.role, content: msg.content }));

      const response = await chatFetch(chatApiUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: historySlice,
          model: selectedModel,
          stream: true,
        }),
      });

      console.log("API Response Status:", response.status);
      if (!response.ok) {
        const errorData = await readResponseJson<{ error?: string }>(
          response,
        ).catch(() => ({} as { error?: string }));
        console.error("API Error:", errorData);
        throw new Error(errorData.error || "Failed to send message");
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/event-stream")) {
        const preview = (await response.text()).trim().slice(0, 200);
        throw new Error(
          preview.startsWith("<!DOCTYPE") || preview.startsWith("<html")
            ? "API returned a web page (sign-in/redirect) instead of a chat stream. Try again after refresh."
            : `Expected text/event-stream from /api/ai/chat, got: ${contentType}. ${preview}`,
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get reader from response body");
      }

      let assistantResponse = "";
      const decoder = new TextDecoder();
      let done = false;

      // Add an empty assistant message to be filled by the stream
      const assistantMessageId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
        },
      ]);

      toast.info("AI is typing...");

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value, { stream: true });

        if (chunk) {
          const lines = chunk
            .split("\n")
            .filter((line) => line.startsWith("data: "));

          for (const line of lines) {
            let data: { chunk?: string; error?: string };
            try {
              data = JSON.parse(line.slice(6)) as {
                chunk?: string;
                error?: string;
              };
            } catch {
              console.warn("Skip non-JSON SSE line:", line.slice(0, 80));
              continue;
            }
            if (data.error) {
              const errText = data.error;
              const friendly =
                /^fetch failed$/i.test(errText.trim()) ||
                errText.includes("fetch failed")
                  ? "The app server could not reach Groq (api.groq.com). Check internet, VPN, firewall, or try from another network."
                  : errText;
              throw new Error(friendly);
            }
            if (data.chunk) {
              assistantResponse += data.chunk;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: assistantResponse }
                    : msg,
                ),
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      const msg =
        error instanceof TypeError && error.message === "Failed to fetch"
          ? "Network error: could not reach the server. Is `npm run dev` running? Try again or use the same host as the app (e.g. localhost:3000)."
          : error instanceof Error
            ? error.message
            : "Failed to get AI response.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    clearAIChatHistory();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="flex h-[90vh] w-[95vw] max-w-4xl flex-col rounded-2xl bg-dark-2 shadow-2xl md:h-[80vh] md:w-[90vw] lg:h-[75vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-4 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500/15 text-primary-500">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-light-1">
                AI Assistant
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-dark-4 bg-dark-3 px-2 py-1 text-xs font-medium text-primary-500">
              {aiBackend === "groq" ? "Groq" : "Offline"}
            </div>

            {/* Model Selector */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowModelSelector(!showModelSelector)}
                className="gap-2"
                disabled={!isServiceAvailable}
              >
                {modelButtonShortLabel(selectedModel)}
              </Button>

              {showModelSelector && (
                <div className="absolute right-0 top-full z-10 mt-2 w-48 rounded-lg border border-dark-4 bg-dark-3 shadow-lg">
                  <div className="p-2">
                    <p className="mb-2 text-xs font-medium text-light-4">
                      Select Model
                    </p>
                    {availableModels.map((model) => (
                      <button
                        key={model}
                        onClick={() => {
                          setSelectedModel(model);
                          setShowModelSelector(false);
                        }}
                        className={`w-full rounded px-2 py-1.5 text-left text-sm transition-colors ${
                          selectedModel === model
                            ? "bg-primary-500/20 text-primary-500"
                            : "text-light-2 hover:bg-dark-4"
                        }`}
                      >
                        {modelSelectorLabel(model)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button variant="ghost" size="sm" onClick={clearChat}>
              Clear
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <Bot className="mx-auto mb-4 h-12 w-12 text-primary-500" />
                  <h3 className="mb-2 text-lg font-semibold text-light-1">
                    Welcome to AI Assistant
                  </h3>
                  <p className="text-light-4">
                    {isServiceAvailable
                      ? "Ask me anything about programming, debugging, or general tech questions!"
                      : ""}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-500/15 text-primary-500">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-primary-500 text-white"
                          : "bg-dark-3 text-light-1"
                      }`}
                    >
                      <div className="text-sm leading-relaxed">
                        {message.role === "assistant" ? (
                          <>
                            {message.content ? (
                              <AssistantMarkdown source={message.content} />
                            ) : null}
                            {isStreaming && message.content === "" && (
                              <span className="inline-block animate-pulse text-light-2">
                                ▊
                              </span>
                            )}
                          </>
                        ) : (
                          <div className="whitespace-pre-wrap">
                            {message.content}
                          </div>
                        )}
                      </div>
                    </div>

                    {message.role === "user" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dark-4">
                        <span className="text-xs font-medium text-light-1">
                          You
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-dark-4 p-4">
          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything... (Enter to send, Shift+Enter for newline)"
              disabled={isLoading}
              className="flex-1 resize-none rounded-xl border border-dark-4 bg-dark-3 px-4 py-3 text-light-1 placeholder:text-light-4 focus:border-primary-500 focus:outline-none disabled:opacity-50"
              rows={2}
            />
            <Button
              type="button"
              onClick={() => void handleSend()}
              disabled={
                !isServiceAvailable ||
                !input.trim() ||
                isLoading ||
                isStreaming
              }
              className="h-auto px-4 py-3"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
