import { describe, expect, it } from "vitest";
import { createPuzzle, evaluateGuess, isSolved } from "./logic";

describe("evaluateGuess", () => {
  it("counts digits in the correct position", () => {
    expect(evaluateGuess("1234", "1298")).toEqual({ exact: 2, misplaced: 0 });
  });

  it("counts misplaced matching digits", () => {
    expect(evaluateGuess("1234", "4321")).toEqual({ exact: 0, misplaced: 4 });
  });

  it("handles repeated digits without double counting", () => {
    expect(evaluateGuess("1123", "4111")).toEqual({ exact: 1, misplaced: 1 });
  });

  it("recognises a solved puzzle", () => {
    expect(isSolved("0427", "0427")).toBe(true);
    expect(isSolved("0427", "0472")).toBe(false);
  });

  it("generates a code of the requested length with unique digits", () => {
    const puzzle = createPuzzle(4, 8);
    expect(puzzle.secret).toMatch(/^\d{4}$/);
    expect(new Set(puzzle.secret).size).toBe(4);
    expect(puzzle.maxAttempts).toBe(8);
  });
});
