import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SAVE,
  getRankForXp,
  getRankProgress,
  loadGameState,
  loadSave,
  writeGameState,
  writeSave,
} from "./storage";
import { initialState, reducer } from "./reducer";

describe("save storage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });
  it("returns defaults when there is no saved progress", () => {
    expect(loadSave()).toEqual(DEFAULT_SAVE);
  });
  it("round trips valid progress independently for all difficulties", () => {
    const save = {
      ...DEFAULT_SAVE,
      sound: false,
      difficulty: "avanzado" as const,
      progress: {
        facil: { bestScore: 300, unlocked: 2 },
        medio: { bestScore: 1280, unlocked: 4 },
        avanzado: { bestScore: 900, unlocked: 3 },
      },
      bestScore: 900,
      unlocked: 3,
    };
    writeSave(save);
    expect(loadSave()).toEqual(save);
  });
  it("migrates the old save into medium difficulty", () => {
    sessionStorage.setItem(
      "neon-breach:v1",
      JSON.stringify({ bestScore: 900, unlocked: 3, sound: false }),
    );
    expect(loadSave()).toMatchObject({
      bestScore: 900,
      unlocked: 3,
      sound: false,
      difficulty: "medio",
      progress: {
        medio: { bestScore: 900, unlocked: 3 },
        facil: { bestScore: 0, unlocked: 1 },
        avanzado: { bestScore: 0, unlocked: 1 },
      },
    });
  });
  it("falls back to defaults for malformed JSON", () => {
    sessionStorage.setItem("neon-breach:v2", "{broken");
    expect(loadSave()).toEqual(DEFAULT_SAVE);
  });
  it("clamps unlocked mission and normalizes invalid fields", () => {
    sessionStorage.setItem(
      "neon-breach:v2",
      JSON.stringify({ bestScore: "bad", unlocked: 100, sound: "yes" }),
    );
    expect(loadSave()).toMatchObject({ bestScore: 0, unlocked: 5, sound: true });
  });
  it("normalizes persisted XP and calculates rank progression", () => {
    sessionStorage.setItem("neon-breach:v2", JSON.stringify({ xp: 850 }));
    expect(loadSave().xp).toBe(850);
    expect(getRankForXp(0).name).toBe("Recluta");
    expect(getRankForXp(850).name).toBe("Intrusa");
    expect(getRankProgress(850)).toMatchObject({ current: 6, remaining: 750 });
    expect(getRankForXp(3500).name).toBe("Leyenda Neón");
  });
  it("round trips the active mission separately from player progress", () => {
    const game = reducer(initialState, {
      type: "START",
      missionIndex: 0,
      seed: 123,
      difficulty: "medio",
    });
    writeGameState(game);
    expect(loadGameState()).toEqual(game);
    expect(sessionStorage.getItem("neon-breach:v2")).toBeNull();
  });
  it("clears the active mission when returning to the title", () => {
    const game = reducer(initialState, { type: "START", missionIndex: 0, seed: 123 });
    writeGameState(game);
    writeGameState(initialState);
    expect(loadGameState()).toBeNull();
  });
  it("discards a saved game with malformed nested state", () => {
    sessionStorage.setItem(
      "neon-breach:active-game:v1",
      JSON.stringify({
        phase: "playing",
        missionIndex: 0,
        difficulty: "medio",
        secret: [1, 2, 3, 4],
        input: [1, 1],
        attempts: [],
        hints: [],
        timeLeft: 100,
        seed: 123,
        runScore: 0,
        streak: 0,
        log: [],
        logId: 0,
      }),
    );

    expect(loadGameState()).toBeNull();
    expect(sessionStorage.getItem("neon-breach:active-game:v1")).toBeNull();
  });

  it("rejects saved missions that violate the selected difficulty rules", () => {
    const invalidGame = reducer(initialState, {
      type: "START",
      missionIndex: 0,
      seed: 123,
      difficulty: "medio",
    });
    sessionStorage.setItem(
      "neon-breach:active-game:v1",
      JSON.stringify({ ...invalidGame, secret: [1, 2, 3] }),
    );

    expect(loadGameState()).toBeNull();
    expect(sessionStorage.getItem("neon-breach:active-game:v1")).toBeNull();
  });

  it("does not throw when storage writes are unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => writeSave(DEFAULT_SAVE)).not.toThrow();
  });
});
