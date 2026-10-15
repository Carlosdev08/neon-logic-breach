export type LeaderboardPeriod = "global" | "weekly" | "daily";

/** Returns the local-calendar start boundary used to filter leaderboard scores. */
export function getLeaderboardPeriodStart(period: LeaderboardPeriod, now = new Date()): Date | null {
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
