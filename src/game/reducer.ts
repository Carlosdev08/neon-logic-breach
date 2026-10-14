import {
  getMissionsForDifficulty,
  type Difficulty,
  createRng,
  generateSecret,
  scoreGuess,
  nextHint,
  computeScore,
  hasUniqueDigits,
  type Feedback,
  type Hint,
  type ScoreBreakdown,
} from "./logic";

export type Phase = "title" | "playing" | "paused" | "won" | "lost" | "victory";

export interface Attempt {
  guess: number[];
  feedback: Feedback;
}
export interface LogLine {
  id: number;
  text: string;
  tone: "info" | "ok" | "warn" | "err";
}

export interface GameState {
  phase: Phase;
  missionIndex: number;
  difficulty: Difficulty;
  secret: number[];
  input: number[];
  attempts: Attempt[];
  hints: Hint[];
  timeLeft: number;
  runScore: number;
  streak: number;
  lastScore: ScoreBreakdown | null;
  lostReason: "attempts" | "time" | null;
  log: LogLine[];
  seed: number;
  logId: number;
}

export type Action =
  | {
      type: "START";
      missionIndex: number;
      seed: number;
      keepRun?: boolean;
      difficulty?: Difficulty;
    }
  | { type: "DIGIT"; digit: number }
  | { type: "BACKSPACE" }
  | { type: "CLEAR" }
  | { type: "SUBMIT" }
  | { type: "HINT" }
  | { type: "TICK" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "CONTINUE"; seed: number }
  | { type: "QUIT" };

export const initialState: GameState = {
  phase: "title",
  missionIndex: 0,
  difficulty: "medio",
  secret: [],
  input: [],
  attempts: [],
  hints: [],
  timeLeft: 0,
  runScore: 0,
  streak: 0,
  lastScore: null,
  lostReason: null,
  log: [],
  seed: 1,
  logId: 0,
};

function log(s: GameState, text: string, tone: LogLine["tone"] = "info"): GameState {
  const line = { id: s.logId + 1, text, tone };
  return { ...s, logId: s.logId + 1, log: [...s.log, line].slice(-40) };
}

function startMission(
  s: GameState,
  missionIndex: number,
  seed: number,
  keepRun: boolean,
  difficulty: Difficulty = s.difficulty,
): GameState {
  const m = getMissionsForDifficulty(difficulty)[missionIndex]!;
  const rng = createRng(seed);
  let next: GameState = {
    ...s,
    phase: "playing",
    missionIndex,
    difficulty,
    seed,
    secret: generateSecret(m.codeLength, rng),
    input: [],
    attempts: [],
    hints: [],
    timeLeft: m.timeLimit,
    lastScore: null,
    lostReason: null,
    runScore: keepRun ? s.runScore : 0,
    streak: keepRun ? s.streak : 0,
    log: [],
  };
  next = log(next, `> Conectando al nodo de ${m.corp}...`);
  next = log(
    next,
    `> Misión ${m.id}: ${m.name}. Cerradura de ${m.codeLength} dígitos únicos detectada.`,
  );
  next = log(next, `> Tienes ${m.maxAttempts} intentos antes de que salte la alarma.`, "warn");
  return next;
}

export function reducer(s: GameState, a: Action): GameState {
  const m = getMissionsForDifficulty(s.difficulty)[s.missionIndex]!;
  switch (a.type) {
    case "START":
      return startMission(s, a.missionIndex, a.seed, !!a.keepRun, a.difficulty ?? s.difficulty);
    case "CONTINUE":
      if (s.phase !== "won") return s;
      if (s.missionIndex >= getMissionsForDifficulty(s.difficulty).length - 1)
        return { ...s, phase: "victory" };
      return startMission(s, s.missionIndex + 1, a.seed, true);
    case "QUIT":
      return { ...initialState, logId: s.logId };
    case "PAUSE":
      return s.phase === "playing" ? log({ ...s, phase: "paused" }, "> Conexión en espera.") : s;
    case "RESUME":
      return s.phase === "paused" ? log({ ...s, phase: "playing" }, "> Conexión restablecida.") : s;
  }
  if (s.phase !== "playing") return s;
  switch (a.type) {
    case "DIGIT":
      if (s.input.length >= m.codeLength || s.input.includes(a.digit)) return s;
      return { ...s, input: [...s.input, a.digit] };
    case "BACKSPACE":
      return { ...s, input: s.input.slice(0, -1) };
    case "CLEAR":
      return { ...s, input: [] };
    case "TICK": {
      const t = s.timeLeft - 1;
      if (t <= 0)
        return log(
          { ...s, timeLeft: 0, phase: "lost", lostReason: "time", streak: 0 },
          "> TIEMPO AGOTADO. El sistema te ha expulsado.",
          "err",
        );
      const next = { ...s, timeLeft: t };
      return t === 30 ? log(next, "> Aviso: rastreo inverso al 80%. Quedan 30 s.", "warn") : next;
    }
    case "HINT": {
      if (s.hints.length >= m.maxHints) return s;
      const h = nextHint(s.secret, s.hints, createRng(s.seed + 97 * (s.hints.length + 1)));
      if (!h) return s;
      const text =
        h.kind === "absent"
          ? `> Pista: el dígito ${h.digit} NO forma parte del código.`
          : `> Pista: la posición ${h.index + 1} contiene el ${h.digit}.`;
      return log({ ...s, hints: [...s.hints, h] }, `${text} (−150 pts)`, "warn");
    }
    case "SUBMIT": {
      if (s.input.length !== m.codeLength || !hasUniqueDigits(s.input)) return s;
      const feedback = scoreGuess(s.secret, s.input);
      const attempts = [...s.attempts, { guess: s.input, feedback }];
      let next: GameState = { ...s, attempts, input: [] };
      next = log(
        next,
        `> Inyectando ${s.input.join("")} → ${feedback.exact} exactos, ${feedback.misplaced} desplazados.`,
        feedback.exact > 0 ? "ok" : "info",
      );
      if (feedback.exact === m.codeLength) {
        const score = computeScore({
          mission: m,
          attemptsUsed: attempts.length,
          timeLeft: s.timeLeft,
          hintsUsed: s.hints.length,
          streak: s.streak,
        });
        return log(
          {
            ...next,
            phase: "won",
            lastScore: score,
            runScore: s.runScore + score.total,
            streak: s.streak + 1,
          },
          "> ACCESO CONCEDIDO. Datos extraídos.",
          "ok",
        );
      }
      if (attempts.length >= m.maxAttempts) {
        return log(
          { ...next, phase: "lost", lostReason: "attempts", streak: 0 },
          "> ALARMA ACTIVADA. Intentos agotados.",
          "err",
        );
      }
      return next;
    }
  }
  return s;
}
