import { useState } from "react";
import { DIFFICULTIES, getMissionsForDifficulty, type Difficulty } from "@/game/logic";
import { getRankProgress, type SaveData } from "@/game/storage";
import { HomeHero } from "@/components/game/HomeHero";

const btn =
  "font-mono uppercase tracking-wider text-sm px-4 py-2 border transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
const btnPrimary =
  `${btn} border-primary text-primary hover:bg-primary hover:text-primary-foreground`;
const btnAccent =
  `${btn} border-accent bg-accent text-accent-foreground hover:bg-accent/80 font-semibold`;
const btnGhost =
  `${btn} border-border text-muted-foreground hover:text-foreground hover:border-primary`;

const MISSION_INTEL = [
  {
    title: "Manifiesto de carga 09",
    text: "Kurogane alteró los registros de envío para ocultar material destinado al distrito industrial. La última copia apunta a un intermediario dentro del Consorcio Eclipse.",
  },
  {
    title: "Informe Helix / Proyecto Lázaro",
    text: "Helix Biogenética probó un protocolo de modificación neuronal sin consentimiento. Una firma digital conecta el experimento con contratos de vigilancia de Ónix.",
  },
  {
    title: "Orden de vigilancia D-9",
    text: "Ónix Seguridad Privada desplegó reconocimiento predictivo sobre residentes del distrito 9. El informe revela que Banco Prisma financió la infraestructura.",
  },
  {
    title: "Libro mayor Prisma",
    text: "Las cuentas cifradas muestran pagos cruzados entre las cinco corporaciones. Una transferencia recurrente lleva el sello del Proyecto Eclipse.",
  },
  {
    title: "Dossier Eclipse / 2087",
    text: "Eclipse coordinó las operaciones anteriores para provocar un apagón controlado y comprar los activos de la ciudad. La filtración completa ya puede reconstruirse.",
  },
];

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
  const rankProgress = getRankProgress(save.xp);
  const completed = Math.max(0, progress.unlocked - 1);
  const [showMissions, setShowMissions] = useState(false);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:py-12">
      <HomeHero
        save={save}
        completed={completed}
        rankProgress={rankProgress}
        onEnter={() => setShowMissions(true)}
        onHelp={onHelp}
      />

      {!showMissions ? (
        <section className="space-y-4" aria-labelledby="dificultades">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">
                Selecciona protocolo
              </p>
              <h2
                id="dificultades"
                className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl"
              >
                Elige tu dificultad
              </h2>
            </div>
            <span className="font-mono text-xs text-muted-foreground">01 / 03 niveles</span>
          </div>
          <div
            className="grid gap-3 md:grid-cols-3"
            role="group"
            aria-label="Seleccionar dificultad"
          >
            {DIFFICULTIES.map((level, index) => {
              const levelProgress = save.progress[level.id];
              const levelNames = ["Entrenamiento", "Operación estándar", "Protocolo de élite"];
              return (
                <button
                  key={level.id}
                  type="button"
                  aria-label={"Elegir dificultad " + level.label}
                  onClick={() => {
                    onDifficultyChange(level.id);
                    setShowMissions(true);
                  }}
                  className={
                    "group panel min-h-48 border p-5 text-left transition-all hover:-translate-y-1 hover:border-primary hover:shadow-[0_0_24px_rgba(0,240,255,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary " +
                    (difficulty === level.id ? "border-primary/70" : "border-border")
                  }
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">
                      0{index + 1} / PROTOCOLO
                    </span>
                    <span className="text-primary" aria-hidden="true">
                      {index === 0 ? "◇" : index === 1 ? "⬡" : "✳"}
                    </span>
                  </div>
                  <span className="mt-4 block font-display text-2xl font-bold text-primary">
                    {level.label}
                  </span>
                  <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">
                    {level.description}
                  </span>
                  <div className="mt-5 flex items-center justify-between border-t border-border pt-3 font-mono text-xs">
                    <span className="text-muted-foreground">
                      {Math.max(0, levelProgress.unlocked - 1)}/5 archivos
                    </span>
                    <span className="text-accent group-hover:translate-x-1 transition-transform">
                      Abrir →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="panel p-4 text-left sm:p-6" aria-labelledby="misiones">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">
                Contratos de la red
              </p>
              <h2 id="misiones" className="mt-1 font-display text-2xl font-bold text-primary">
                {DIFFICULTIES.find((d) => d.id === difficulty)?.label} · Misiones
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Completa cada operación para desbloquear el siguiente expediente corporativo.
              </p>
            </div>
            <div className="font-mono text-xs text-muted-foreground">
              Récord:{" "}
              <span className="text-accent">
                {loaded ? progress.bestScore.toLocaleString("es") : "…"}
              </span>
            </div>
          </div>
          <button className={btnGhost + " mt-4"} onClick={() => setShowMissions(false)}>
            ← Volver a dificultades
          </button>
          <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {missions.map((m, i) => {
              const locked = m.id > progress.unlocked;
              const cleared = m.id < progress.unlocked;
              const intel = MISSION_INTEL[i];
              return (
                <li key={m.id}>
                  <article
                    className={
                      "h-full border p-4 transition-colors " +
                      (locked
                        ? "border-border/50 bg-background/20 opacity-55"
                        : cleared
                          ? "border-accent/50 bg-accent/[0.03]"
                          : "border-primary/60 bg-primary/[0.03]")
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        OP-{String(m.id).padStart(2, "0")}
                      </span>
                      <span
                        className={
                          "font-mono text-[10px] uppercase tracking-widest " +
                          (locked
                            ? "text-muted-foreground"
                            : cleared
                              ? "text-accent"
                              : "text-primary")
                        }
                      >
                        {locked ? "Cifrado" : cleared ? "Archivo abierto" : "Disponible"}
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-xl font-bold text-foreground">
                      {m.name}
                    </h3>
                    <p className="mt-1 font-mono text-xs text-primary">{m.corp}</p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {m.objective}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 font-mono text-[10px] text-muted-foreground">
                      <span className="border border-border px-2 py-1">{m.codeLength} DÍGITOS</span>
                      <span className="border border-border px-2 py-1">
                        {m.maxAttempts} INTENTOS
                      </span>
                      <span className="border border-border px-2 py-1">
                        {Math.floor(m.timeLimit / 60)} MIN
                      </span>
                    </div>
                    {cleared && intel && (
                      <div className="mt-4 border-t border-accent/30 pt-3">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                          Intel desbloqueada · {intel.title}
                        </p>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          {intel.text}
                        </p>
                      </div>
                    )}
                    <button
                      disabled={locked || !loaded}
                      onClick={() => onStart(i)}
                      className={
                        (locked ? btnGhost : cleared ? btnPrimary : btnAccent) + " mt-5 w-full"
                      }
                      aria-label={
                        locked ? `Misión ${m.id} bloqueada` : `Jugar misión ${m.id}: ${m.name}`
                      }
                    >
                      {locked
                        ? "Acceso denegado"
                        : cleared
                          ? "Repetir operación"
                          : "Iniciar operación →"}
                    </button>
                  </article>
                </li>
              );
            })}
          </ol>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="font-mono text-xs text-muted-foreground">
              El progreso se guarda en este dispositivo.
            </p>
            <button
              onClick={onReset}
              className="font-mono text-xs text-muted-foreground underline-offset-4 hover:text-destructive hover:underline"
            >
              Reiniciar progreso
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
