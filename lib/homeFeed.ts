import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

export const HOME_FEED_CACHE_TAG = "home-feed";

async function fetchHomePosts() {
  return db.post.findMany({
    orderBy: { createdAt: "desc" },
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
        select: {
          id: true,
          userId: true,
        },
      },
      saves: {
        select: {
          id: true,
          userId: true,
        },
      },
    },
  });
}

const getCachedHomePosts = unstable_cache(fetchHomePosts, ["home-feed-posts"], {
  tags: [HOME_FEED_CACHE_TAG],
  revalidate: 120,
});

export async function getHomePostsForFeed() {
  return getCachedHomePosts();
}
