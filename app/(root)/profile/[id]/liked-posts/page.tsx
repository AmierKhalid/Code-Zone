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

  // Parallelize auth + data fetch
  const [{ userId }, posts] = await Promise.all([
    auth(),
    getLikedPostsForUser(id),
  ]);

  // Resolve DB user id from clerk id (cheap SELECT)
  const me = userId
    ? await db.user.findUnique({
        where: { accountId: userId },
        select: { id: true },
      })
    : null;

  // Only the owner can view their liked posts
  if (me?.id !== id) redirect(`/profile/${id}`);

  return (
    <div className="mt-6 w-full">
      <GridPostList posts={posts} />
    </div>
  );
}
