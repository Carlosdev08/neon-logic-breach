import { describe, expect, it } from "vitest";
import {
  aggregateLeaderboardScores,
  getLeaderboardPeriodStart,
  getLeaderboardUsername,
} from "./leaderboard";

describe("leaderboard helpers", () => {
  it("sums mission scores and returns one row per user", () => {
    const rows = aggregateLeaderboardScores([
      {
        user_id: "u1",
        score: 990,
        difficulty: "facil",
        created_at: "2026-10-16T10:00:00Z",
        profiles: { username: "CariodDev" },
        id: "1",
      },
      {
        user_id: "u1",
        score: 700,
        difficulty: "facil",
        created_at: "2026-10-16T09:00:00Z",
        profiles: { username: "CariodDev" },
        id: "2",
      },
      {
        user_id: "u2",
        score: 1200,
        difficulty: "medio",
        created_at: "2026-10-15T10:00:00Z",
        profiles: { username: "Otro" },
        id: "3",
      },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ user_id: "u1", totalScore: 1690, missions: 2 });
    expect(rows[1]).toMatchObject({ user_id: "u2", totalScore: 1200, missions: 1 });
  });

  it("does not apply a date boundary to the global leaderboard", () => {
    expect(getLeaderboardPeriodStart("global", new Date("2026-10-15T12:00:00"))).toBeNull();
  });

  it("starts the daily leaderboard at local midnight", () => {
    const start = getLeaderboardPeriodStart("daily", new Date(2026, 9, 15, 14, 30));
    expect(start?.getFullYear()).toBe(2026);
    expect(start?.getMonth()).toBe(9);
    expect(start?.getDate()).toBe(15);
    expect(start?.getHours()).toBe(0);
  });

  it("starts the weekly leaderboard on Monday at local midnight", () => {
    // Thursday, 15 October 2026.
    const start = getLeaderboardPeriodStart("weekly", new Date(2026, 9, 15, 14, 30));
    expect(start?.getFullYear()).toBe(2026);
    expect(start?.getMonth()).toBe(9);
    expect(start?.getDate()).toBe(12);
    expect(start?.getHours()).toBe(0);
  });

  it("normalizes profile relationship response shapes", () => {
    expect(getLeaderboardUsername({ username: "Nébula" })).toBe("Nébula");
    expect(getLeaderboardUsername([{ username: "OperadorX" }])).toBe("OperadorX");
    expect(getLeaderboardUsername([])).toBe("Operador");
    expect(getLeaderboardUsername(null)).toBe("Operador");
  });
});
