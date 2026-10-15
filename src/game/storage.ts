import type { Difficulty } from "./logic";
const KEY = "neon-breach:v2";
export interface DifficultyProgress {
  bestScore: number;
  unlocked: number;
}
export interface SaveData {
  xp: number;
  bestScore: number;
  unlocked: number;
  sound: boolean;
  difficulty: Difficulty;
  progress: Record<Difficulty, DifficultyProgress>;
}
export const DEFAULT_SAVE: SaveData = {
  xp: 0,
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
      xp: typeof p.xp === "number" && Number.isFinite(p.xp) ? Math.max(0, Math.floor(p.xp)) : 0,
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
export const XP_RANKS = [
  { name: "Recluta", minXp: 0, nextXp: 300 },
  { name: "Operadora", minXp: 300, nextXp: 800 },
  { name: "Intrusa", minXp: 800, nextXp: 1600 },
  { name: "Fantasma", minXp: 1600, nextXp: 3000 },
  { name: "Leyenda Neón", minXp: 3000, nextXp: null },
] as const;

export function getRankForXp(xp: number) {
  return [...XP_RANKS].reverse().find((rank) => xp >= rank.minXp) ?? XP_RANKS[0];
}

export function getRankProgress(xp: number) {
  const rank = getRankForXp(xp);
  if (rank.nextXp === null) return { rank, current: 100, remaining: 0 };
  return {
    rank,
    current: Math.min(100, Math.round(((xp - rank.minXp) / (rank.nextXp - rank.minXp)) * 100)),
    remaining: Math.max(0, rank.nextXp - xp),
  };
}

export function writeSave(data: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable */
  }
}
