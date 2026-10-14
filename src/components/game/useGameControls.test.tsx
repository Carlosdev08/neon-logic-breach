import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useGameKeyboard, useGameTimer } from "./useGameControls";
import type { Action, Phase } from "@/game/reducer";

function KeyboardHarness(props: { phase: Phase; helpOpen?: boolean; resetConfirmationOpen?: boolean; dispatch: (action: Action) => void }) {
  useGameKeyboard({
    phase: props.phase,
    dispatch: props.dispatch,
    helpOpen: props.helpOpen ?? false,
    resetConfirmationOpen: props.resetConfirmationOpen ?? false,
    soundEnabled: false,
  });
  return null;
}

function TimerHarness({ phase, dispatch }: { phase: Phase; dispatch: (action: Action) => void }) {
  useGameTimer(phase, dispatch);
  return null;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("useGameKeyboard", () => {
  it("maps numeric, erase, clear, submit and pause keys to actions", () => {
    const dispatch = vi.fn();
    render(<KeyboardHarness phase="playing" dispatch={dispatch} />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "7" }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace" }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete" }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", cancelable: true }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "p" }));
    });
    expect(dispatch.mock.calls.map(([action]) => action)).toEqual([
      { type: "DIGIT", digit: 7 },
      { type: "BACKSPACE" },
      { type: "CLEAR" },
      { type: "SUBMIT" },
      { type: "PAUSE" },
    ]);
  });

  it("does not handle game keys while help or reset confirmation is open", () => {
    const dispatch = vi.fn();
    const { rerender } = render(<KeyboardHarness phase="playing" helpOpen dispatch={dispatch} />);
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "3" })));
    expect(dispatch).not.toHaveBeenCalled();
    rerender(<KeyboardHarness phase="playing" resetConfirmationOpen dispatch={dispatch} />);
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "3" })));
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("resumes from Escape when paused and ignores input on title screen", () => {
    const dispatch = vi.fn();
    const { rerender } = render(<KeyboardHarness phase="paused" dispatch={dispatch} />);
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
    expect(dispatch).toHaveBeenCalledWith({ type: "RESUME" });
    dispatch.mockClear();
    rerender(<KeyboardHarness phase="title" dispatch={dispatch} />);
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "2" })));
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe("useGameTimer", () => {
  it("ticks once per second while playing and cleans up after pause", () => {
    vi.useFakeTimers();
    const dispatch = vi.fn();
    const { rerender, unmount } = render(<TimerHarness phase="playing" dispatch={dispatch} />);
    act(() => vi.advanceTimersByTime(2000));
    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenLastCalledWith({ type: "TICK" });
    rerender(<TimerHarness phase="paused" dispatch={dispatch} />);
    act(() => vi.advanceTimersByTime(3000));
    expect(dispatch).toHaveBeenCalledTimes(2);
    unmount();
  });
});
