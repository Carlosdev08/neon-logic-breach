import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SAVE, loadSave, writeSave } from "./storage";

describe("save storage", () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });
  it("returns defaults when there is no saved progress", () => { expect(loadSave()).toEqual(DEFAULT_SAVE); });
  it("round trips valid progress independently for all difficulties", () => {
    const save = { ...DEFAULT_SAVE, sound: false, difficulty: "avanzado" as const,
      progress: { facil: { bestScore: 300, unlocked: 2 }, medio: { bestScore: 1280, unlocked: 4 }, avanzado: { bestScore: 900, unlocked: 3 } },
      bestScore: 900, unlocked: 3 };
    writeSave(save);
    expect(loadSave()).toEqual(save);
  });
  it("migrates the old save into medium difficulty", () => {
    localStorage.setItem("neon-breach:v1", JSON.stringify({ bestScore: 900, unlocked: 3, sound: false }));
    expect(loadSave()).toMatchObject({ bestScore: 900, unlocked: 3, sound: false, difficulty: "medio", progress: { medio: { bestScore: 900, unlocked: 3 }, facil: { bestScore: 0, unlocked: 1 }, avanzado: { bestScore: 0, unlocked: 1 } } });
  });
  it("falls back to defaults for malformed JSON", () => {
    localStorage.setItem("neon-breach:v2", "{broken");
    expect(loadSave()).toEqual(DEFAULT_SAVE);
  });
  it("clamps unlocked mission and normalizes invalid fields", () => {
    localStorage.setItem("neon-breach:v2", JSON.stringify({ bestScore: "bad", unlocked: 100, sound: "yes" }));
    expect(loadSave()).toMatchObject({ bestScore: 0, unlocked: 5, sound: true });
  });
  it("does not throw when storage writes are unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
    expect(() => writeSave(DEFAULT_SAVE)).not.toThrow();
  });
});
