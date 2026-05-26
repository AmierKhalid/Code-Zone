"use client";

import { useState, useMemo } from "react";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import java from "highlight.js/lib/languages/java";
import csharp from "highlight.js/lib/languages/csharp";
import cpp from "highlight.js/lib/languages/cpp";
import go from "highlight.js/lib/languages/go";
import rust from "highlight.js/lib/languages/rust";
import c from "highlight.js/lib/languages/c";
import bash from "highlight.js/lib/languages/bash";
import plaintext from "highlight.js/lib/languages/plaintext";
import "highlight.js/styles/github-dark.css";
import { labelForSnippetLang } from "@/lib/chatSnippetLanguages";
import { Bot } from "lucide-react";
import CodeExplanationModal from "./CodeExplanationModal";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

let registered = false;
function ensureLanguagesRegistered() {
  if (registered) return;
  registered = true;
  hljs.registerLanguage("javascript", javascript);
  hljs.registerLanguage("typescript", typescript);
  hljs.registerLanguage("python", python);
  hljs.registerLanguage("java", java);
  hljs.registerLanguage("csharp", csharp);
  hljs.registerLanguage("cpp", cpp);
  hljs.registerLanguage("c", c);
  hljs.registerLanguage("go", go);
  hljs.registerLanguage("rust", rust);
  hljs.registerLanguage("bash", bash);
  hljs.registerLanguage("plaintext", plaintext);
}

type Props = {
  code: string;
  lang: string | null;
};

export default function MessageCodeSnippet({ code, lang }: Props) {
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  ensureLanguagesRegistered();

  const language = (lang ?? "plaintext").toLowerCase();
  const label = labelForSnippetLang(language);

  const highlighted = useMemo(() => {
    const trimmed = code.replace(/\r\n/g, "\n");
    try {
      if (hljs.getLanguage(language)) {
        return hljs.highlight(trimmed, { language }).value;
      }
    } catch {
      /* fall through */
    }
    try {
      return hljs.highlightAuto(trimmed).value;
    } catch {
      return escapeHtml(trimmed);
    }
  }, [code, language]);

  return (
    <>
      <div className="message-code-snippet w-full overflow-hidden rounded-xl border border-primary-500/25 bg-[#0d1117] shadow-lg ring-1 ring-black/30">
        <div className="flex items-center justify-between gap-2 border-b border-dark-4/80 bg-dark-3/90 px-3 py-2">
          <span className="tiny-medium font-mono uppercase tracking-wide text-primary-500 md:small-medium">
            {label}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExplanationOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-primary-500/20 bg-primary-500/10 px-2 py-1.5 text-xs font-medium text-primary-500 transition-colors hover:bg-primary-500/20"
              title="Explain with AI"
            >
              <Bot className="h-3 w-3" />
              Explain
            </button>
            <span className="tiny-medium text-light-4">snippet</span>
          </div>
        </div>
        <pre className="max-h-[min(360px,50vh)] overflow-x-auto overflow-y-auto custom-scrollbar p-3 md:p-4">
          <code
            className="hljs !bg-transparent !p-0 text-[13px] leading-relaxed md:text-sm"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </pre>
      </div>

      <CodeExplanationModal
        isOpen={isExplanationOpen}
        onClose={() => setIsExplanationOpen(false)}
        code={code}
        language={language}
        languageLabel={label}
      />
    </>
  );
}
