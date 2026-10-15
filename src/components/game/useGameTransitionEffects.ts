import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type { GameState } from "@/game/reducer";
import type { SaveData } from "@/game/storage";
import { applyMissionWinProgress } from "@/game/progression";
import { play } from "@/game/sound";

/** Handles sound and progression effects caused by domain-state transitions. */
export function useGameTransitionEffects(
  state: GameState,
  previousState: MutableRefObject<GameState>,
  soundEnabled: boolean,
  ready: boolean,
  setSave: Dispatch<SetStateAction<SaveData>>,
) {
  useEffect(() => {
    if (!ready) return;

    const previous = previousState.current;
    previousState.current = state;

    if (previous.attempts.length < state.attempts.length && state.phase === "playing") {
      play("error", soundEnabled);
    }
    if (previous.hints.length < state.hints.length) play("hint", soundEnabled);

    if (previous.phase === state.phase) return;

    if (state.phase === "won") {
      play("win", soundEnabled);
      setSave((current) => applyMissionWinProgress(current, state));
    }

    if (state.phase === "lost") play("lose", soundEnabled);
  }, [state, soundEnabled, ready, setSave, previousState]);
}
