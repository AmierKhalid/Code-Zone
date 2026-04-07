import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import PostCard from "@/components/shared/PostCard";
import { auth } from "@clerk/nextjs/server";
import type { Post } from "@/app/types/index";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const raw = await db.post.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
      likes: {
        select: { id: true, userId: true },
      },
      saves: {
        select: { id: true, userId: true },
      },
    },
  });

  if (!raw) notFound();

  const { caption, ...rest } = raw;
  const post: Post = {
    ...rest,
    content: caption,
  };

  const { userId } = await auth();
  const currentUser = userId
    ? await db.user.findUnique({
        where: { accountId: userId },
        select: { id: true },
      })
    : null;

  return (
    <div className="flex flex-col flex-1 gap-6 py-8 px-5 md:px-14 max-w-2xl mx-auto w-full">
      <Link
        href="/"
        className="text-light-3 small-medium hover:text-light-1 w-fit"
      >
        ← Home
      </Link>
      <PostCard post={post} currentUserId={currentUser?.id} />
    </div>
  );
}
