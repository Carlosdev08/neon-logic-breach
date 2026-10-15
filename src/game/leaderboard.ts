export type LeaderboardPeriod = "global" | "weekly" | "daily";

/** Returns the local-calendar start boundary used to filter leaderboard scores. */
export function getLeaderboardPeriodStart(
  period: LeaderboardPeriod,
  now = new Date(),
): Date | null {
  if (period === "global") return null;

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (period === "weekly") {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  }

  return start;
}

/** Supports Supabase's one-to-one and one-to-many relationship response shapes. */
export function getLeaderboardUsername(
  profiles: { username: string } | { username: string }[] | null | undefined,
): string {
  return (Array.isArray(profiles) ? profiles[0]?.username : profiles?.username) ?? "Operador";
}


export type ScoreEntry = {
  user_id: string;
  score: number;
  difficulty: string;
  created_at: string;
  profiles: { username: string } | { username: string }[] | null;
};

export type LeaderboardEntry = ScoreEntry & { totalScore: number; missions: number };

/** Groups mission results into one cumulative ranking entry per account. */
export function aggregateLeaderboardScores(rows: ScoreEntry[]): LeaderboardEntry[] {
  const byUser = new Map<string, LeaderboardEntry>();
  for (const row of rows) {
    const current = byUser.get(row.user_id);
    if (current) {
      current.totalScore += row.score;
      current.missions += 1;
      if (row.created_at > current.created_at) {
        current.created_at = row.created_at;
        current.difficulty = row.difficulty;
        current.profiles = row.profiles;
      }
    } else {
      byUser.set(row.user_id, { ...row, totalScore: row.score, missions: 1 });
    }
  }
  return [...byUser.values()].sort((a, b) => b.totalScore - a.totalScore);
}
