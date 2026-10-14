import { useEffect, type Dispatch } from "react";
import type { Action, Phase } from "@/game/reducer";
import { play } from "@/game/sound";

interface KeyboardControls {
  phase: Phase;
  dispatch: Dispatch<Action>;
  helpOpen: boolean;
  resetConfirmationOpen: boolean;
  soundEnabled: boolean;
}

/** Owns the countdown lifecycle; the reducer remains responsible for game rules. */
export function useGameTimer(phase: Phase, dispatch: Dispatch<Action>) {
  useEffect(() => {
    if (phase !== "playing") return;
    const intervalId = window.setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => window.clearInterval(intervalId);
  }, [phase, dispatch]);
}

/** Maps physical keyboard input to domain actions without owning game state. */
export function useGameKeyboard({
  phase,
  dispatch,
  helpOpen,
  resetConfirmationOpen,
  soundEnabled,
}: KeyboardControls) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (helpOpen || resetConfirmationOpen) return;

      if (event.key === "Escape" || event.key.toLowerCase() === "p") {
        if (phase === "playing") dispatch({ type: "PAUSE" });
        else if (phase === "paused") dispatch({ type: "RESUME" });
        return;
      }

      if (phase !== "playing") return;

      if (/^[0-9]$/.test(event.key)) {
        dispatch({ type: "DIGIT", digit: Number(event.key) });
        play("key", soundEnabled);
      } else if (event.key === "Backspace") {
        dispatch({ type: "BACKSPACE" });
      } else if (event.key === "Delete") {
        dispatch({ type: "CLEAR" });
      } else if (event.key === "Enter") {
        event.preventDefault();
        dispatch({ type: "SUBMIT" });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, dispatch, helpOpen, resetConfirmationOpen, soundEnabled]);
}
