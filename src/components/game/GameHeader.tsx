import type { Phase } from "@/game/reducer";

type GameHeaderProps = {
  phase: Phase;
  bestScore: number;
  soundEnabled: boolean;
  activeView: "home" | "online";
  onQuit: () => void;
  onToggleSound: () => void;
  onNavigate: (view: "home" | "online") => void;
  onHelp: () => void;
};

const buttonClass =
  "font-mono uppercase tracking-wider text-sm px-4 py-2 border transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
const ghostButtonClass = `${buttonClass} border-border text-muted-foreground hover:text-foreground hover:border-primary`;

/** Presentational header. All state changes are supplied by the game coordinator. */
export function GameHeader({
  phase,
  bestScore,
  soundEnabled,
  activeView,
  onQuit,
  onToggleSound,
  onNavigate,
  onHelp,
}: GameHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
      <button
        onClick={onQuit}
        className="font-display text-xl font-bold tracking-[0.25em] text-primary glow-primary animate-flicker"
        aria-label="Volver al inicio"
      >
        NEON<span className="text-destructive glow-danger">//</span>BREACH
      </button>
      <div className="flex items-center gap-2">
        {phase === "title" && (
          <button
            onClick={() => onNavigate(activeView === "home" ? "online" : "home")}
            className={ghostButtonClass}
            aria-pressed={activeView === "online"}
          >
            {activeView === "online" ? "Inicio" : "Red global"}
          </button>
        )}
        <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
          RÉCORD {bestScore.toLocaleString("es")}
        </span>
        <button onClick={onToggleSound} className={ghostButtonClass} aria-pressed={soundEnabled}>
          Sonido: {soundEnabled ? "Sí" : "No"}
        </button>
        <button onClick={onHelp} className={ghostButtonClass}>
          Cómo jugar
        </button>
      </div>
    </header>
  );
}
