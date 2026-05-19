"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Editor } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import {
  Play,
  Zap,
  Users,
  Save,
  Download,
  Upload,
  Maximize2,
  Minimize2,
  Lightbulb,
  Code2,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { sendCollabInvite } from "@/app/actions/collabInviteActions";
import { CollaborationClient, CollaborationUser } from "@/lib/collaboration";
import CollaborationCursors from "./CollaborationCursors";
import CollaborationPanel from "./CollaborationPanel";

/** Remove ``` fences from AI refactor output when the model ignores instructions. */
function stripMarkdownCodeFence(raw: string): string {
  let t = raw.trim();
  const wrapped =
    /^```[\w.-]*\s*\r?\n([\s\S]*?)\r?\n```\s*$/;
  const m = t.match(wrapped);
  if (m?.[1]) return m[1].trim();
  t = t.replace(/^```[\w.-]*\s*\r?\n?/, "");
  t = t.replace(/\r?\n```\s*$/, "");
  return t.trim();
}

interface AdvancedCodeEditorProps {
  initialCode?: string;
  language?: string;
  onCodeChange?: (code: string) => void;
  onExecute?: () => Promise<void>;
  isExecuting?: boolean;
  output?: string;
  showOutput?: boolean;
  setShowOutput?: (show: boolean) => void;
  onExplain?: (code: string, language: string) => void;
  className?: string;
  currentUserName?: string;
  currentUserImage?: string | null;
  currentUserId?: string;
}

export default function AdvancedCodeEditor({
  initialCode = "",
  language = "typescript",
  onCodeChange,
  onExecute,
  isExecuting = false,
  output = "",
  showOutput = false,
  setShowOutput,
  onExplain,
  className = "",
  currentUserName = "Developer",
  currentUserImage = null,
  currentUserId,
}: AdvancedCodeEditorProps) {
  const editorRef = useRef<{
    editor: Monaco.editor.IStandaloneCodeEditor;
    monaco: typeof Monaco;
  } | null>(null);
  const [code, setCode] = useState(initialCode);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aiSuggestions] = useState<string[]>([]);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [pillsVisible, setPillsVisible] = useState(true);
  const [collaborationUsers, setCollaborationUsers] = useState<
    CollaborationUser[]
  >([]);
  const [collaborationClient, setCollaborationClient] =
    useState<CollaborationClient | null>(null);
  // need a ref here because the cursor/selection handlers are registered once
  // at editor mount and would otherwise always see the initial null state
  const collaborationClientRef = useRef<CollaborationClient | null>(null);
  const [collabSessionId, setCollabSessionId] = useState<string>("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteeUsername, setInviteeUsername] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const applyingRemoteChangeRef = useRef(false);
  const hasAutoConnectedRef = useRef(false);

  // keep the ref up to date so event handlers always get the current client
  collaborationClientRef.current = collaborationClient;

  const updateCode = useCallback(
    (nextCode: string) => {
      setCode(nextCode);
      onCodeChange?.(nextCode);
    },
    [onCodeChange],
  );

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  useEffect(() => {
    if (collaborationClient) {
      collaborationClient.setStatus(isExecuting ? "running" : "active");
    }
  }, [isExecuting, collaborationClient]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("collab");
    if (fromUrl) {
      setCollabSessionId(fromUrl);
      // if someone clicked an invite link, connect them automatically
      setTimeout(() => {
        if (!isCollaborating && !hasAutoConnectedRef.current) {
          hasAutoConnectedRef.current = true;
          handleCollaborate(fromUrl);
        }
      }, 500);
    } else {
      setCollabSessionId(crypto.randomUUID().slice(0, 8));
    }
  }, []);

  // disconnect when the editor closes so we don't leave zombie sessions
  useEffect(() => {
    return () => {
      if (collaborationClient) {
        collaborationClient.disconnect();
      }
    };
  }, [collaborationClient]);

  // editor options — minimap off in fullscreen to save space
  const editorOptions = {
    minimap: { enabled: !isFullscreen },
    fontSize: 14,
    lineNumbers: "on" as const,
    roundedSelection: false,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    wordWrap: "on" as const,
    bracketPairColorization: { enabled: true },
    suggest: {
      showKeywords: false,
      showSnippets: true,
    },
    codeActions: { enabled: true },
  };

  const handleEditorDidMount = (
    editor: Monaco.editor.IStandaloneCodeEditor,
    monaco: typeof Monaco,
  ) => {
    editorRef.current = { editor, monaco };

    // wire up keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onExecute?.();
    });

    monaco.languages.registerCompletionItemProvider(language, {
      provideCompletionItems: (
        model: Monaco.editor.ITextModel,
        position: Monaco.Position,
      ) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };
        const suggestions = getMockAISuggestions(model.getValue());
        return {
          suggestions: createMonacoSuggestions(suggestions, monaco, range),
        };
      },
    });

    // using the ref instead of the state var — these callbacks are set once
    // at mount so the state closure would be stale after the first connect
    editor.onDidChangeCursorPosition((evt) => {
      collaborationClientRef.current?.sendCursor({
        line: evt.position.lineNumber,
        column: evt.position.column,
      });
    });

    editor.onDidChangeCursorSelection((evt) => {
      collaborationClientRef.current?.sendSelection({
        start: {
          line: evt.selection.startLineNumber,
          column: evt.selection.startColumn,
        },
        end: {
          line: evt.selection.endLineNumber,
          column: evt.selection.endColumn,
        },
      });
    });
  };

  const getMockAISuggestions = (_currentCode: string): string[] => {
    void _currentCode;
    return [
      "function calculateSum(a, b) { return a + b; }",
      "const result = await fetchData();",
      "if (condition) { // handle logic }",
      "try { // risky code } catch (error) { // handle error }",
    ];
  };

  const createMonacoSuggestions = (
    suggestions: string[],
    monaco: typeof Monaco,
    range: Monaco.IRange,
  ) => {
    return suggestions.map((suggestion, index) => ({
      label: suggestion.slice(0, 48) + (suggestion.length > 48 ? "…" : ""),
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: suggestion,
      range,
      documentation: `AI-powered suggestion ${index + 1}`,
    }));
  };

  const handleCodeChange = useCallback(
    (value: string | undefined) => {
      const newCode = value || "";
      updateCode(newCode);
      if (applyingRemoteChangeRef.current) {
        applyingRemoteChangeRef.current = false;
        return;
      }
      collaborationClient?.sendOperation({
        type: "retain",
        position: 0,
        content: newCode,
        userId: collaborationClient.getUserId(),
        timestamp: Date.now(),
      });
    },
    [updateCode, collaborationClient],
  );

  const handleExecute = async () => {
    if (onExecute) {
      await onExecute();
    }
  };

  const handleSave = () => {
    localStorage.setItem(`code-editor-${Date.now()}`, code);
    toast.success("Code saved locally");
  };

  const handleAIRefactor = async () => {
    const tid = toast.loading("Refactoring code…");
    try {
      const url =
        typeof window !== "undefined"
          ? `${window.location.origin}/api/ai/chat`
          : "/api/ai/chat";
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          message: `You are a careful code assistant. Refactor the following ${language} code for clarity and maintainability. Output ONLY the refactored source code, with no markdown fences and no commentary before or after.\n\n${code}`,
          stream: false,
        }),
      });
      const data = (await response.json()) as {
        response?: string;
        error?: string;
      };
      if (
        !response.ok ||
        typeof data.response !== "string" ||
        !data.response.trim()
      ) {
        throw new Error(data.error || "Refactor request failed");
      }
      const cleaned = stripMarkdownCodeFence(data.response);
      if (!cleaned) {
        throw new Error("Model returned empty code");
      }
      updateCode(cleaned);
      toast.success("Code refactored");
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Refactoring failed";
      toast.error(msg);
    } finally {
      toast.dismiss(tid);
    }
  };

  const handleCollaborate = async (forcedSessionId?: string) => {
    if (!isCollaborating) {
      try {
        const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
        const isHost = !urlParams?.get("collab");
        const sessionId = (typeof forcedSessionId === "string" ? forcedSessionId : collabSessionId) || crypto.randomUUID().slice(0, 8);
        const userId = currentUserId || `user-${crypto.randomUUID().slice(0, 8)}`;
        const client = new CollaborationClient(sessionId, userId, currentUserName, currentUserImage, isHost ? "Host" : "Collaborator");

        await client.connect();

        // Set up event handlers
        client.onUsersChangeCallback((users) => {
          setCollaborationUsers(users);
          setCollaborators(
            users.filter((u) => u.id !== userId).map((u) => u.name),
          );
        });

        client.onCursorChangeCallback((uid, cursor) => {
          console.log(
            `User ${uid} cursor moved to line ${cursor.line}, column ${cursor.column}`,
          );
        });
        client.onOperationCallback((operation) => {
          if (operation.type === "retain" && typeof operation.content === "string") {
            applyingRemoteChangeRef.current = true;
            updateCode(operation.content);
          }
        });

        // Sync state when a new user joins or requests sync
        const sendCurrentState = () => {
          const currentCode = editorRef.current?.editor.getValue() || code;
          client.sendOperation({
            type: "retain",
            position: 0,
            content: currentCode,
            userId: client.getUserId(),
            timestamp: Date.now(),
          });
        };

        client.onUserJoinedCallback(() => {
          if (isHost) {
            sendCurrentState();
          }
        });

        client.onSyncRequestCallback(() => {
          if (isHost) {
            sendCurrentState();
          }
        });

        setCollaborationClient(client);
        setIsCollaborating(true);
        toast.success("Collaboration mode enabled");

        // If not host, ask for the current state
        if (!isHost) {
          setTimeout(() => {
            client.requestSync();
          }, 500);
        }
      } catch (error) {
        toast.error("Failed to start collaboration");
        console.error("Collaboration error:", error);
      }
    } else {
      // Disconnect collaboration
      if (collaborationClient) {
        collaborationClient.disconnect();
        setCollaborationClient(null);
      }
      setIsCollaborating(false);
      setCollaborationUsers([]);
      setCollaborators([]);
      toast.info("Collaboration mode disabled");
      
      // Remove collab from URL
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        if (url.searchParams.has("collab")) {
          url.searchParams.delete("collab");
          window.history.replaceState({}, "", url.pathname + url.search);
        }
      }
    }
  };

  const getFileExtension = (lang: string) => {
    switch (lang.toLowerCase()) {
      case "typescript": return "ts";
      case "javascript": return "js";
      case "python": return "py";
      case "java": return "java";
      case "csharp": return "cs";
      case "cpp": return "cpp";
      case "go": return "go";
      case "rust": return "rs";
      case "sql": return "sql";
      case "json": return "json";
      case "css": return "css";
      case "xml": return "xml";
      case "bash": return "sh";
      default: return "txt";
    }
  };

  const handleExport = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${getFileExtension(language)}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Code exported");
  };

  const openInviteDialog = () => {
    if (!isCollaborating) {
      toast.info("Turn on Collab first, then invite.");
      return;
    }
    setInviteeUsername("");
    setInviteDialogOpen(true);
  };

  const handleSendCollabInvite = async () => {
    const sessionId =
      collaborationClient?.getSessionId() || collabSessionId || "";
    if (!sessionId.trim()) {
      toast.error("No collaboration session id");
      return;
    }
    setInviteSending(true);
    try {
      const res = await sendCollabInvite({
        inviteeUsername: inviteeUsername.trim(),
        sessionId: sessionId.trim(),
      });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Invite sent — they will see it in notifications");
      setInviteDialogOpen(false);
      setInviteeUsername("");
    } finally {
      setInviteSending(false);
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".js,.ts,.jsx,.tsx,.py,.java,.cpp,.c";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          updateCode((e.target?.result as string) || "");
          toast.success("Code imported");
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div
      className={`flex flex-col ${isFullscreen ? "fixed inset-0 z-[10000] bg-dark-1" : "h-full"} ${className}`}
    >
      {/* Advanced Toolbar — wrap + scroll on narrow viewports */}
      <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-y-2 border-b border-dark-4 bg-dark-2 px-2 py-2 sm:px-4">
        <div className="flex min-w-0 flex-shrink-0 items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-primary-500/10 px-2 py-1">
            <Code2 className="h-4 w-4 text-primary-500" />
            <span className="text-xs font-medium text-primary-500">
              {language}
            </span>
          </div>

          {isCollaborating && (
            <div className="flex items-center gap-1 rounded-lg bg-green-500/10 px-2 py-1">
              <Users className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium text-green-500">
                {collaborators.length + 1} online
              </span>
            </div>
          )}
        </div>

        <div className="flex max-w-full flex-1 flex-wrap items-center justify-end gap-1 overflow-x-auto sm:flex-initial sm:justify-end">
          {/* AI Features */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAIRefactor}
            className="gap-1 text-xs"
          >
            <Zap className="h-3 w-3" />
            Refactor
          </Button>

          <div className="w-px h-4 bg-dark-4" />

          {/* Code Actions */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExecute}
            disabled={isExecuting}
            className="gap-1 text-xs"
          >
            <Play className="h-3 w-3" />
            {isExecuting ? "Running..." : "Run"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onExplain?.(code, language)}
            className="gap-1 text-xs"
          >
            <Lightbulb className="h-3 w-3" />
            Explain
          </Button>

          <div className="w-px h-4 bg-dark-4" />

          {/* File Operations */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            className="gap-1 text-xs"
          >
            <Save className="h-3 w-3" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleImport}
            className="gap-1 text-xs"
          >
            <Upload className="h-3 w-3" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            className="gap-1 text-xs"
          >
            <Download className="h-3 w-3" />
          </Button>

          <div className="w-px h-4 bg-dark-4" />

          {/* View Controls */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCollaborate()}
            className={`gap-1 text-xs ${isCollaborating ? "bg-green-500/20 text-green-500" : ""}`}
          >
            <Users className="h-3 w-3" />
            Collab
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="gap-1 text-xs"
          >
            {isFullscreen ? (
              <Minimize2 className="h-3 w-3" />
            ) : (
              <Maximize2 className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Main editor area: stack on small screens, row on xl+ */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden xl:flex-row xl:items-stretch">
        <div
          className={`relative flex min-h-[200px] min-w-0 flex-1 flex-col xl:min-h-0 ${showOutput ? "xl:w-2/3" : ""}`}
        >
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
            options={editorOptions}
            theme="vs-dark"
            loading={
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Terminal className="mx-auto nXh-8 w-8 animate-pulse text-primary-500" />
                  <p className="mt-2 text-sm text-light-4">
                    Loading advanced editor...
                  </p>
                </div>
              </div>
            }
          />

          {/* Collaboration Cursors */}
          {isCollaborating && (
            <CollaborationCursors
              users={collaborationUsers}
              currentUserId={collaborationClient?.getUserId()}
              pillsVisible={pillsVisible}
              editorRef={editorRef}
            />
          )}
        </div>

        {/* Output Panel - Always visible when showOutput is true, even in fullscreen */}
        {showOutput && (
          <div className="flex max-h-[38vh] min-h-[100px] w-full shrink-0 flex-col border-t border-dark-4 bg-dark-2 xl:max-h-none xl:w-1/3 xl:border-l xl:border-t-0">
            <div className="flex items-center justify-between border-b border-dark-4 p-2">
              <span className="text-xs font-medium text-light-2">Output</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOutput?.(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
            <div className="flex-1 p-3 overflow-auto">
              <pre className="text-xs font-mono text-light-3 whitespace-pre-wrap">
                {output || "// No output yet"}
              </pre>
            </div>
          </div>
        )}

        {/* Collaboration Panel */}
        {isCollaborating && (
          <div className="flex max-h-[42vh] w-full shrink-0 flex-col overflow-y-auto overflow-x-hidden border-t border-dark-4 bg-dark-2 xl:max-h-none xl:w-72 xl:min-w-[260px] xl:border-l xl:border-t-0">
            <CollaborationPanel
              users={collaborationUsers}
              isConnected={true}
              currentUserId={
                collaborationClient
                  ? collaborationClient.getUserId()
                  : "current-user"
              }
              pillsVisible={pillsVisible}
              onTogglePills={() => setPillsVisible(v => !v)}
              onInviteUser={openInviteDialog}
              onDisconnect={() => handleCollaborate()}
            />
          </div>
        )}
      </div>

      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="border-dark-4 bg-dark-2 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-light-1">
              Invite to collaborate
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-light-4">
            Enter their Code-Zone username. They get a notification to accept or
            decline. If they accept, they are sent to Messages with the same
            session link.
          </p>
          <Input
            placeholder="@username"
            value={inviteeUsername}
            onChange={(e) => setInviteeUsername(e.target.value)}
            className="border-dark-4 bg-dark-3"
            disabled={inviteSending}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSendCollabInvite();
            }}
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setInviteDialogOpen(false)}
              disabled={inviteSending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleSendCollabInvite()}
              disabled={inviteSending || !inviteeUsername.trim()}
            >
              {inviteSending ? "Sending…" : "Send invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Suggestions Panel */}
      {showAISuggestions && (
        <div className="border-t border-dark-4 bg-dark-2 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-light-2">
              AI Suggestions
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAISuggestions(false)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
          <div className="space-y-1">
            {aiSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="rounded bg-dark-3 p-2 text-xs font-mono text-light-3 cursor-pointer hover:bg-dark-4"
                onClick={() => {
                  updateCode(suggestion);
                  setShowAISuggestions(false);
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
