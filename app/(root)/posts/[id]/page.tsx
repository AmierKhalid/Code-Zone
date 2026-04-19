import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import GridPostList from "@/components/shared/GridPostList";
import PostDetailsActions from "@/components/shared/PostDetailsActions";
import Loader from "@/components/shared/Loader";
import { auth } from "@clerk/nextjs/server";
import type { Post } from "@/app/types/index";
import ProfileBackButton from "@/components/shared/ProfileBackButton";
import PostDetailCommentsBridge from "@/components/shared/PostDetailCommentsBridge";
import { buildMentionCandidates } from "@/lib/mentionUsers";
import { getPostCommentsFlat } from "@/lib/postCommentsQueries";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const rawPost = await db.post.findUnique({
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

  if (!rawPost) notFound();

  const { caption, ...rest } = rawPost;
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

  const relatedRaw = await db.post.findMany({
    where: {
      authorId: post.authorId,
      NOT: { id: post.id },
    },
    orderBy: { createdAt: "desc" },
    take: 9,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
      likes: { select: { id: true, userId: true } },
      saves: { select: { id: true, userId: true } },
    },
  });

  const relatedPosts: Post[] = relatedRaw.map((p) => {
    const { caption: cap, ...others } = p;
    return { ...others, content: cap };
  });

  const commentsFlat = await getPostCommentsFlat(id);
  const mentionIds = [
    ...new Set(commentsFlat.flatMap((c) => c.mentionedUserIds)),
  ];
  const usersFromStoredMentions =
    mentionIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: mentionIds } },
          select: { id: true, username: true },
        })
      : [];
  const mentionCandidates = buildMentionCandidates(
    post.author,
    commentsFlat,
    usersFromStoredMentions,
  );

  return (
    <div className="post_details-container">
      <div className="hidden md:flex max-w-5xl w-full">
        <ProfileBackButton />
      </div>

      {!post ? (
        <Loader />
      ) : (
        <div className="post_details-card">
          <img
            src={post.mediaUrl || "/icons/profile-placeholder.svg"}
            alt="post"
            className="post_details-img"
          />

          <div className="post_details-info">
            <div className="flex-between w-full">
              <Link
                href={`/profile/${post.author.id}`}
                className="flex items-center gap-3"
              >
                <img
                  src={post.author.image || "/icons/profile-placeholder.svg"}
                  alt="creator"
                  className="w-8 h-8 lg:w-12 lg:h-12 rounded-full object-cover"
                />
                <div className="flex gap-1 flex-col">
                  <p className="base-medium lg:body-bold text-light-1">
                    {post.author.name ?? post.author.username}
                  </p>
                  <div className="flex-center gap-2 text-light-3">
                    <p className="subtle-semibold lg:small-regular">
                      {new Date(post.createdAt).toLocaleString()}
                    </p>
                    {post.location && (
                      <>
                        •
                        <p className="subtle-semibold lg:small-regular">
                          {post.location}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </Link>

              <PostDetailsActions
                postId={post.id}
                canEdit={currentUser?.id === post.author.id}
              />
            </div>

            <hr className="border w-full border-dark-4/80" />

            <div className="flex flex-col flex-1 w-full small-medium lg:base-regular">
              <p>{post.content}</p>
              <ul className="flex gap-1 mt-2">
                {post.tags?.map((tag: string, index: number) => (
                  <li
                    key={`${tag}-${index}`}
                    className="text-light-3 small-regular"
                  >
                    #{tag}
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full">
              <PostDetailCommentsBridge
                post={post}
                currentUserId={currentUser?.id ?? undefined}
                commentsFlat={commentsFlat}
                mentionCandidates={mentionCandidates}
              />
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl">
        <hr className="border w-full border-dark-4/80" />

        <h3 className="body-bold md:h3-bold w-full my-10">
          More Related Posts
        </h3>
        {relatedPosts && relatedPosts.length > 0 ? (
          <GridPostList posts={relatedPosts} />
        ) : (
          <p className="text-light-4 mt-10 text-center w-full">
            No related posts found.
          </p>
        )}
      </div>
    </div>
  );
}
