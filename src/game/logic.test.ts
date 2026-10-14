import { describe, it, expect } from "vitest";
import { createRng, generateSecret, scoreGuess, nextHint, computeScore, MISSIONS, type Hint } from "./logic";

describe("generateSecret", () => {
  it("produces unique digits of the requested length", () => {
    for (let s = 0; s < 200; s++) {
      const code = generateSecret(5, createRng(s));
      expect(code).toHaveLength(5);
      expect(new Set(code).size).toBe(5);
    }
  });
  it("is deterministic for a seed", () => {
    expect(generateSecret(4, createRng(42))).toEqual(generateSecret(4, createRng(42)));
  });
});

describe("scoreGuess", () => {
  it("counts exact and misplaced", () => {
    expect(scoreGuess([1, 2, 3, 4], [1, 2, 3, 4])).toEqual({ exact: 4, misplaced: 0 });
    expect(scoreGuess([1, 2, 3, 4], [4, 3, 2, 1])).toEqual({ exact: 0, misplaced: 4 });
    expect(scoreGuess([1, 2, 3, 4], [1, 5, 2, 6])).toEqual({ exact: 1, misplaced: 1 });
  });
  it("does not double count repeated digits", () => {
    expect(scoreGuess([1, 2, 3, 4], [2, 2, 2, 2])).toEqual({ exact: 1, misplaced: 0 });
  });
});

describe("nextHint", () => {
  it("hints are truthful and never repeat", () => {
    const secret = [7, 0, 3, 9];
    const rng = createRng(1);
    const hints: Hint[] = [];
    for (let i = 0; i < 6; i++) {
      const h = nextHint(secret, hints, rng)!;
      if (h.kind === "absent") expect(secret).not.toContain(h.digit);
      else expect(secret[h.index]).toBe(h.digit);
      hints.push(h);
    }
    expect(new Set(hints.map((h) => JSON.stringify(h))).size).toBe(6);
  });
});

describe("computeScore", () => {
  it("applies 150 penalty per hint", () => {
    const m = MISSIONS[0]!;
    const a = computeScore({ mission: m, attemptsUsed: 3, timeLeft: 100, hintsUsed: 0, streak: 0 });
    const b = computeScore({ mission: m, attemptsUsed: 3, timeLeft: 100, hintsUsed: 2, streak: 0 });
    expect(a.total - b.total).toBe(300);
  });
});
