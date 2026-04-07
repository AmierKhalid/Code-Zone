import { GridPostList, Loader } from "@/components/shared";
import { useGetLikedPosts } from "@/lib/react-query/queries";
import { useUserContext } from "@/context/AuthContext";

const LikedPosts = () => {
  const { user } = useUserContext();
  const { data: likedPosts, isLoading } = useGetLikedPosts(user.id);

  if (isLoading)
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );

  return (
    <>
      {!likedPosts || likedPosts.length === 0 ? (
        <p className="text-light-4 mt-10 text-center w-full">No liked posts</p>
      ) : (
        <GridPostList posts={likedPosts} showStats={false} />
      )}
    </>
  );
};

export default LikedPosts;