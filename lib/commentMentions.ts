/** Usernames after @ (letters, numbers, underscore). */
const MENTION_PATTERN = /@([a-zA-Z0-9_]+)/g;

export function parseMentionUsernames(content: string): string[] {
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(MENTION_PATTERN.source, "g");
  while ((m = re.exec(content)) !== null) {
    seen.add(m[1]);
  }
  return [...seen];
}
