/**
 * Detects an unfinished @username token immediately before the cursor.
 * Ignores @ inside words (e.g. emails) by requiring @ after start/whitespace.
 */
export function getActiveMention(
  text: string,
  cursor: number,
): { start: number; query: string } | null {
  const before = text.slice(0, cursor);
  const at = before.lastIndexOf("@");
  if (at === -1) return null;

  if (at > 0) {
    const prev = before[at - 1];
    if (prev !== " " && prev !== "\n" && prev !== "\t") {
      return null;
    }
  }

  const afterAt = before.slice(at + 1);
  if (afterAt.includes(" ") || afterAt.includes("\n")) return null;
  if (!/^[_a-zA-Z0-9]*$/.test(afterAt)) return null;

  return { start: at, query: afterAt };
}

export function replaceMentionToken(
  text: string,
  from: number,
  to: number,
  username: string,
): { value: string; caret: number } {
  const token = `@${username} `;
  const value = text.slice(0, from) + token + text.slice(to);
  return { value, caret: from + token.length };
}
