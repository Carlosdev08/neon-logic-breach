import type { GameState } from "./reducer";
import type { SaveData } from "./storage";

export interface MissionWinProgress {
  xpGain: number;
  unlocked: number;
  bestScore: number;
}

/** Pure domain rule for the rewards granted after a mission is won. */
export function calculateMissionWinProgress(state: GameState): MissionWinProgress {
  const difficultyBonus =
    state.difficulty === "facil" ? 0 : state.difficulty === "medio" ? 25 : 50;

  return {
    xpGain: 50 + Math.floor((state.lastScore?.total ?? 0) / 20) + difficultyBonus,
    unlocked: Math.min(5, Math.max(1, state.missionIndex + 2)),
    bestScore: Math.max(0, state.runScore),
  };
}

/** Applies a mission reward without mutating the current save. */
export function applyMissionWinProgress(save: SaveData, state: GameState): SaveData {
  const reward = calculateMissionWinProgress(state);
  const currentDifficulty = save.progress[state.difficulty];
  const unlocked = Math.max(currentDifficulty.unlocked, reward.unlocked);
  const bestScore = Math.max(currentDifficulty.bestScore, reward.bestScore);

  return {
    ...save,
    xp: save.xp + reward.xpGain,
    unlocked,
    bestScore,
    progress: {
      ...save.progress,
      [state.difficulty]: { unlocked, bestScore },
    },
  };
}
