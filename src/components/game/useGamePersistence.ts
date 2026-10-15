import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  DEFAULT_SAVE,
  loadGameState,
  loadSave,
  writeGameState,
  writeSave,
  type SaveData,
} from "@/game/storage";
import type { Action, GameState } from "@/game/reducer";

/**
 * Coordinates persistence at the React boundary.
 * Storage details stay outside the game UI and the reducer stays pure.
 */
export function useGamePersistence(
  state: GameState,
  dispatch: Dispatch<Action>,
  save: SaveData,
  setSave: Dispatch<SetStateAction<SaveData>>,
) {
  const [loaded, setLoaded] = useState(false);
  const [gameLoaded, setGameLoaded] = useState(false);

  useEffect(() => {
    setSave(loadSave());
    const savedGame = loadGameState();

    if (savedGame) {
      const restored =
        savedGame.phase === "playing"
          ? { ...savedGame, phase: "paused" as const }
          : savedGame;
      dispatch({ type: "RESTORE", state: restored });
    }

    setLoaded(true);
    setGameLoaded(true);
  }, [dispatch, setSave]);

  useEffect(() => {
    if (loaded) writeSave(save);
  }, [save, loaded]);

  useEffect(() => {
    if (gameLoaded) writeGameState(state);
  }, [state, gameLoaded]);

  return { loaded };
}
