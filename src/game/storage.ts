const BEST_SCORE_KEY = "neon-breach:best-score";
const UNLOCKED_KEY = "neon-breach:unlocked-mission";

export function readBestScore(): number {
  if (typeof localStorage === "undefined") return 0;
  const value = Number(localStorage.getItem(BEST_SCORE_KEY) ?? 0);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function saveBestScore(score: number): void {
  if (typeof localStorage === "undefined" || !Number.isFinite(score)) return;
  localStorage.setItem(BEST_SCORE_KEY, String(Math.max(readBestScore(), score)));
}

export function readUnlockedMission(): number {
  if (typeof localStorage === "undefined") return 0;
  const value = Number(localStorage.getItem(UNLOCKED_KEY) ?? 0);
  return Number.isInteger(value) ? Math.max(0, Math.min(4, value)) : 0;
}

export function saveUnlockedMission(mission: number): void {
  if (typeof localStorage === "undefined" || !Number.isInteger(mission)) return;
  localStorage.setItem(UNLOCKED_KEY, String(Math.max(readUnlockedMission(), Math.max(0, Math.min(4, mission)))));
}

export function resetProgress(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(BEST_SCORE_KEY);
  localStorage.removeItem(UNLOCKED_KEY);
}
