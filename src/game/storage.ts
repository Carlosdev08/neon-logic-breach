import type { Difficulty } from "./logic";
const KEY = "neon-breach:v2";
export interface DifficultyProgress { bestScore: number; unlocked: number; }
export interface SaveData { bestScore: number; unlocked: number; sound: boolean; difficulty: Difficulty; progress: Record<Difficulty, DifficultyProgress>; }
export const DEFAULT_SAVE: SaveData = {
 bestScore: 0, unlocked: 1, sound: true, difficulty: "medio",
 progress: { facil: { bestScore: 0, unlocked: 1 }, medio: { bestScore: 0, unlocked: 1 }, avanzado: { bestScore: 0, unlocked: 1 } },
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
   const value = progress[difficulty];
   progress[difficulty] = {
    bestScore: typeof value?.bestScore === "number" ? value.bestScore : difficulty === "medio" ? oldBest : 0,
    unlocked: typeof value?.unlocked === "number" ? Math.min(5, Math.max(1, value.unlocked)) : difficulty === "medio" ? oldUnlocked : 1,
   };
  }
  const difficulty = p.difficulty === "facil" || p.difficulty === "avanzado" ? p.difficulty : "medio";
  return { bestScore: progress[difficulty].bestScore, unlocked: progress[difficulty].unlocked, sound: typeof p.sound === "boolean" ? p.sound : true, difficulty, progress };
 } catch { return DEFAULT_SAVE; }
}
export function writeSave(data: SaveData) {
 try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage unavailable */ }
}
