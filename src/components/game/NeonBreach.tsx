import { useReducer, useRef, useState } from "react";
import { type Difficulty } from "@/game/logic";
import { reducer, initialState, type GameState } from "@/game/reducer";
import { DEFAULT_SAVE, type SaveData } from "@/game/storage";
import { TitleScreen, GameScreen, Modal } from "@/components/game/components";
import { useGameKeyboard, useGameTimer } from "@/components/game/useGameControls";
import { useGamePersistence } from "@/components/game/useGamePersistence";
import { useSubmitMissionScore } from "@/components/game/useSubmitMissionScore";
import { useGameTransitionEffects } from "@/components/game/useGameTransitionEffects";
import { OnlineHub } from "@/components/game/OnlineHub";

const newSeed = () => (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;

const btn =
  "font-mono uppercase tracking-wider text-sm px-4 py-2 border transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
const btnPrimary = `${btn} border-primary text-primary hover:bg-primary hover:text-primary-foreground`;
const btnAccent = `${btn} border-accent bg-accent text-accent-foreground hover:bg-accent/80 font-semibold`;
const btnGhost = `${btn} border-border text-muted-foreground hover:text-foreground hover:border-primary`;
const btnDanger = `${btn} border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground`;

export function NeonBreach() {
  const [s, dispatch] = useReducer(reducer, initialState);
  const [save, setSave] = useState<SaveData>(DEFAULT_SAVE);
  const prev = useRef<GameState>(s);
  const { loaded } = useGamePersistence(s, dispatch, save, setSave, prev);
  const [help, setHelp] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useGameTransitionEffects(s, prev, save.sound, loaded, setSave);

  useSubmitMissionScore(s);
  useGameTimer(s.phase, dispatch);
  useGameKeyboard({
    phase: s.phase,
    dispatch,
    helpOpen: help,
    resetConfirmationOpen: confirmReset,
    soundEnabled: save.sound,
  });

  const toggleSound = () => setSave((v) => ({ ...v, sound: !v.sound }));

  const header = (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
      <button
        onClick={() => dispatch({ type: "QUIT" })}
        className="font-display text-xl font-bold tracking-[0.25em] text-primary glow-primary animate-flicker"
        aria-label="Volver al inicio"
      >
        NEON<span className="text-destructive glow-danger">//</span>BREACH
      </button>
      <div className="flex items-center gap-2">
        <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
          RÉCORD {save.bestScore.toLocaleString("es")}
        </span>
        <button onClick={toggleSound} className={btnGhost} aria-pressed={save.sound}>
          Sonido: {save.sound ? "Sí" : "No"}
        </button>
        <button
          onClick={() => {
            if (s.phase === "playing") dispatch({ type: "PAUSE" });
            setHelp(true);
          }}
          className={btnGhost}
        >
          Cómo jugar
        </button>
      </div>
    </header>
  );

  return (
    <div className="scanlines neon-bg min-h-screen text-foreground">
      {header}
      {s.phase === "title" ? (
        <>
          <div className="mx-auto w-full max-w-6xl px-4 pt-5 sm:pt-8">
            <OnlineHub />
          </div>
          <TitleScreen
            save={save}
            loaded={loaded}
            onStart={(i) =>
              dispatch({
                type: "START",
                missionIndex: i,
                seed: newSeed(),
                difficulty: save.difficulty,
              })
            }
            onDifficultyChange={(difficulty: Difficulty) =>
              setSave((v) => ({
                ...v,
                difficulty,
                bestScore: v.progress[difficulty].bestScore,
                unlocked: v.progress[difficulty].unlocked,
              }))
            }
            onReset={() => setConfirmReset(true)}
            onHelp={() => setHelp(true)}
          />
        </>
      ) : (
        <GameScreen s={s} dispatch={dispatch} sound={save.sound} />
      )}

      {help && (
        <Modal title="Cómo jugar" onClose={() => setHelp(false)}>
          <ul className="space-y-2 text-sm leading-relaxed">
            <li>
              Cada cerradura usa un código de <b>dígitos únicos</b> (4 dígitos al principio, 5 en
              las últimas misiones).
            </li>
            <li>
              Introduce un código con el teclado en pantalla o el de tu dispositivo y pulsa{" "}
              <b>ENVIAR</b> (o Enter).
            </li>
            <li>
              Tras cada intento verás: <span className="text-accent">● exactos</span> (dígito
              correcto en su posición) y <span className="text-warning">◐ desplazados</span> (dígito
              correcto en otra posición). No se te dice cuáles.
            </li>
            <li>
              Tienes intentos y tiempo limitados. Si se agotan, salta la alarma y puedes reintentar.
            </li>
            <li>
              Las pistas son progresivas: primero descartan un dígito, después confirman uno y, por
              último, revelan una posición. El coste aumenta y depende de la dificultad.
            </li>
            <li>
              Puntuación: base de misión + tiempo restante + intentos sobrantes + bonus por racha −
              pistas.
            </li>
            <li>Atajos: Retroceso borra, Supr limpia, Esc o P pausa.</li>
          </ul>
          <p className="mt-4 font-mono text-xs text-muted-foreground">
            Todo es ficción: ningún sistema real es accedido.
          </p>
        </Modal>
      )}
      {confirmReset && (
        <Modal title="¿Reiniciar progreso?" onClose={() => setConfirmReset(false)}>
          <p className="text-sm">Se borrarán tu récord y las misiones desbloqueadas.</p>
          <div className="mt-5 flex justify-end gap-2">
            <button className={btnGhost} onClick={() => setConfirmReset(false)}>
              Cancelar
            </button>
            <button
              className={btnDanger}
              onClick={() => {
                setSave((v) => ({ ...DEFAULT_SAVE, sound: v.sound }));
                setConfirmReset(false);
              }}
            >
              Borrar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
