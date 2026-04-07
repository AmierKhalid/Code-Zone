import GridPostList from "@/components/shared/GridPostList";
import { getProfilePosts } from "@/lib/profileData";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const posts = await getProfilePosts(id);

  return (
    <div className="mt-6 w-full">
      <GridPostList posts={posts} showUser={false} />
    </div>
  );
}
