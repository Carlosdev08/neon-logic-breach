const KEY = "neon-breach:v1";

export interface SaveData {
  bestScore: number;
  unlocked: number; // highest mission id the player may start
  sound: boolean;
}

export const DEFAULT_SAVE: SaveData = { bestScore: 0, unlocked: 1, sound: true };

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SAVE;
    const p = JSON.parse(raw) as Partial<SaveData>;
    return {
      bestScore: typeof p.bestScore === "number" ? p.bestScore : 0,
      unlocked: typeof p.unlocked === "number" ? Math.min(5, Math.max(1, p.unlocked)) : 1,
      sound: typeof p.sound === "boolean" ? p.sound : true,
    };
  } catch {
    return DEFAULT_SAVE;
  }
}

export function writeSave(data: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable: progress simply isn't persisted */
  }
}
