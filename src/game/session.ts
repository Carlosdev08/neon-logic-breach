import type { GameState } from "./reducer";

const SESSION_KEY = "neon-breach:session:v1";

/** Recover an unfinished run after a browser refresh. */
export function loadGameSession(): GameState | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<GameState>;
    const phases = ["playing", "paused", "won", "lost", "victory"];
    const valid =
      phases.includes(String(value.phase)) &&
      Number.isInteger(value.missionIndex) &&
      ["facil", "medio", "avanzado"].includes(String(value.difficulty)) &&
      Array.isArray(value.secret) &&
      Array.isArray(value.input) &&
      Array.isArray(value.attempts) &&
      Array.isArray(value.hints) &&
      Array.isArray(value.log) &&
      Number.isFinite(value.timeLeft) &&
      Number.isFinite(value.seed);
    if (!valid) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return value as GameState;
  } catch {
    try { localStorage.removeItem(SESSION_KEY); } catch { /* storage unavailable */ }
    return null;
  }
}

export function writeGameSession(state: GameState) {
  try {
    if (state.phase === "title") {
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}
