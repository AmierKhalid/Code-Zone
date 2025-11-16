import { Link } from "react-router-dom"
import { Button } from "@/components/ui"
import { useGetRecentPosts } from "@/lib/react-query/queries"
import Loader from "@/components/shared/Loader"
import PostCard from "@/components/shared/PostCard"

const Home = () => {
  const { data: posts, isLoading, isError } = useGetRecentPosts();

  return (
    <div className="flex flex-1">
      <div className="home-container">
        <div className="home-posts">
          <h2 className="h3-bold md:h2-bold text-left w-full">Home Feed</h2>
          {isLoading && !posts ? (
            <Loader />
          ) : (
            <ul className="flex flex-col flex-1 gap-9 w-full">
              {posts?.map((post: any) => (
                <PostCard key={post.$id} post={post} />
              ))}
            </ul>
          )}
          {isError && (
            <p className="text-light-4 mt-10 text-center w-full">
              Failed to load posts. Please try again.
            </p>
          )}
          {!isLoading && posts && posts.length === 0 && (
            <div className="flex flex-col items-center gap-4 mt-10">
              <p className="text-light-4 text-center w-full">
                No posts available. Create your first post!
              </p>
              <Link to="/create-sample-posts">
                <Button className="shad-button_primary">
                  Create 10 Sample Posts
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Home
