import { describe, expect, it } from "vitest";
import { MISSIONS } from "./logic";
import { initialState, reducer } from "./reducer";

function start(seed = 42) {
  return reducer(initialState, { type: "START", missionIndex: 0, seed });
}

describe("game reducer", () => {
  it("starts a deterministic mission with a clean state", () => {
    const first = start();
    const second = start();
    expect(first.phase).toBe("playing");
    expect(first.secret).toEqual(second.secret);
    expect(first.secret).toHaveLength(MISSIONS[0]!.codeLength);
    expect(first.timeLeft).toBe(MISSIONS[0]!.timeLimit);
    expect(first.log).toHaveLength(3);
  });

  it("accepts unique digits only and supports clear/backspace", () => {
    let state = start();
    state = reducer(state, { type: "DIGIT", digit: 4 });
    const afterFour = reducer(state, { type: "DIGIT", digit: 4 });
    expect(afterFour.input).toEqual([4]);
    state = reducer(afterFour, { type: "DIGIT", digit: 2 });
    state = reducer(state, { type: "BACKSPACE" });
    expect(state.input).toEqual([4]);
    state = reducer(state, { type: "CLEAR" });
    expect(state.input).toEqual([]);
  });

  it("does not submit an incomplete code", () => {
    const state = reducer(start(), { type: "DIGIT", digit: 1 });
    expect(reducer(state, { type: "SUBMIT" })).toEqual(state);
  });

  it("wins on the secret and calculates a score", () => {
    let state = start();
    for (const digit of state.secret) state = reducer(state, { type: "DIGIT", digit });
    state = reducer(state, { type: "SUBMIT" });
    expect(state.phase).toBe("won");
    expect(state.lastScore?.total).toBeGreaterThan(0);
    expect(state.streak).toBe(1);
    expect(state.runScore).toBe(state.lastScore?.total);
  });

  it("moves to the next mission after a win and maintains the run", () => {
    let state = start();
    for (const digit of state.secret) state = reducer(state, { type: "DIGIT", digit });
    state = reducer(state, { type: "SUBMIT" });
    const score = state.runScore;
    state = reducer(state, { type: "CONTINUE", seed: 7 });
    expect(state.phase).toBe("playing");
    expect(state.missionIndex).toBe(1);
    expect(state.runScore).toBe(score);
    expect(state.streak).toBe(1);
  });

  it("loses when time expires and resets the streak", () => {
    let state = { ...start(), timeLeft: 1, streak: 2 };
    state = reducer(state, { type: "TICK" });
    expect(state.phase).toBe("lost");
    expect(state.timeLeft).toBe(0);
    expect(state.lostReason).toBe("time");
    expect(state.streak).toBe(0);
  });

  it("pauses and resumes only valid phases", () => {
    const playing = start();
    const paused = reducer(playing, { type: "PAUSE" });
    expect(paused.phase).toBe("paused");
    expect(reducer(paused, { type: "PAUSE" })).toEqual(paused);
    expect(reducer(paused, { type: "RESUME" }).phase).toBe("playing");
  });

  it("ignores gameplay actions when not playing", () => {
    expect(reducer(initialState, { type: "DIGIT", digit: 9 })).toEqual(initialState);
    expect(reducer(initialState, { type: "HINT" })).toEqual(initialState);
  });
});
