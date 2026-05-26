import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Post } from "@/lib/generated/prisma/client";

type FilterType = "all" | "newest" | "oldest" | "top";

type ExplorePostType = Post & {
  author: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  likes: { id: string; userId: string }[];
  saves: { id: string; userId: string }[];
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() ?? "";
    const filter = (searchParams.get("filter") as FilterType) ?? "all";
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(30, Math.max(1, Number(searchParams.get("limit") ?? "12")));

    const orderBy =
      filter === "oldest"
        ? { createdAt: "asc" as const }
        : filter === "top"
          ? { likesCount: "desc" as const }
          : { createdAt: "desc" as const };

    const where = query
      ? {
          OR: [
            { caption: { contains: query, mode: "insensitive" as const } },
            { author: { name: { contains: query, mode: "insensitive" as const } } },
            { author: { username: { contains: query, mode: "insensitive" as const } } },
          ],
        }
      : undefined;

    const rows = await db.post.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit + 1,
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

    const hasMore = rows.length > limit;
    const sliced = hasMore ? rows.slice(0, limit) : rows;
    const documents = sliced.map((p: ExplorePostType) => {
      const { caption, ...rest } = p;
      return { ...rest, content: caption };
    });

    return NextResponse.json({ documents, hasMore, page });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch posts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
