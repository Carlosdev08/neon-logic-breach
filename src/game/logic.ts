// NEON BREACH — pure, deterministic game logic (no React, no browser APIs).

export type Rng = () => number;

/** Mulberry32: small seeded PRNG so puzzles are reproducible in tests. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Difficulty = "facil" | "medio" | "avanzado";
export const DIFFICULTIES: { id: Difficulty; label: string; description: string }[] = [
  { id: "facil", label: "Fácil", description: "Más tiempo, más intentos y más pistas." },
  { id: "medio", label: "Medio", description: "Un reto equilibrado para afinar tu lógica." },
  {
    id: "avanzado",
    label: "Avanzado",
    description: "Menos tiempo, menos intentos y códigos más largos.",
  },
];
export interface Mission {
  id: number;
  name: string;
  corp: string;
  objective: string;
  codeLength: number;
  maxAttempts: number;
  timeLimit: number; // seconds
  maxHints: number;
}

export const MISSIONS: Mission[] = [
  {
    id: 1,
    name: "Archivo Fantasma",
    corp: "Kurogane Logística",
    objective: "Extrae el registro de envíos borrado del servidor de archivo.",
    codeLength: 4,
    maxAttempts: 10,
    timeLimit: 180,
    maxHints: 3,
  },
  {
    id: 2,
    name: "Núcleo Helix",
    corp: "Helix Biogenética",
    objective: "Desactiva el cortafuegos del núcleo de investigación genética.",
    codeLength: 4,
    maxAttempts: 8,
    timeLimit: 150,
    maxHints: 2,
  },
  {
    id: 3,
    name: "Protocolo Ónix",
    corp: "Ónix Seguridad Privada",
    objective: "Anula el protocolo de vigilancia sobre el distrito 9.",
    codeLength: 4,
    maxAttempts: 7,
    timeLimit: 120,
    maxHints: 2,
  },
  {
    id: 4,
    name: "Bóveda Prisma",
    corp: "Banco Prisma",
    objective: "Abre la bóveda de datos cifrados con una llave de 5 dígitos.",
    codeLength: 5,
    maxAttempts: 9,
    timeLimit: 150,
    maxHints: 2,
  },
  {
    id: 5,
    name: "Proyecto Eclipse",
    corp: "Consorcio Eclipse",
    objective: "Expón el proyecto secreto antes de que se active el apagón.",
    codeLength: 5,
    maxAttempts: 8,
    timeLimit: 120,
    maxHints: 1,
  },
];
export function getMissionsForDifficulty(difficulty: Difficulty): Mission[] {
  return MISSIONS.map((mission, index) => {
    if (difficulty === "medio") return { ...mission };
    if (difficulty === "facil")
      return {
        ...mission,
        codeLength: index < 3 ? 3 : 4,
        maxAttempts: mission.maxAttempts + 3,
        timeLimit: Math.round(mission.timeLimit * 1.5),
        maxHints: Math.min(4, mission.maxHints + 1),
      };
    return {
      ...mission,
      codeLength: index < 3 ? 5 : 6,
      maxAttempts: Math.max(4, mission.maxAttempts - 2),
      timeLimit: Math.round(mission.timeLimit * 0.7),
      maxHints: Math.max(1, mission.maxHints - 1),
    };
  });
}
/** Secret with unique digits 0-9 (Fisher–Yates over the digit pool). */
export function generateSecret(length: number, rng: Rng): number[] {
  if (length < 1 || length > 10) throw new Error("Longitud inválida");
  const pool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.slice(0, length);
}

export interface Feedback {
  exact: number; // right digit, right place
  misplaced: number; // right digit, wrong place
}

/** Mastermind scoring; counts multiplicity correctly even if a guess repeats digits. */
export function scoreGuess(secret: number[], guess: number[]): Feedback {
  if (secret.length !== guess.length) throw new Error("Longitud distinta");
  let exact = 0;
  const sCount = new Array(10).fill(0);
  const gCount = new Array(10).fill(0);
  for (let i = 0; i < secret.length; i++) {
    if (secret[i] === guess[i]) exact++;
    else {
      sCount[secret[i]!]++;
      gCount[guess[i]!]++;
    }
  }
  let misplaced = 0;
  for (let d = 0; d < 10; d++) misplaced += Math.min(sCount[d], gCount[d]);
  return { exact, misplaced };
}

export function hasUniqueDigits(guess: number[]): boolean {
  return new Set(guess).size === guess.length;
}

export type Hint =
  { kind: "position"; index: number; digit: number } | { kind: "absent"; digit: number };

/** Next hint: alternates "digit absent" and "digit at position", never repeating. */
export function nextHint(secret: number[], given: Hint[], rng: Rng): Hint | null {
  const wantAbsent = given.length % 2 === 0;
  const knownPos = new Set(
    given.filter((h) => h.kind === "position").map((h) => (h as { index: number }).index),
  );
  const knownAbsent = new Set(given.filter((h) => h.kind === "absent").map((h) => h.digit));
  const absentPool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(
    (d) => !secret.includes(d) && !knownAbsent.has(d),
  );
  const posPool = secret.map((_, i) => i).filter((i) => !knownPos.has(i));
  const pick = <T>(arr: T[]) => arr[Math.floor(rng() * arr.length)]!;
  if (wantAbsent && absentPool.length) return { kind: "absent", digit: pick(absentPool) };
  if (posPool.length) {
    const index = pick(posPool);
    return { kind: "position", index, digit: secret[index]! };
  }
  if (absentPool.length) return { kind: "absent", digit: pick(absentPool) };
  return null;
}

export const HINT_PENALTY = 150;

export interface ScoreInput {
  mission: Mission;
  attemptsUsed: number;
  timeLeft: number;
  hintsUsed: number;
  streak: number; // consecutive missions won before this one (in this run)
}

export interface ScoreBreakdown {
  base: number;
  timeBonus: number;
  attemptBonus: number;
  hintPenalty: number;
  streakBonus: number;
  total: number;
}

export function computeScore({
  mission,
  attemptsUsed,
  timeLeft,
  hintsUsed,
  streak,
}: ScoreInput): ScoreBreakdown {
  const base = 500 * mission.id;
  const timeBonus = timeLeft * 5;
  const attemptBonus = Math.max(0, mission.maxAttempts - attemptsUsed) * 100;
  const hintPenalty = hintsUsed * HINT_PENALTY;
  const streakBonus = streak * 250;
  const total = Math.max(0, base + timeBonus + attemptBonus + streakBonus - hintPenalty);
  return { base, timeBonus, attemptBonus, hintPenalty, streakBonus, total };
}
