import { cache } from "react";
import { db } from "@/lib/db";
import type { Post } from "@/app/types/index";

export type ProfileUser = {
  id: string;
  name: string | null;
  username: string | null;
  bio: string | null;
  image: string | null;
  postsCount: number;
  followersCount: number;
  followingCount: number;
};

const postInclude = {
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
} as const;

function mapToPost(
  p: {
    id: string;
    authorId: string;
    caption: string | null;
    location: string | null;
    tags: string[];
    mediaUrl: string | null;
    likesCount: number;
    commentsCount: number;
    createdAt: Date;
    updatedAt: Date;
    author: Post["author"];
    likes: Post["likes"];
    saves: Post["saves"];
  },
): Post {
  const { caption, ...rest } = p;
  return { ...rest, content: caption };
}

export const getProfileUser = cache(
  async (id: string): Promise<ProfileUser | null> => {
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        image: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      bio: user.bio,
      image: user.image,
      postsCount: user._count.posts,
      followersCount: user._count.followers,
      followingCount: user._count.following,
    };
  },
);

export const getProfilePosts = cache(async (authorId: string): Promise<Post[]> => {
  const raw = await db.post.findMany({
    where: { authorId },
    orderBy: { createdAt: "desc" },
    include: postInclude,
  });
  return raw.map(mapToPost);
});

export const getLikedPostsForUser = cache(
  async (userId: string): Promise<Post[]> => {
    const raw = await db.post.findMany({
      where: {
        likes: { some: { userId } },
      },
      orderBy: { createdAt: "desc" },
      include: postInclude,
    });
    return raw.map(mapToPost);
  },
);

export const getSavedPostsForUser = cache(
  async (userId: string): Promise<Post[]> => {
    const raw = await db.post.findMany({
      where: {
        saves: { some: { userId } },
      },
      orderBy: { createdAt: "desc" },
      include: postInclude,
    });
    return raw.map(mapToPost);
  },
);
