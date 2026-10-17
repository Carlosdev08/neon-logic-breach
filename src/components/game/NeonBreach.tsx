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
import { GameHeader } from "@/components/game/GameHeader";
import { useGameNavigation } from "@/components/game/useGameNavigation";

const newSeed = () => (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;

const btn =
  "font-mono uppercase tracking-wider text-sm px-4 py-2 border transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
const btnGhost = `${btn} border-border text-muted-foreground hover:text-foreground hover:border-primary`;
const btnDanger = `${btn} border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground`;

export function NeonBreach() {
  const [s, dispatch] = useReducer(reducer, initialState);
  const [save, setSave] = useState<SaveData>(DEFAULT_SAVE);
  const prev = useRef<GameState>(s);
  const { loaded } = useGamePersistence(s, dispatch, save, setSave, prev);
  const [help, setHelp] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const { activeView, navigateView } = useGameNavigation();

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

  return (
    <div className="scanlines neon-bg min-h-screen text-foreground">
      <GameHeader
        phase={s.phase}
        bestScore={save.bestScore}
        soundEnabled={save.sound}
        activeView={activeView}
        onQuit={() => dispatch({ type: "QUIT" })}
        onToggleSound={() => setSave((value) => ({ ...value, sound: !value.sound }))}
        onNavigate={navigateView}
        onHelp={() => {
          if (s.phase === "playing") dispatch({ type: "PAUSE" });
          setHelp(true);
        }}
      />
      {s.phase === "title" ? (
        activeView === "online" ? (
          <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-10">
            <div className="mb-4 flex justify-end">
              <button className={btnGhost} onClick={() => navigateView("home")}>
                ← Volver al juego
              </button>
            </div>
            <OnlineHub />
          </main>
        ) : (
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
        )
      ) : (
        <GameScreen s={s} dispatch={dispatch} sound={save.sound} />
      )}

      {help && (
        <Modal title="Cómo jugar" onClose={() => setHelp(false)}>
          <div className="max-h-[70dvh] space-y-4 overflow-y-auto pr-1 text-sm leading-relaxed">
            <section className="border border-primary/30 bg-background/50 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">
                01 / Objetivo
              </p>
              <p className="mt-2">
                Descifra el código secreto antes de que se agoten el tiempo y los intentos. Los
                dígitos no se repiten: las primeras misiones usan 4 y las últimas, 5.
              </p>
            </section>

            <section className="border border-border p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">
                02 / Interpreta las señales
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="border border-accent/30 p-3">
                  <p className="font-display font-bold text-accent">● Exactos</p>
                  <p className="mt-1 text-muted-foreground">
                    El dígito es correcto y está en su posición.
                  </p>
                </div>
                <div className="border border-warning/30 p-3">
                  <p className="font-display font-bold text-warning">◐ Desplazados</p>
                  <p className="mt-1 text-muted-foreground">
                    El dígito está en el código, pero en otra posición.
                  </p>
                </div>
              </div>
              <p className="mt-3 text-muted-foreground">
                La señal indica cuántos coinciden, no cuáles. Usa cada intento para descartar
                combinaciones.
              </p>
            </section>

            <section className="border border-border p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">
                03 / Herramientas
              </p>
              <ul className="mt-2 space-y-2">
                <li>
                  <b>Enviar:</b> prueba la combinación escrita en pantalla o con tu teclado.
                </li>
                <li>
                  <b>Pistas:</b> descartan un dígito, confirman uno o revelan una posición.
                </li>
                <li>
                  <b>Coste:</b> las pistas restan puntos y su precio depende de la dificultad.
                </li>
              </ul>
            </section>

            <section className="border border-border p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">
                04 / Puntuación y controles
              </p>
              <p className="mt-2">
                Sumas puntos por completar la misión, el tiempo y los intentos que conserves. Las
                rachas dan bonus; las pistas descuentan puntos.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="border border-border px-2 py-1 font-mono text-xs">
                  Retroceso · borrar
                </span>
                <span className="border border-border px-2 py-1 font-mono text-xs">
                  Supr · limpiar
                </span>
                <span className="border border-border px-2 py-1 font-mono text-xs">
                  Esc / P · pausa
                </span>
                <span className="border border-border px-2 py-1 font-mono text-xs">
                  Enter · enviar
                </span>
              </div>
            </section>

            <p className="border-l-2 border-primary/50 pl-3 font-mono text-xs text-muted-foreground">
              Ficción interactiva: no se accede a sistemas reales.
            </p>
          </div>
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
