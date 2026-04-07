import { GridPostList, Loader } from "@/components/shared";
import { useGetSavedPosts } from "@/lib/react-query/queries";
import { useUserContext } from "@/context/AuthContext";

const Saved = () => {
  const { user } = useUserContext();
  const { data: savedPosts, isLoading } = useGetSavedPosts(user.id);

  return (
    <div className="saved-container">
      <div className="flex gap-2 w-full max-w-5xl">
        <img
          src="/assets/icons/save.svg"
          width={36}
          height={36}
          alt="edit"
          className="invert-white"
        />
        <h2 className="h3-bold md:h2-bold text-left w-full">Saved Posts</h2>
      </div>

      {isLoading ? (
        <Loader />
      ) : (
        <ul className="w-full flex justify-center max-w-5xl gap-9">
          {!savedPosts || savedPosts.length === 0 ? (
            <p className="text-light-4 mt-10 text-center w-full">No saved posts</p>
          ) : (
            <GridPostList posts={savedPosts} showStats={false} />
          )}
        </ul>
      )}
    </div>
  );
};

export default Saved;