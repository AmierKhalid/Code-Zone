export type CommentAuthor = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
};

export type PostCommentRow = {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  mentionedUserIds: string[];
  likesCount: number;
  createdAt: Date;
  updatedAt: Date;
  author: CommentAuthor;
};

export type CommentTreeNode = PostCommentRow & { replies: CommentTreeNode[] };

export function buildCommentTree(flat: PostCommentRow[]): CommentTreeNode[] {
  const byId = new Map<string, CommentTreeNode>();
  for (const c of flat) {
    byId.set(c.id, { ...c, replies: [] });
  }
  const roots: CommentTreeNode[] = [];
  for (const c of flat) {
    const node = byId.get(c.id)!;
    if (c.parentId) {
      const parent = byId.get(c.parentId);
      if (parent) parent.replies.push(node);
      else roots.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}
