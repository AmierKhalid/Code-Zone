"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Bot, Loader2, Copy, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AssistantMarkdown } from "./AssistantMarkdown";

interface CodeExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  /** Language id for the API (e.g. typescript) */
  language: string;
  /** Optional display label (e.g. TypeScript) */
  languageLabel?: string;
}

function explainApiUrl(): string {
  if (typeof window === "undefined") return "/api/ai/explain";
  return `${window.location.origin}/api/ai/explain`;
}

async function explainFetch(
  input: string,
  init: RequestInit,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await fetch(input, init);
    } catch (e) {
      lastError = e;
      if (attempt === 0) await new Promise((r) => setTimeout(r, 450));
    }
  }
  throw lastError;
}

async function readErrorJson(response: Response): Promise<string> {
  const text = await response.text();
  const t = text.trim();
  if (
    t.startsWith("<!DOCTYPE") ||
    t.startsWith("<!doctype") ||
    t.startsWith("<html")
  ) {
    return "The server returned a sign-in page instead of JSON. Try refreshing.";
  }
  try {
    const j = JSON.parse(text) as { error?: string };
    return j.error || `Request failed (${response.status})`;
  } catch {
    return text.slice(0, 200) || `Request failed (${response.status})`;
  }
}

export default function CodeExplanationModal({
  isOpen,
  onClose,
  code,
  language,
  languageLabel,
}: CodeExplanationModalProps) {
  const [explanation, setExplanation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const displayLang = languageLabel?.trim() || language;

  const runExplain = useCallback(async () => {
    if (!code.trim()) {
      toast.error("No code to explain");
      return;
    }

    cancelledRef.current = false;
    setIsLoading(true);
    setIsStreaming(true);
    setExplanation("");
    setError(null);

    try {
      const response = await explainFetch(explainApiUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          code,
          language,
          stream: true,
        }),
      });

      if (!response.ok) {
        const msg = await readErrorJson(response);
        throw new Error(msg);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/event-stream")) {
        const preview = (await response.text()).trim().slice(0, 200);
        throw new Error(
          preview.startsWith("<!DOCTYPE") || preview.startsWith("<html")
            ? "Expected a code explanation stream; got a web page. Try signing in or refreshing."
            : `Expected text/event-stream, got: ${contentType}. ${preview}`,
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Could not read response stream");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (cancelledRef.current) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          const payload = t.slice(5).trim();
          let data: { chunk?: string; error?: string };
          try {
            data = JSON.parse(payload) as { chunk?: string; error?: string };
          } catch {
            continue;
          }
          if (data.error) {
            const errText = data.error;
            const friendly =
              /^fetch failed$/i.test(errText.trim()) ||
              errText.includes("fetch failed")
                ? "The server could not reach the AI provider. Check network or API keys."
                : errText;
            throw new Error(friendly);
          }
          if (data.chunk && !cancelledRef.current) {
            setExplanation((prev) => prev + data.chunk);
          }
        }
      }

    } catch (err) {
      if (cancelledRef.current) return;
      console.error("Explanation error:", err);
      const msg =
        err instanceof TypeError && err.message === "Failed to fetch"
          ? "Network error: is the dev server running? Use the same host as the app."
          : err instanceof Error
            ? err.message
            : "Failed to get explanation";
      setError(msg);
      toast.error(msg);
    } finally {
      if (!cancelledRef.current) {
        setIsLoading(false);
        setIsStreaming(false);
      }
    }
  }, [code, language]);

  useEffect(() => {
    if (!isOpen) {
      cancelledRef.current = true;
      setIsLoading(false);
      setIsStreaming(false);
      return;
    }
    cancelledRef.current = false;
    setExplanation("");
    setError(null);
    setCopied(false);
    void runExplain();
    return () => {
      cancelledRef.current = true;
    };
  }, [isOpen, code, language, runExplain]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(explanation);
      setCopied(true);
      toast.success("Explanation copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10060] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="flex h-[90vh] w-[95vw] max-w-6xl flex-col rounded-2xl bg-dark-2 shadow-2xl md:h-[85vh] md:w-[90vw] lg:h-[80vh]">
        <div className="flex items-center justify-between border-b border-dark-4 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500/15 text-primary-500">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-light-1">
                Code Explanation
              </h2>
              <p className="text-sm text-light-4">
                {displayLang} · AI analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void runExplain()}
              disabled={isLoading || isStreaming}
              className="gap-2"
              title="Regenerate explanation"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void copyToClipboard()}
              disabled={!explanation.trim()}
              className="gap-2"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 flex-col overflow-hidden md:flex-row">
          <div className="flex max-h-[40vh] w-full shrink-0 flex-col overflow-hidden border-b border-dark-4 p-4 md:max-h-none md:w-1/2 md:border-b-0 md:border-r">
            <h3 className="mb-3 shrink-0 text-sm font-semibold text-light-2">
              Original Code
            </h3>
            <div className="min-h-0 flex-1 overflow-auto rounded-lg bg-[#0d1117] p-3">
              <pre className="text-sm text-light-1 whitespace-pre-wrap break-words">
                <code>{code}</code>
              </pre>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
            <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-light-2">
                AI Explanation
              </h3>
              {(isLoading || isStreaming) && (
                <span className="flex items-center gap-2 text-xs text-light-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
                  {explanation ? "Streaming…" : "Starting…"}
                </span>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
              {error && !explanation && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {error}
                </div>
              )}

              {!error && !explanation && (isLoading || isStreaming) && (
                <div className="flex items-center justify-center py-12 text-light-4">
                  <Loader2 className="mr-3 h-6 w-6 animate-spin text-primary-500" />
                  Analyzing code…
                </div>
              )}

              {explanation ? (
                <div className="relative">
                  <AssistantMarkdown source={explanation} />
                  {isStreaming && (
                    <span className="inline-block animate-pulse text-primary-500">
                      ▊
                    </span>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
