import { db } from "@/lib/db";
import type { PostCommentRow } from "@/lib/postComments";

export async function getPostCommentsFlat(postId: string): Promise<PostCommentRow[]> {
  const rows = await db.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    include: {
      author: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
  });
  return rows as PostCommentRow[];
}
