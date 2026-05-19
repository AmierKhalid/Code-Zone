import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import type { tilteType } from "@/lib/generated/prisma/client";

export const LEADERBOARD_CACHE_TAG = "leaderboard";

export type LeaderboardUserRow = {
  id: string;
  rank: number;
  name: string;
  username: string;
  imageUrl: string | null;
  points: number;
  titleKey: tilteType | null;
  titleLabel: string | null;
};

function titleEnumToLabel(title: tilteType): string {
  return title
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

async function fetchLeaderboard(limit: number): Promise<LeaderboardUserRow[]> {
  const rows = await db.user.findMany({
    orderBy: [
      { totalPoints: { sort: "desc", nulls: "last" } },
      { createdAt: "asc" },
    ],
    take: limit,
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      totalPoints: true,
      title: true,
    },
  });

  return rows.map((u, index) => ({
    id: u.id,
    rank: index + 1,
    name: u.name?.trim() || u.username || "User",
    username: u.username || "user",
    imageUrl: u.image,
    points: u.totalPoints ?? 0,
    titleKey: u.title,
    titleLabel: u.title ? titleEnumToLabel(u.title) : null,
  }));
}

/** Cached leaderboard query — revalidates every 60s or on tag invalidation */
const getCachedLeaderboard = unstable_cache(
  (limit: number) => fetchLeaderboard(limit),
  ["leaderboard-users"],
  { tags: [LEADERBOARD_CACHE_TAG], revalidate: 60 },
);

export async function getLeaderboardUsers(
  limit = 10,
): Promise<LeaderboardUserRow[]> {
  return getCachedLeaderboard(limit);
}
