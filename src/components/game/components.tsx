import { useEffect, useRef, useState, type ReactNode, type Dispatch } from "react";
import {
  HINT_PENALTIES,
  DIFFICULTIES,
  getMissionsForDifficulty,
  type Difficulty,
} from "@/game/logic";
import { type GameState, type Action } from "@/game/reducer";
import { play } from "@/game/sound";
import { type SaveData } from "@/game/storage";

const newSeed = () => (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
const fmt = (t: number) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;

const btn =
  "font-mono uppercase tracking-wider text-sm px-4 py-2 border transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
const btnPrimary = `${btn} border-primary text-primary hover:bg-primary hover:text-primary-foreground`;
const btnAccent = `${btn} border-accent bg-accent text-accent-foreground hover:bg-accent/80 font-semibold`;
const btnGhost = `${btn} border-border text-muted-foreground hover:text-foreground hover:border-primary`;

export function TitleScreen({
  save,
  loaded,
  onStart,
  onDifficultyChange,
  onReset,
  onHelp,
}: {
  save: SaveData;
  loaded: boolean;
  onStart: (i: number) => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onReset: () => void;
  onHelp: () => void;
}) {
  const difficulty = save.difficulty;
  const missions = getMissionsForDifficulty(difficulty);
  const progress = save.progress[difficulty];
  const [showMissions, setShowMissions] = useState(false);
  return (
    <main className="mx-auto flex max-w-4xl flex-col items-center px-4 py-12 text-center sm:py-20">
      <p className="font-mono text-xs uppercase tracking-[0.4em] text-accent glow-accent">
        Distrito Neón · 2087
      </p>
      <h1 className="mt-4 font-display text-5xl font-bold tracking-[0.15em] text-primary glow-primary sm:text-7xl">
        NEON BREACH
      </h1>
      <p className="mt-6 max-w-xl text-muted-foreground">
        Eres una operadora freelance. Cinco corporaciones esconden sus secretos tras cerraduras
        cifradas. Elige tu dificultad y deduce cada código antes de que el rastreo te alcance.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button className={btnPrimary} onClick={onHelp}>
          Cómo jugar
        </button>
      </div>
      {!showMissions ? (
        <section className="panel mt-8 w-full p-5 text-left sm:p-6" aria-labelledby="dificultades">
          <div className="flex items-center justify-between gap-3">
            <h2
              id="dificultades"
              className="font-mono text-xs uppercase tracking-widest text-primary"
            >
              Elige tu nivel
            </h2>
            <span className="font-mono text-xs text-muted-foreground">3 niveles</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Selecciona una dificultad para consultar sus contratos y empezar a jugar.
          </p>
          <div
            className="mt-5 grid gap-3 sm:grid-cols-3"
            role="group"
            aria-label="Seleccionar dificultad"
          >
            {DIFFICULTIES.map((level) => (
              <button
                key={level.id}
                type="button"
                aria-label={"Elegir dificultad " + level.label}
                onClick={() => {
                  onDifficultyChange(level.id);
                  setShowMissions(true);
                }}
                className={
                  "group min-h-36 border p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary " +
                  (difficulty === level.id ? "border-primary/60" : "border-border")
                }
              >
                <span className="block font-display text-xl font-bold text-primary">
                  {level.label}
                </span>
                <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">
                  {level.description}
                </span>
                <span className="mt-5 block font-mono text-xs uppercase tracking-widest text-accent">
                  Ver misiones ↗
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="panel mt-8 w-full p-4 text-left sm:p-6" aria-labelledby="misiones">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Dificultad seleccionada
              </p>
              <h2 id="misiones" className="mt-1 font-display text-2xl font-bold text-primary">
                {DIFFICULTIES.find((d) => d.id === difficulty)?.label} · Misiones
              </h2>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              Récord: {loaded ? progress.bestScore.toLocaleString("es") : "…"}
            </span>
          </div>
          <button className={btnGhost + " mt-4"} onClick={() => setShowMissions(false)}>
            ← Volver a dificultades
          </button>
          <p className="mt-4 font-mono text-xs uppercase tracking-widest text-accent">
            {missions.length} misiones · Completa una para desbloquear la siguiente
          </p>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {missions.map((m, i) => {
              const locked = m.id > progress.unlocked;
              return (
                <li key={m.id}>
                  <button
                    disabled={locked || !loaded}
                    onClick={() => onStart(i)}
                    className="h-full w-full border border-border p-3 text-left transition-colors hover:border-accent disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={
                      locked ? `Misión ${m.id} bloqueada` : `Jugar misión ${m.id}: ${m.name}`
                    }
                  >
                    <span className="font-mono text-xs text-muted-foreground">
                      0{m.id} {locked ? "· BLOQUEADA" : ""}
                    </span>
                    <span className="mt-1 block font-semibold text-foreground">{m.name}</span>
                    <span className="block font-mono text-xs text-muted-foreground">
                      {m.codeLength} díg · {m.maxAttempts} int · {Math.floor(m.timeLimit / 60)} min
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <button
            onClick={onReset}
            className="mt-4 font-mono text-xs text-muted-foreground underline-offset-4 hover:text-destructive hover:underline"
          >
            Reiniciar progreso
          </button>
        </section>
      )}
    </main>
  );
}

export function GameScreen({
  s,
  dispatch,
  sound,
}: {
  s: GameState;
  dispatch: Dispatch<Action>;
  sound: boolean;
}) {
  const missions = getMissionsForDifficulty(s.difficulty);
  const m = missions[s.missionIndex]!;
  const attemptsLeft = m.maxAttempts - s.attempts.length;
  const lowTime = s.timeLeft <= 30;
  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const logElement = logRef.current;
    if (typeof logElement?.scrollTo === "function") {
      logElement.scrollTo({ top: logElement.scrollHeight });
    }
  }, [s.log.length]);
  const playing = s.phase === "playing";

  return (
    <main className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[240px_1fr_300px]">
      {/* Left rail: mission + status */}
      <aside className="panel space-y-4 p-4" aria-label="Estado de la misión">
        <div>
          <p className="font-mono text-xs text-muted-foreground">MISIÓN 0{m.id}/05</p>
          <h2 className="font-display text-xl font-bold text-primary">{m.name}</h2>
          <p className="font-mono text-xs text-muted-foreground">{m.corp}</p>
        </div>
        <ol className="flex gap-1" aria-label="Progreso">
          {missions.map((x, i) => (
            <li
              key={x.id}
              className={`h-1.5 flex-1 ${i < s.missionIndex ? "bg-accent" : i === s.missionIndex ? "bg-primary" : "bg-muted"}`}
              aria-label={`${x.name}${i < s.missionIndex ? " completada" : ""}`}
            />
          ))}
        </ol>
        <dl className="grid grid-cols-2 gap-3 font-mono lg:grid-cols-1">
          <Stat label="Tiempo" value={fmt(s.timeLeft)} tone={lowTime ? "danger" : "primary"} />
          <Stat
            label="Intentos"
            value={`${attemptsLeft}/${m.maxAttempts}`}
            tone={attemptsLeft <= 2 ? "danger" : "primary"}
          />
          <Stat label="Puntuación" value={s.runScore.toLocaleString("es")} tone="accent" />
          <Stat label="Racha" value={`×${s.streak}`} tone="accent" />
        </dl>
        <div className="flex flex-wrap gap-2">
          {s.phase === "paused" ? (
            <button className={btnPrimary} onClick={() => dispatch({ type: "RESUME" })}>
              Reanudar
            </button>
          ) : (
            <button
              className={btnPrimary}
              disabled={!playing}
              onClick={() => dispatch({ type: "PAUSE" })}
            >
              Pausa
            </button>
          )}
          <button
            className={btnGhost}
            onClick={() =>
              dispatch({
                type: "START",
                missionIndex: s.missionIndex,
                seed: newSeed(),
                keepRun: true,
              })
            }
          >
            Reiniciar
          </button>
          <button className={btnGhost} onClick={() => dispatch({ type: "QUIT" })}>
            Salir
          </button>
        </div>
      </aside>

      {/* Center: lock */}
      <section
        className="panel relative flex flex-col items-center p-4 sm:p-6"
        aria-label="Cerradura"
      >
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Introduce {m.codeLength} dígitos únicos
        </p>
        <div
          className="mt-4 flex gap-2"
          aria-live="polite"
          aria-label={`Código actual: ${s.input.join(" ") || "vacío"}`}
        >
          {Array.from({ length: m.codeLength }, (_, i) => (
            <div
              key={i}
              className={`flex h-16 w-12 items-center justify-center border font-mono text-3xl sm:h-20 sm:w-16 ${s.input[i] !== undefined ? "border-primary text-primary glow-primary" : i === s.input.length && playing ? "border-accent" : "border-border text-muted-foreground"}`}
            >
              {s.input[i] ?? "_"}
            </div>
          ))}
        </div>

        <div className="mt-6 grid w-full max-w-xs grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <Key key={d} d={d} s={s} dispatch={dispatch} sound={sound} />
          ))}
          <button
            className={`${btnGhost} h-14`}
            disabled={!playing || !s.input.length}
            onClick={() => dispatch({ type: "CLEAR" })}
          >
            Limpiar
          </button>
          <Key d={0} s={s} dispatch={dispatch} sound={sound} />
          <button
            className={`${btnGhost} h-14`}
            disabled={!playing || !s.input.length}
            onClick={() => dispatch({ type: "BACKSPACE" })}
            aria-label="Borrar último dígito"
          >
            ⌫
          </button>
        </div>
        <button
          className={`${btnAccent} mt-3 w-full max-w-xs py-3`}
          disabled={!playing || s.input.length !== m.codeLength}
          onClick={() => {
            dispatch({ type: "SUBMIT" });
            play("ok", sound);
          }}
        >
          ENVIAR
        </button>

        <div className="mt-6 w-full max-w-md">
          <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Registro de intentos
          </h3>
          {s.attempts.length === 0 ? (
            <p className="mt-2 border border-dashed border-border p-3 text-center font-mono text-xs text-muted-foreground">
              Sin intentos todavía. Prueba un primer código.
            </p>
          ) : (
            <ol className="mt-2 space-y-1">
              {[...s.attempts].reverse().map((a, i) => (
                <li
                  key={s.attempts.length - i}
                  className="flex items-center justify-between border-b border-border py-1 font-mono text-sm animate-rise"
                >
                  <span className="text-muted-foreground">#{s.attempts.length - i}</span>
                  <span className="tracking-[0.4em] text-foreground">{a.guess.join("")}</span>
                  <span>
                    <span className="text-accent">● {a.feedback.exact}</span>{" "}
                    <span className="ml-2 text-warning">◐ {a.feedback.misplaced}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {s.phase !== "playing" && <Overlay s={s} dispatch={dispatch} />}
      </section>

      {/* Right: intel */}
      <aside className="panel flex flex-col gap-4 p-4" aria-label="Inteligencia">
        <div>
          <h3 className="font-mono text-xs uppercase tracking-widest text-primary">Objetivo</h3>
          <p className="mt-1 text-sm">{m.objective}</p>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-xs uppercase tracking-widest text-primary">
              Pistas {s.hints.length}/{m.maxHints}
            </h3>
            <button
              className={btnPrimary}
              disabled={!playing || s.hints.length >= m.maxHints}
              onClick={() => dispatch({ type: "HINT" })}
            >
              Pista −{HINT_PENALTIES[s.difficulty][s.hints.length] ?? HINT_PENALTIES[s.difficulty][HINT_PENALTIES[s.difficulty].length - 1]}
            </button>
          </div>
          {s.hints.length === 0 ? (
            <p className="mt-2 font-mono text-xs text-muted-foreground">Ninguna pista usada.</p>
          ) : (
            <ul className="mt-2 space-y-1 font-mono text-xs text-warning">
              {s.hints.map((h, i) => (
                <li key={i}>
                  {h.kind === "absent"
                    ? `El ${h.digit} no está en el código`
                    : h.kind === "present" ? `El ${h.digit} está en el código, pero no sabemos dónde` : `Posición ${h.index + 1} = ${h.digit}`}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <h3 className="font-mono text-xs uppercase tracking-widest text-primary">Terminal</h3>
          <div
            ref={logRef}
            className="mt-2 h-56 overflow-y-auto border border-border bg-background/60 p-2 font-mono text-xs leading-relaxed lg:h-auto lg:flex-1 lg:max-h-[420px]"
            aria-live="polite"
          >
            {s.log.map((l) => (
              <p
                key={l.id}
                className={
                  l.tone === "ok"
                    ? "text-accent"
                    : l.tone === "warn"
                      ? "text-warning"
                      : l.tone === "err"
                        ? "text-destructive"
                        : "text-muted-foreground"
                }
              >
                {l.text}
              </p>
            ))}
          </div>
        </div>
      </aside>
    </main>
  );
}

export function Key({
  d,
  s,
  dispatch,
  sound,
}: {
  d: number;
  s: GameState;
  dispatch: Dispatch<Action>;
  sound: boolean;
}) {
  const used = s.input.includes(d);
  const full = s.input.length >= getMissionsForDifficulty(s.difficulty)[s.missionIndex]!.codeLength;
  return (
    <button
      className="h-14 border border-border font-mono text-xl text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-30"
      disabled={s.phase !== "playing" || used || full}
      onClick={() => {
        dispatch({ type: "DIGIT", digit: d });
        play("key", sound);
      }}
    >
      {d}
    </button>
  );
}

export function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "primary" | "accent" | "danger";
}) {
  const c =
    tone === "danger"
      ? "text-destructive glow-danger"
      : tone === "accent"
        ? "text-accent"
        : "text-primary";
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className={`text-xl ${c}`}>{value}</dd>
    </div>
  );
}

export function Overlay({ s, dispatch }: { s: GameState; dispatch: Dispatch<Action> }) {
  const m = getMissionsForDifficulty(s.difficulty)[s.missionIndex]!;
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, [s.phase]);
  const retry = () =>
    dispatch({ type: "START", missionIndex: s.missionIndex, seed: newSeed(), keepRun: true });
  let body: ReactNode = null;
  if (s.phase === "paused")
    body = (
      <>
        <h2 className="font-display text-3xl font-bold text-primary glow-primary">EN PAUSA</h2>
        <p className="mt-2 text-sm text-muted-foreground">El temporizador está detenido.</p>
        <button
          ref={ref}
          className={`${btnAccent} mt-6`}
          onClick={() => dispatch({ type: "RESUME" })}
        >
          Reanudar
        </button>
      </>
    );
  if (s.phase === "won" && s.lastScore) {
    const b = s.lastScore;
    const last = s.missionIndex === getMissionsForDifficulty(s.difficulty).length - 1;
    body = (
      <>
        <h2 className="font-display text-3xl font-bold text-accent glow-accent">
          ACCESO CONCEDIDO
        </h2>
        <p className="mt-1 font-mono text-sm text-muted-foreground">Código: {s.secret.join("")}</p>
        <dl aria-label="Desglose de puntuación" className="mx-auto mt-4 grid w-full max-w-sm grid-cols-[1fr_auto] gap-x-6 gap-y-2 text-left font-mono text-sm tabular-nums">
          <dt>Base</dt>
          <dd className="text-right">+{b.base}</dd>
          <dt>Tiempo</dt>
          <dd className="text-right">+{b.timeBonus}</dd>
          <dt>Intentos</dt>
          <dd className="text-right">+{b.attemptBonus}</dd>
          <dt>Racha</dt>
          <dd className="text-right">+{b.streakBonus}</dd>
          <dt>Pistas</dt>
          <dd className="text-right text-destructive">−{b.hintPenalty}</dd>
          <dt className="text-accent">Total</dt>
          <dd className="text-right text-accent">{b.total}</dd>
        </dl>
        <button
          ref={ref}
          className={`${btnAccent} mt-6`}
          onClick={() => dispatch({ type: "CONTINUE", seed: newSeed() })}
        >
          {last ? "Ver resultado final" : "Continuar"}
        </button>
      </>
    );
  }
  if (s.phase === "lost")
    body = (
      <>
        <h2 className="font-display text-3xl font-bold text-destructive glow-danger">
          CONEXIÓN PERDIDA
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {s.lostReason === "time"
            ? "Se agotó el tiempo y el rastreo te encontró."
            : "Agotaste los intentos y saltó la alarma."}
        </p>
        <p className="mt-1 font-mono text-sm">
          El código era <span className="text-primary">{s.secret.join("")}</span>
        </p>
        <div className="mt-6 flex gap-2">
          <button ref={ref} className={btnAccent} onClick={retry}>
            Reintentar
          </button>
          <button className={btnGhost} onClick={() => dispatch({ type: "QUIT" })}>
            Salir
          </button>
        </div>
      </>
    );
  if (s.phase === "victory")
    body = (
      <>
        <h2 className="font-display text-4xl font-bold text-accent glow-accent">
          OPERACIÓN COMPLETA
        </h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Las cinco corporaciones han caído. El Distrito Neón conoce la verdad.
        </p>
        <p className="mt-4 font-mono text-3xl text-primary glow-primary">
          {s.runScore.toLocaleString("es")} pts
        </p>
        <div className="mt-6 flex gap-2">
          <button
            ref={ref}
            className={btnAccent}
            onClick={() => dispatch({ type: "START", missionIndex: 0, seed: newSeed() })}
          >
            Jugar de nuevo
          </button>
          <button className={btnGhost} onClick={() => dispatch({ type: "QUIT" })}>
            Inicio
          </button>
        </div>
      </>
    );
  void m;
  return (
    <div
      className="absolute inset-0 z-10 flex max-h-full flex-col items-center justify-center overflow-y-auto bg-background p-4 text-center sm:p-6 animate-rise"
      role="dialog"
      aria-modal="true"
    >
      {body}
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="panel w-full max-w-lg bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="modal-title" className="font-display text-2xl font-bold text-primary">
            {title}
          </h2>
          <button ref={ref} onClick={onClose} className={btnGhost} aria-label="Cerrar">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
