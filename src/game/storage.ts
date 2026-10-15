import type { GameState } from "./reducer";
import type { Difficulty } from "./logic";
const KEY = "neon-breach:v2";
export interface DifficultyProgress {
  bestScore: number;
  unlocked: number;
}
export interface SaveData {
  bestScore: number;
  unlocked: number;
  sound: boolean;
  difficulty: Difficulty;
  progress: Record<Difficulty, DifficultyProgress>;
}
export const DEFAULT_SAVE: SaveData = {
  bestScore: 0,
  unlocked: 1,
  sound: true,
  difficulty: "medio",
  progress: {
    facil: { bestScore: 0, unlocked: 1 },
    medio: { bestScore: 0, unlocked: 1 },
    avanzado: { bestScore: 0, unlocked: 1 },
  },
};
export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem("neon-breach:v1");
    if (!raw) return DEFAULT_SAVE;
    const p = JSON.parse(raw) as Partial<SaveData>;
    const oldBest = typeof p.bestScore === "number" ? p.bestScore : 0;
    const oldUnlocked = typeof p.unlocked === "number" ? Math.min(5, Math.max(1, p.unlocked)) : 1;
    const progress = { ...DEFAULT_SAVE.progress, ...(p.progress ?? {}) };
    for (const difficulty of ["facil", "medio", "avanzado"] as const) {
      const value = p.progress?.[difficulty];
      progress[difficulty] = {
        bestScore:
          typeof value?.bestScore === "number"
            ? value.bestScore
            : difficulty === "medio"
              ? oldBest
              : 0,
        unlocked:
          typeof value?.unlocked === "number"
            ? Math.min(5, Math.max(1, value.unlocked))
            : difficulty === "medio"
              ? oldUnlocked
              : 1,
      };
    }
    const difficulty =
      p.difficulty === "facil" || p.difficulty === "avanzado" ? p.difficulty : "medio";
    return {
      bestScore: progress[difficulty].bestScore,
      unlocked: progress[difficulty].unlocked,
      sound: typeof p.sound === "boolean" ? p.sound : true,
      difficulty,
      progress,
    };
  } catch {
    return DEFAULT_SAVE;
  }
}
export function writeSave(data: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable */
  }
}


const GAME_KEY = "neon-breach:active-game:v1";

export function loadGameState(): GameState | null {
  try {
    const raw = localStorage.getItem(GAME_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<GameState>;
    const phases = ["playing", "paused", "won", "lost", "victory"];
    const difficulties = ["facil", "medio", "avanzado"];
    if (
      !value ||
      typeof value !== "object" ||
      !phases.includes(value.phase ?? "") ||
      !difficulties.includes(value.difficulty ?? "") ||
      !Number.isInteger(value.missionIndex) ||
      (value.missionIndex ?? -1) < 0 ||
      !Array.isArray(value.secret) ||
      !Array.isArray(value.input) ||
      !Array.isArray(value.attempts) ||
      !Array.isArray(value.hints) ||
      !Array.isArray(value.log) ||
      typeof value.timeLeft !== "number" ||
      typeof value.seed !== "number" ||
      typeof value.runScore !== "number" ||
      typeof value.streak !== "number"
    ) {
      localStorage.removeItem(GAME_KEY);
      return null;
    }
    return value as GameState;
  } catch {
    try { localStorage.removeItem(GAME_KEY); } catch { /* storage unavailable */ }
    return null;
  }
}

export function writeGameState(state: GameState) {
  try {
    if (state.phase === "title") {
      localStorage.removeItem(GAME_KEY);
      return;
    }
    localStorage.setItem(GAME_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}
