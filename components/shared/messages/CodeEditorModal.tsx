"use client";

import { useEffect, useState } from "react";
import {
  X,
  Save,
  Download,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import AdvancedCodeEditor from "./AdvancedCodeEditor";
import CodeExplanationModal from "./CodeExplanationModal";
import { CHAT_SNIPPET_LANGUAGES, labelForSnippetLang } from "@/lib/chatSnippetLanguages";

interface CodeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  language?: string;
  onSave?: (code: string) => void;
  currentUserName?: string;
  currentUserImage?: string | null;
  currentUserId?: string;
}

export default function CodeEditorModal({
  isOpen,
  onClose,
  initialCode = "",
  language = "typescript",
  onSave,
  currentUserName = "Developer",
  currentUserImage = null,
  currentUserId,
}: CodeEditorModalProps) {
  const [code, setCode] = useState(initialCode);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [isExecuting, setIsExecuting] = useState(false);
  const [output, setOutput] = useState("");
  const [showOutput, setShowOutput] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);
  const [explainPayload, setExplainPayload] = useState<{
    code: string;
    language: string;
  }>({ code: "", language: "typescript" });

  useEffect(() => {
    if (!isOpen) return;
    setCode(initialCode);
    setSelectedLanguage(language);
    setOutput("");
    setShowOutput(false);
    setExplainOpen(false);
  }, [isOpen, initialCode, language]);

  const handleSave = () => {
    onSave?.(code);
    toast.success("Code saved to message");
  };

  const handleExport = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${selectedLanguage}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Code exported");
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt,.js,.ts,.py,.java,.cpp,.c,.h";
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result;
          if (typeof result === "string") {
            setCode(result);
            toast.success("Code imported");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    setShowOutput(true);

    try {
      const response = await fetch("/api/code/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: selectedLanguage,
          code,
        }),
      });
      const data = (await response.json()) as {
        output?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || "Execution failed");
      }
      setOutput(data.output || "");
      toast.success("Code executed successfully");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown execution error";
      setOutput(`Error: ${message}`);
      toast.error("Code execution failed");
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-dark-2 border border-dark-4 rounded-lg shadow-2xl flex h-[min(80vh,92dvh)] w-[min(96vw,100%)] max-h-[95dvh] max-w-none flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-4 p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-light-2">
              Advanced Code Editor
            </span>
            <div className="flex items-center gap-3">
              <Select
                value={selectedLanguage}
                onValueChange={setSelectedLanguage}
              >
                <SelectTrigger className="w-36 h-8 text-xs border border-dark-4 bg-dark-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  className="z-[99999] bg-dark-3 border border-dark-4"
                  position="popper"
                >
                  {CHAT_SNIPPET_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 ml-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-light-4">AI Ready</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <AdvancedCodeEditor
            initialCode={code}
            language={selectedLanguage}
            onCodeChange={setCode}
            onExecute={handleExecute}
            isExecuting={isExecuting}
            output={output}
            showOutput={showOutput}
            setShowOutput={setShowOutput}
            onExplain={(explainCode, explainLang) => {
              setExplainPayload({
                code: explainCode,
                language: explainLang || selectedLanguage,
              });
              setExplainOpen(true);
            }}
            className="h-full"
            currentUserName={currentUserName}
            currentUserImage={currentUserImage}
            currentUserId={currentUserId}
          />
        </div>

        {/* Footer */}
        <div className="border-t border-dark-4 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setCode("");
                  toast.success("Editor cleared");
                }}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                Clear
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Save to Message
              </Button>
              <Button
                onClick={handleExport}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button
                onClick={handleImport}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Import
              </Button>
            </div>
            {/* <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="gap-2"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </Button> */}
          </div>
        </div>
      </div>

      <CodeExplanationModal
        isOpen={explainOpen}
        onClose={() => setExplainOpen(false)}
        code={explainPayload.code}
        language={explainPayload.language}
        languageLabel={labelForSnippetLang(explainPayload.language)}
      />
    </div>
  );
}
