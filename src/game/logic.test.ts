import { describe, it, expect } from "vitest";
import {
  createRng,
  generateSecret,
  scoreGuess,
  nextHint,
  computeScore,
  MISSIONS,
  type Hint,
  hintPenaltyFor,
} from "./logic";

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
      else if (h.kind === "present") expect(secret).toContain(h.digit);
      else expect(secret[h.index]).toBe(h.digit);
      hints.push(h);
    }
    expect(new Set(hints.map((h) => JSON.stringify(h))).size).toBe(6);
  });
});

describe("hint penalty tiers", () => {
  it("charges more for more revealing clues and scales by difficulty", () => {
    const hints: Hint[] = [
      { kind: "absent", digit: 1 },
      { kind: "present", digit: 7 },
      { kind: "position", index: 0, digit: 7 },
    ];
    expect(hintPenaltyFor(hints.slice(0, 1), "medio")).toBe(150);
    expect(hintPenaltyFor(hints.slice(0, 2), "medio")).toBe(400);
    expect(hintPenaltyFor(hints, "medio")).toBe(800);
    expect(hintPenaltyFor(hints, "facil")).toBe(600);
    expect(hintPenaltyFor(hints, "avanzado")).toBe(1250);
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

describe("generateSecret boundaries", () => {
  it("rejects lengths outside the available digit range", () => {
    expect(() => generateSecret(0, createRng(1))).toThrow("Longitud inválida");
    expect(() => generateSecret(11, createRng(1))).toThrow("Longitud inválida");
  });
  it("supports all ten unique digits", () => {
    const code = generateSecret(10, createRng(2026));
    expect(new Set(code).size).toBe(10);
    expect(code).toHaveLength(10);
  });
});

describe("progressive hints", () => {
  it("starts by eliminating a digit, then prioritizes revealing exact positions", () => {
    const secret = [7, 0, 3, 9];
    const first = nextHint(secret, [], createRng(12));
    expect(first?.kind).toBe("absent");
    const second = nextHint(secret, [first!], createRng(13));
    expect(second?.kind).toBe("present");
    if (second?.kind === "present") expect(secret).toContain(second.digit);
    const third = nextHint(secret, [first!, second!], createRng(14));
    expect(third?.kind).toBe("position");
  });
});

describe("nextHint exhaustion", () => {
  it("returns null after every absent digit and position has been revealed", () => {
    const secret = [1, 2];
    const hints: Hint[] = [
      { kind: "absent", digit: 0 },
      { kind: "position", index: 0, digit: 1 },
      { kind: "absent", digit: 3 },
      { kind: "position", index: 1, digit: 2 },
      ...[4, 5, 6, 7, 8, 9].map((digit): Hint => ({ kind: "absent", digit })),
    ];
    expect(nextHint(secret, hints, createRng(5))).toBeNull();
  });
});

describe("computeScore boundaries", () => {
  it("never returns a negative final score", () => {
    expect(
      computeScore({
        mission: MISSIONS[0]!,
        attemptsUsed: 100,
        timeLeft: 0,
        hintsUsed: 100,
        streak: 0,
      }).total,
    ).toBe(0);
  });
  it("adds time, attempts, and streak bonuses predictably", () => {
    const score = computeScore({
      mission: MISSIONS[0]!,
      attemptsUsed: 2,
      timeLeft: 10,
      hintsUsed: 0,
      streak: 2,
    });
    expect(score).toMatchObject({
      base: 500,
      timeBonus: 50,
      attemptBonus: 800,
      streakBonus: 500,
      total: 1850,
    });
  });
});

describe("difficulty presets", () => {
  it("provides five missions with distinct easy, medium and advanced rules", async () => {
    const { getMissionsForDifficulty } = await import("./logic");
    const easy = getMissionsForDifficulty("facil");
    const medium = getMissionsForDifficulty("medio");
    const advanced = getMissionsForDifficulty("avanzado");
    expect(easy).toHaveLength(5);
    expect(medium).toHaveLength(5);
    expect(advanced).toHaveLength(5);
    expect(easy[0]!.timeLimit).toBeGreaterThan(medium[0]!.timeLimit);
    expect(easy[0]!.maxAttempts).toBeGreaterThan(medium[0]!.maxAttempts);
    expect(advanced[0]!.codeLength).toBeGreaterThan(medium[0]!.codeLength);
    expect(advanced[0]!.timeLimit).toBeLessThan(medium[0]!.timeLimit);
  });
});
