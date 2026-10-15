import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type { GameState } from "@/game/reducer";
import type { SaveData } from "@/game/storage";
import { play } from "@/game/sound";

/** Handles sound and progression effects caused by domain-state transitions. */
export function useGameTransitionEffects(
  state: GameState,
  previousState: MutableRefObject<GameState>,
  soundEnabled: boolean,
  setSave: Dispatch<SetStateAction<SaveData>>,
) {
  useEffect(() => {
    const previous = previousState.current;
    previousState.current = state;

    if (previous.attempts.length < state.attempts.length && state.phase === "playing") {
      play("error", soundEnabled);
    }
    if (previous.hints.length < state.hints.length) play("hint", soundEnabled);

    if (previous.phase === state.phase) return;

    if (state.phase === "won") {
      play("win", soundEnabled);
      const xpGain =
        50 +
        Math.floor((state.lastScore?.total ?? 0) / 20) +
        (state.difficulty === "facil" ? 0 : state.difficulty === "medio" ? 25 : 50);
      const unlocked = Math.max(
        state.missionIndex + 2 > 5 ? 5 : state.missionIndex + 2,
        1,
      );

      setSave((current) => {
        const difficultyProgress = current.progress[state.difficulty];
        const nextUnlocked = Math.max(difficultyProgress.unlocked, unlocked);
        const nextBestScore = Math.max(difficultyProgress.bestScore, state.runScore);

        return {
          ...current,
          xp: current.xp + xpGain,
          unlocked: nextUnlocked,
          bestScore: nextBestScore,
          progress: {
            ...current.progress,
            [state.difficulty]: {
              unlocked: nextUnlocked,
              bestScore: nextBestScore,
            },
          },
        };
      });
    }

    if (state.phase === "lost") play("lose", soundEnabled);
  }, [state, soundEnabled, setSave, previousState]);
}
