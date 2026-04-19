import type { PostCommentRow } from "@/lib/postComments";

type AuthorLike = {
  id: string;
  username: string | null;
  name?: string | null;
  image?: string | null;
};

export type MentionCandidate = {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
};

/**
 * People the author can @mention: post author, everyone who commented,
 * and anyone referenced by existing mentions (for consistent linkifying).
 */
export function buildMentionCandidates(
  postAuthor: AuthorLike,
  commentsFlat: PostCommentRow[],
  additionalUsers: { id: string; username: string | null }[],
): MentionCandidate[] {
  const map = new Map<string, MentionCandidate>();

  const add = (u: AuthorLike) => {
    const un = u.username?.trim();
    if (!un) return;
    if (map.has(u.id)) return;
    map.set(u.id, {
      id: u.id,
      username: un,
      name: u.name ?? null,
      image: u.image ?? null,
    });
  };

  add(postAuthor);
  for (const c of commentsFlat) {
    add(c.author);
  }
  for (const u of additionalUsers) {
    add({ id: u.id, username: u.username, name: null, image: null });
  }

  return [...map.values()].sort((a, b) =>
    a.username.localeCompare(b.username, undefined, { sensitivity: "base" }),
  );
}

/** Candidates the current user can @mention, optionally filtered by query. */
export function filterMentionCandidates(
  candidates: MentionCandidate[],
  currentUserId: string | undefined,
  query: string,
): MentionCandidate[] {
  const list = candidates.filter((c) => c.id !== currentUserId);
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (c) =>
      c.username.toLowerCase().includes(q) ||
      (c.name?.toLowerCase().includes(q) ?? false),
  );
}
