/** Labels for UI + keys passed to highlight.js `language` (must be registered). */
export const CHAT_SNIPPET_LANGUAGES = [
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "sql", label: "SQL" },
  { value: "json", label: "JSON" },
  { value: "css", label: "CSS" },
  { value: "xml", label: "HTML / XML" },
  { value: "bash", label: "Bash" }
  ,
] as const;

export type ChatSnippetLangValue = (typeof CHAT_SNIPPET_LANGUAGES)[number]["value"];

export function labelForSnippetLang(lang: string | null | undefined): string {
  if (!lang) return "Code";
  const hit = CHAT_SNIPPET_LANGUAGES.find(
    (x) => x.value.toLowerCase() === lang.toLowerCase(),
  );
  return hit?.label ?? lang;
}
