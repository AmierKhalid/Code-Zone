import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getHomePostsForFeed } from "@/lib/homeFeed";
import PostCard from "@/components/shared/PostCard";
import FeedRefresher from "@/components/shared/FeedRefresher";
import Loader from "@/components/shared/Loader";
import { Button } from "@/components/ui/button";
import type { Post } from "@/app/types/index";

export default function Home() {
  return (
    <div className="flex flex-1">
      <FeedRefresher />
      <div className="home-container">
        <Suspense fallback={<Loader />}>
          <HomeFeed />
        </Suspense>
      </div>
    </div>
  );
}

async function HomeFeed() {
  let posts: Post[] = [];
  let loadError = false;

  const { userId } = await auth();

  const currentUser = userId
    ? await db.user.findUnique({
        where: { accountId: userId },
        select: { id: true },
      })
    : null;

  try {
    const rawPosts = await getHomePostsForFeed();

    posts = rawPosts.map((p) => ({
      ...p,
      content: p.caption,
    }));
  } catch {
    loadError = true;
  }

  return (
    <div className="home-posts w-full">
      <h2 className="h3-bold md:h2-bold text-left w-full">Home Feed</h2>

      {loadError && (
        <p className="text-light-4 mt-10 text-center w-full">
          Failed to load posts. Please try again.
        </p>
      )}

      {!loadError && posts.length > 0 && (
        <ul className="flex flex-col flex-1 gap-9 w-full">
          {posts.map((post) => (
            <li key={post.id} className="w-full">
              <PostCard
                post={post}
                currentUserId={currentUser?.id}
              />
            </li>
          ))}
        </ul>
      )}

      {!loadError && posts.length === 0 && (
        <div className="flex flex-col items-center gap-4 mt-10">
          <p className="text-light-4 text-center w-full">
            No posts available. Create your first post!
          </p>
          <Link href="/CreatePost">
            <Button className="shad-button_primary">Create Post</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
