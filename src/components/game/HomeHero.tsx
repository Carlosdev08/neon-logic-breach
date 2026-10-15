import type { SaveData } from "@/game/storage";
import type { getRankProgress } from "@/game/storage";

type RankProgress = ReturnType<typeof getRankProgress>;

export function HomeHero({
  save,
  completed,
  rankProgress,
  onEnter,
  onHelp,
}: {
  save: SaveData;
  completed: number;
  rankProgress: RankProgress;
  onEnter: () => void;
  onHelp: () => void;
}) {
  return (
      <section className="panel relative overflow-hidden p-5 text-left sm:p-9">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full border border-primary/20 sm:h-72 sm:w-72"
        />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-accent glow-accent">
              Distrito Neón · 2087 / Red clandestina
            </p>
            <h1 className="mt-4 font-display text-5xl font-bold leading-[0.95] tracking-[0.08em] text-primary glow-primary sm:text-7xl">
              NEON
              <br />
              BREACH
              <span aria-hidden="true" className="text-destructive">
                //
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Cinco corporaciones. Cinco secretos enterrados. Rompe sus cerraduras, recupera los
              archivos y descubre quién controla realmente el Distrito Neón.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button className={btnAccent + " px-6 py-3"} onClick={onEnter}>
                {showMissions ? "Contratos abiertos" : "Entrar en la red ↗"}
              </button>
              <button className={btnGhost + " py-3"} onClick={onHelp}>
                Cómo jugar
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-border bg-background/60 p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Rango actual
              </p>
              <p className="mt-2 font-display text-xl font-bold text-primary sm:text-2xl">
                {rankProgress.rank.name}
              </p>
              <p className="mt-1 font-mono text-xs text-accent">
                {save.xp.toLocaleString("es")} PX
              </p>
            </div>
            <div className="border border-border bg-background/60 p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Archivos
              </p>
              <p className="mt-2 font-display text-2xl font-bold text-accent">
                {completed}
                <span className="text-sm text-muted-foreground"> / 5</span>
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">Desbloqueados</p>
            </div>
            <div className="col-span-2 border border-border bg-background/60 p-4">
              <div className="flex items-center justify-between gap-3 font-mono text-xs">
                <span className="uppercase tracking-widest text-muted-foreground">
                  Progreso de rango
                </span>
                <span className="text-primary">{rankProgress.current}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden bg-muted">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${rankProgress.current}%` }}
                />
              </div>
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                {rankProgress.remaining === 0
                  ? "Rango máximo alcanzado. La red ya conoce tu nombre."
                  : `${rankProgress.remaining.toLocaleString("es")} PX para el siguiente rango`}
              </p>
            </div>
          </div>
        </div>
      </section>
  );
}
