import { describe, expect, it } from "vitest";
import { getLeaderboardPeriodStart, getLeaderboardUsername } from "./leaderboard";

describe("leaderboard helpers", () => {
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
