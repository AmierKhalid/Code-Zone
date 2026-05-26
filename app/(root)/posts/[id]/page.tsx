import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import GridPostList from "@/components/shared/GridPostList";
import PostDetailsActions from "@/components/shared/PostDetailsActions";
import { auth } from "@clerk/nextjs/server";
import type { Post } from "@/app/types/index";
import ProfileBackButton from "@/components/shared/ProfileBackButton";
import PostDetailCommentsBridge from "@/components/shared/PostDetailCommentsBridge";
import { buildMentionCandidates } from "@/lib/mentionUsers";
import { getPostCommentsFlat } from "@/lib/postCommentsQueries";
import type { Metadata } from "next";

/* ── Dynamic metadata for SEO ─────────────────────────────── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await db.post.findUnique({
    where: { id },
    select: {
      caption: true,
      mediaUrl: true,
      author: { select: { name: true, username: true } },
    },
  });
  if (!post) return { title: "Post Not Found" };
  const title = `${post.author.name || post.author.username || "User"}'s Post`;
  const description =
    post.caption?.slice(0, 160) || "View this post on Code Zone";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(post.mediaUrl ? { images: [{ url: post.mediaUrl }] } : {}),
    },
  };
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch post, auth, and comments in parallel to minimize waterfall
  const [rawPost, authResult, commentsFlat] = await Promise.all([
    db.post.findUnique({
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
    }),
    auth(),
    getPostCommentsFlat(id),
  ]);

  if (!rawPost) notFound();

  const { caption, ...rest } = rawPost;
  const post: Post = {
    ...rest,
    content: caption,
  };

  // Fetch current user, related posts, and mention candidates in parallel
  const [currentUser, relatedRaw, usersFromStoredMentions] = await Promise.all([
    authResult.userId
      ? db.user.findUnique({
          where: { accountId: authResult.userId },
          select: { id: true },
        })
      : Promise.resolve(null),
    db.post.findMany({
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
    }),
    (() => {
      const mentionIds = [
        ...new Set(commentsFlat.flatMap((c: typeof commentsFlat[number]) => c.mentionedUserIds)),
      ];
      return mentionIds.length > 0
        ? db.user.findMany({
            where: { id: { in: mentionIds } },
            select: { id: true, username: true },
          })
        : Promise.resolve([]);
    })(),
  ]);

  const relatedPosts: Post[] = relatedRaw.map((p: typeof relatedRaw[number]) => {
    const { caption: cap, ...others } = p;
    return { ...others, content: cap };
  });

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

      <div className="post_details-card">
        {/* Image panel: fixed height on mobile/tablet, fills card height on xl */}
        <div
          className="relative flex-center w-full xl:w-[48%] h-[320px] lg:h-[480px] xl:h-full bg-dark-1 overflow-hidden rounded-t-3xl xl:rounded-t-none xl:rounded-l-3xl shrink-0"
        >
          {/* Blurred fill — covers any letterbox gaps */}
          <img
            src={post.mediaUrl || "/icons/profile-placeholder.svg"}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-30 pointer-events-none select-none"
          />
          {/* Full image — always fully visible, never cropped */}
          <img
            src={post.mediaUrl || "/icons/profile-placeholder.svg"}
            alt="post"
            className="relative z-10 w-full h-full object-contain"
          />
        </div>

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
