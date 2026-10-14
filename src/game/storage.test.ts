import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SAVE, loadSave, writeSave } from "./storage";

describe("save storage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns defaults when there is no saved progress", () => {
    expect(loadSave()).toEqual(DEFAULT_SAVE);
  });

  it("round trips valid progress", () => {
    const save = { bestScore: 1280, unlocked: 4, sound: false };
    writeSave(save);
    expect(loadSave()).toEqual(save);
  });

  it("falls back to defaults for malformed JSON", () => {
    localStorage.setItem("neon-breach:v1", "{broken");
    expect(loadSave()).toEqual(DEFAULT_SAVE);
  });

  it("normalizes invalid fields and clamps unlocked mission", () => {
    localStorage.setItem(
      "neon-breach:v1",
      JSON.stringify({ bestScore: "bad", unlocked: 100, sound: "yes" }),
    );
    expect(loadSave()).toEqual({ bestScore: 0, unlocked: 5, sound: true });
  });

  it("does not throw when storage writes are unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => writeSave(DEFAULT_SAVE)).not.toThrow();
  });
});
