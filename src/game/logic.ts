// NEON BREACH â pure, deterministic game logic (no React, no browser APIs).

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
  { id: "facil", label: "FÃ¡cil", description: "MÃ¡s tiempo, mÃ¡s intentos y mÃ¡s pistas." },
  { id: "medio", label: "Medio", description: "Un reto equilibrado para afinar tu lÃ³gica." },
  {
    id: "avanzado",
    label: "Avanzado",
    description: "Menos tiempo, menos intentos y cÃ³digos mÃ¡s largos.",
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
    corp: "Kurogane LogÃ­stica",
    objective: "Extrae el registro de envÃ­os borrado del servidor de archivo.",
    codeLength: 4,
    maxAttempts: 10,
    timeLimit: 180,
    maxHints: 3,
  },
  {
    id: 2,
    name: "NÃºcleo Helix",
    corp: "Helix BiogenÃ©tica",
    objective: "Desactiv¶»§q«^