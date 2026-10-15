import { describe, expect, it } from "vitest";
import { initialState, type GameState } from "./reducer";
import { DEFAULT_SAVE } from "./storage";
import { applyMissionWinProgress, calculateMissionWinProgress } from "./progression";

function wonMission(overrides: Partial<GameState> = {}): GameState {
  return {
    ...initialState,
    phase: "won",
    difficulty: "medio",
    missionIndex: 1,
    runScore: 840,
    lastScore: {
      base: 500,
      timeBonus: 100,
      attemptBonus: 100,
      hintPenalty: 0,
      streakBonus: 0,
      total: 700,
    },
    ...overrides,
  };
}

describe("mission progression rules", () => {
  it("calculates rewards based on difficulty and completed mission", () => {
    expect(calculateMissionWinProgress(wonMission())).toEqual({
      xpGain: 110,
      unlocked: 3,
      bestScore: 840,
    });
    expect(
      calculateMissionWinProgress(wonMission({ difficulty: "facil", missionIndex: 9 })),
    ).toEqual({ xpGain: 85, unlocked: 5, bestScore: 840 });
  });

  it("updates only the active difficulty while preserving other progress", () => {
    const save = {
      ...DEFAULT_SAVE,
      xp: 200,
      progress: {
        facil: { bestScore: 100, unlocked: 2 },
        medio: { bestScore: 900, unlocked: 4 },
        avanzado: { bestScore: 50, unlocked: 1 },
      },
    };

    const updated = applyMissionWinProgress(save, wonMission());

    expect(updated.xp).toBe(310);
    expect(updated.progress).toEqual({
      facil: { bestScore: 100, unlocked: 2 },
      medio: { bestScore: 900, unlocked: 4 },
      avanzado: { bestScore: 50, unlocked: 1 },
    });
    expect(updated.bestScore).toBe(900);
    expect(updated.unlocked).toBe(4);
    expect(save.xp).toBe(200);
  });

  it("does not lower saved best score or unlocked mission", () => {
    const save = {
      ...DEFAULT_SAVE,
      bestScore: 2000,
      unlocked: 5,
      progress: {
        ...DEFAULT_SAVE.progress,
        medio: { bestScore: 2000, unlocked: 5 },
      },
    };

    const updated = applyMissionWinProgress(save, wonMission({ runScore: 100 }));

    expect(updated.progress.medio).toEqual({ bestScore: 2000, unlocked: 5 });
    expect(updated.bestScore).toBe(2000);
    expect(updated.unlocked).toBe(5);
  });
});
