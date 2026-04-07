import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import GridPostList from "@/components/shared/GridPostList";
import { getLikedPostsForUser } from "@/lib/profileData";

export default async function ProfileLikedPostsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  const me = userId
    ? await db.user.findUnique({
        where: { accountId: userId },
        select: { id: true },
      })
    : null;

  if (me?.id !== id) {
    redirect(`/profile/${id}`);
  }

  const posts = await getLikedPostsForUser(id);

  return (
    <div className="mt-6 w-full">
      <GridPostList posts={posts} />
    </div>
  );
}
