"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders AI assistant text as GitHub-flavored Markdown */
export function AssistantMarkdown({ source }: { source: string }) {
  const components: Partial<Components> = {
    a: ({ node: _n, ...props }) => (
      <a
        {...props}
        target="_blank"
        rel="noopener noreferrer"
        className="break-words font-medium text-primary-500 underline decoration-primary-500/40 underline-offset-2 hover:text-primary-400"
      />
    ),
    pre: ({ children }) => (
      <pre className="my-2 max-h-[min(60vh,20rem)] overflow-x-auto overflow-y-auto rounded-lg border border-dark-4 bg-dark-1 p-3 font-mono text-[0.8125rem] leading-relaxed text-light-2">
        {children}
      </pre>
    ),
    code: ({ className, children, ...props }) => {
      const isFenced = Boolean(className?.startsWith("language-"));
      if (isFenced) {
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }
      return (
        <code
          className="rounded bg-dark-4 px-1.5 py-0.5 font-mono text-[0.8125rem] text-light-2"
          {...props}
        >
          {children}
        </code>
      );
    },
  };

  return (
    <div
      className={
        "text-sm leading-relaxed text-light-1 " +
        "[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 " +
        "[&_strong]:font-semibold [&_strong]:text-light-1 " +
        "[&_em]:italic [&_em]:text-light-2 " +
        "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 " +
        "[&_h1]:mb-2 [&_h1]:mt-3 [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-light-1 " +
        "[&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-light-1 " +
        "[&_h3]:mb-1 [&_h3]:mt-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-light-2 " +
        "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-primary-500/40 [&_blockquote]:pl-3 [&_blockquote]:text-light-3 " +
        "[&_hr]:my-4 [&_hr]:border-dark-4 " +
        "[&_table]:my-2 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:text-xs " +
        "[&_table]:border-collapse [&_th]:border [&_th]:border-dark-4 [&_th]:bg-dark-4 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left " +
        "[&_td]:border [&_td]:border-dark-4 [&_td]:px-2 [&_td]:py-1"
      }
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
