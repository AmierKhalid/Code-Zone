import Link from "next/link";
import Image from "next/image";
import LeaderboardAvatar from "@/components/shared/LeaderboardAvatar";
import { getLeaderboardUsers } from "@/lib/leaderboard";
import { getProfileImageUrl } from "@/lib/utils";

function getRankBadge(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function getTitleColor(titleKey: string | null) {
  if (!titleKey) return "text-light-3";
  const key = titleKey.toLowerCase();
  const titleColors: Record<string, string> = {
    legend: "text-yellow-400",
    grandmaster: "text-purple-400",
    master: "text-blue-400",
    master_of_code: "text-amber-300",
    expert: "text-green-400",
    journeyman: "text-cyan-400",
    apprentice: "text-orange-400",
    novice: "text-gray-400",
    the_debuger: "text-fuchsia-400",
  };
  return titleColors[key] || "text-light-3";
}

export default async function Leaderboard() {
  const users = await getLeaderboardUsers(10);

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h3 className="h3-bold inline-flex items-center gap-2">
          <Image src="/icons/cup.svg" width={35} height={35} alt="Leaderboard" />
          <span>Leaderboard</span>
        </h3>
        <p className="small-regular text-light-3">Top contributors</p>
      </div>

      <div className="leaderboard-list">
        {users.length === 0 ? (
          <p className="small-regular text-light-4 px-2 py-4 text-center">
            No users yet. Points will show here once profiles earn them.
          </p>
        ) : (
          users.map((user) => (
            <Link
              key={user.id}
              href={`/profile/${user.id}`}
              className="leaderboard-item"
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="leaderboard-rank">
                  <span className="rank-badge">{getRankBadge(user.rank)}</span>
                </div>

                <LeaderboardAvatar
                  src={getProfileImageUrl({ imageUrl: user.imageUrl })}
                  alt={user.name}
                  className="leaderboard-avatar"
                />

                <div className="flex-1 min-w-0">
                  <p className="small-semibold text-light-1 truncate mb-0.5">
                    {user.name}
                  </p>
                  <p className="tiny-medium text-light-3 truncate mb-0.5">
                    @{user.username}
                  </p>
                  {user.titleLabel && (
                    <p
                      className={`tiny-medium ${getTitleColor(user.titleKey)} truncate`}
                    >
                      {user.titleLabel}
                    </p>
                  )}
                </div>
              </div>

              <div className="leaderboard-points flex-shrink-0">
                <p className="small-semibold text-primary-500 mb-0.5">
                  {user.points.toLocaleString()}
                </p>
                <p className="tiny-medium text-light-3">pts</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
