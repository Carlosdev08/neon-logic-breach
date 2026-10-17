import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase, isOnlineConfigured } from "@/lib/supabase";
import { getLeaderboardPeriodStart, getLeaderboardUsername, type LeaderboardPeriod } from "@/game/leaderboard";
import { getRankProgress } from "@/game/storage";

type Score = {
  id: string;
  user_id: string;
  score: number;
  difficulty: string;
  created_at: string;
  profiles: { username: string } | { username: string }[] | null;
};
type LeaderboardEntry = {
  user_id: string;
  username: string;
  totalScore: number;
  missions: number;
  lastPlayed: string;
};
type Section = "profile" | "ranking" | "account";

const field =
  "mt-1 w-full min-w-0 border border-border bg-background px-3 py-3 font-mono text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary";
const button =
  "inline-flex min-h-11 items-center justify-center border border-primary px-3 py-2.5 font-mono text-xs uppercase tracking-wider text-primary transition hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50";
const panel = "min-w-0 border border-border/80 bg-background/50 p-4 sm:p-5";
const tabButton = (active: boolean) =>
  button +
  (active
    ? " bg-primary text-primary-foreground"
    : " border-border text-muted-foreground");

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="min-w-0 border border-border bg-background/60 p-3 sm:p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 break-words font-display text-2xl font-bold text-primary">{value}</p>
      {detail && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detail}</p>}
    </div>
  );
}

export function OnlineHub() {
  const supabase = getSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [section, setSection] = useState<Section>("profile");
  const [period, setPeriod] = useState<LeaderboardPeriod>("global");
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [scoresLoading, setScoresLoading] = useState(false);

  const loadScores = useCallback(async () => {
    if (!supabase) return;
    setScoresLoading(true);
    let query = supabase
      .from("game_scores")
      .select("id,user_id,score,difficulty,created_at,profiles(username)")
      .order("created_at", { ascending: false });
    const start = getLeaderboardPeriodStart(period);
    if (start) query = query.gte("created_at", start.toISOString());
    const { data, error: queryError } = await query;
    if (queryError) {
      setError("No se pudo cargar el ranking. Comprueba la conexión e inténtalo de nuevo.");
      setScoresLoading(false);
      return;
    }
    const totals = new Map<string, LeaderboardEntry>();
    for (const row of (data ?? []) as unknown as Score[]) {
      const name = getLeaderboardUsername(row.profiles);
      const existing = totals.get(row.user_id);
      if (existing) {
        existing.totalScore += row.score;
        existing.missions += 1;
        if (row.created_at > existing.lastPlayed) existing.lastPlayed = row.created_at;
      } else {
        totals.set(row.user_id, {
          user_id: row.user_id,
          username: name,
          totalScore: row.score,
          missions: 1,
          lastPlayed: row.created_at,
        });
      }
    }
    setScores(
      [...totals.values()]
        .sort((a, b) => b.totalScore - a.totalScore || b.lastPlayed.localeCompare(a.lastPlayed))
        .slice(0, 10),
    );
    setScoresLoading(false);
  }, [supabase, period]);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }
    let active = true;
    supabase.auth
      .getUser()
      .then(({ data, error: authError }) => {
        if (!active) return;
        setUser(data.user);
        setAuthLoading(false);
        if (authError) setError("No se pudo comprobar la sesión. Recarga la página.");
      })
      .catch(() => {
        if (active) {
          setAuthLoading(false);
          setError("No se pudo comprobar la sesión. Recarga la página.");
        }
      });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      if (event === "SIGNED_OUT") {
        setSection("profile");
        setEditingProfile(false);
        setMessage("Sesión cerrada.");
      }
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryReady(true);
        setMode("reset");
        setSection("account");
        setMessage("Introduce una nueva contraseña para completar la recuperación.");
        setError("");
      }
    });
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const authError = params.get("error_description") || params.get("error");
      if (authError) {
        setError(authError);
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      }
    }
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    void loadScores();
  }, [loadScores]);

  useEffect(() => {
    setProfileName(String(user?.user_metadata?.username ?? ""));
  }, [user]);

  const myStats = useMemo(() => {
    if (!user) return { totalScore: 0, missions: 0, bestScore: 0, position: null as number | null };
    const ownEntries = scores.filter((entry) => entry.user_id === user.id);
    return {
      totalScore: ownEntries[0]?.totalScore ?? 0,
      missions: ownEntries[0]?.missions ?? 0,
      bestScore: ownEntries[0]?.totalScore ?? 0,
      position: ownEntries.length ? scores.findIndex((entry) => entry.user_id === user.id) + 1 : null,
    };
  }, [scores, user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (recoveryReady && mode === "reset") {
        const { error: e } = await supabase.auth.updateUser({ password });
        if (e) throw e;
        setRecoveryReady(false);
        setPassword("");
        setMode("login");
        setMessage("Contraseña actualizada. Ya puedes iniciar sesión.");
        await supabase.auth.signOut();
      } else if (mode === "signup") {
        if (!/^[A-Za-z0-9_]{3,20}$/.test(username.trim())) {
          setError("El usuario debe tener entre 3 y 20 caracteres: letras, números o guion bajo.");
          return;
        }
        const { data, error: e } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { username: username.trim() }, emailRedirectTo: window.location.origin },
        });
        if (e) throw e;
        if (data.session) {
          setMessage("Cuenta creada. ¡Bienvenido a la red, operador!");
          setSection("profile");
        } else {
          setConfirmationSent(true);
          setMessage("Te hemos enviado un enlace de confirmación. Ábrelo desde el dominio público de NEON BREACH.");
        }
      } else if (mode === "login") {
        const { error: e } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (e) throw e;
        setMessage("Sesión iniciada correctamente.");
        setSection("profile");
      } else {
        const { error: e } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/?view=online`,
        });
        if (e) throw e;
        setMessage("Si el correo está registrado, recibirás instrucciones de recuperación.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar la operación.");
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user) return;
    const cleanName = profileName.trim();
    if (!/^[A-Za-z0-9_]{3,20}$/.test(cleanName)) {
      setError("El usuario debe tener entre 3 y 20 caracteres: letras, números o guion bajo.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const { data, error: updateError } = await supabase.auth.updateUser({
        data: { ...user.user_metadata, username: cleanName },
      });
      if (updateError) throw updateError;
      if (data.user) setUser(data.user);
      setEditingProfile(false);
      setMessage("Perfil actualizado correctamente.");
      await loadScores();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar el perfil.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    setBusy(true);
    setError("");
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      setMessage("Sesión cerrada correctamente.");
      setSection("profile");
      setEditingProfile(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cerrar la sesión.");
    } finally {
      setBusy(false);
    }
  }

  if (!isOnlineConfigured) {
    return (
      <section className={panel}>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Red global · Fase 1</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-primary">PERFIL Y RANKING ONLINE</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Puedes seguir jugando como invitado. Las cuentas online y el ranking se activarán cuando la configuración de autenticación esté lista.
        </p>
      </section>
    );
  }

  const displayName = String(user?.user_metadata?.username ?? user?.email?.split("@")[0] ?? "Operador");
  const initials = displayName.slice(0, 2).toUpperCase();
  const xp = Number(user?.user_metadata?.xp ?? 0);
  const safeXp = Number.isFinite(xp) && xp > 0 ? Math.floor(xp) : 0;
  const rankProgress = getRankProgress(safeXp);
  const createdAt = user ? new Date(user.created_at).toLocaleDateString("es-ES") : "—";

  return (
    <section className="mx-auto grid min-w-0 max-w-6xl gap-4 sm:gap-5">
      <nav className="grid grid-cols-3 gap-2 border border-border bg-background/60 p-2" aria-label="Secciones de red global">
        {([
          ["profile", "Mi perfil"],
          ["ranking", "Ranking"],
          ["account", "Cuenta"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={tabButton(section === value)}
            aria-pressed={section === value}
            onClick={() => { setSection(value); setError(""); setMessage(""); }}
          >
            {label}
          </button>
        ))}
      </nav>

      {authLoading ? (
        <div className={panel} role="status">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">Estableciendo conexión segura…</p>
          <div className="mt-4 h-24 animate-pulse border border-border bg-muted/20" />
        </div>
      ) : !user ? (
        <div className={panel}>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Identificación de operador</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-primary">ÚNETE A LA RED GLOBAL</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Puedes jugar como invitado. Crea tu cuenta cuando quieras guardar tu identidad online y aparecer en las clasificaciones.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {([
              ["login", "Entrar"],
              ["signup", "Crear cuenta"],
              ["reset", "Recuperar"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={tabButton(mode === value)}
                aria-pressed={mode === value}
                onClick={() => { setMode(value); setError(""); setMessage(""); setConfirmationSent(false); }}
              >
                {label}
              </button>
            ))}
          </div>
          <form className="mt-4 grid min-w-0 gap-3 sm:max-w-xl" onSubmit={(e) => void submit(e)}>
            {mode === "signup" && (
              <label className="block text-xs text-muted-foreground">
                Nombre de operador
                <input className={field} autoComplete="username" minLength={3} maxLength={20} pattern="[A-Za-z0-9_]+" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ej. NeonRunner" />
              </label>
            )}
            <label className="block text-xs text-muted-foreground">
              Correo electrónico
              <input className={field} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="operador@correo.com" />
            </label>
            {(mode !== "reset" || recoveryReady) && (
              <label className="block text-xs text-muted-foreground">
                {recoveryReady ? "Nueva contraseña" : "Contraseña"}
                <input className={field} type="password" autoComplete={mode === "signup" || recoveryReady ? "new-password" : "current-password"} minLength={mode === "signup" || recoveryReady ? 8 : undefined} required value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
            )}
            <button className={button + " w-full py-3"} disabled={busy}>
              {busy ? "Procesando…" : recoveryReady ? "Actualizar contraseña" : mode === "signup" ? "Crear cuenta de operador →" : mode === "reset" ? "Enviar enlace de recuperación →" : "Iniciar sesión →"}
            </button>
          </form>
          {confirmationSent && !user && (
            <button
              type="button"
              className={button + " mt-3"}
              disabled={busy}
              onClick={async () => {
                if (!supabase || !email.trim()) return;
                setBusy(true); setError(""); setMessage("");
                try {
                  const { error: resendError } = await supabase.auth.resend({
                    type: "signup", email: email.trim(), options: { emailRedirectTo: window.location.origin },
                  });
                  if (resendError) throw resendError;
                  setMessage("Nuevo correo enviado. Espera al menos un minuto antes de volver a solicitarlo.");
                } catch (e) {
                  setError(e instanceof Error ? e.message : "No se pudo reenviar el correo.");
                } finally { setBusy(false); }
              }}
            >
              Reenviar confirmación
            </button>
          )}
          <div className="mt-5 border-t border-border pt-4">
            <p className="font-mono text-xs uppercase tracking-wider text-accent">Modo invitado disponible</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Vuelve al juego para completar misiones. Puedes registrarte más tarde.</p>
          </div>
        </div>
      ) : section === "profile" ? (
        <div className={panel}>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Red global · Fase 1</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-primary sm:text-3xl">TU PERFIL DE OPERADOR</h2>
          <div className="mt-5 flex min-w-0 items-center gap-4 border border-primary/40 bg-primary/[0.04] p-4 sm:p-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center border border-primary font-display text-2xl font-bold text-primary glow-primary sm:h-20 sm:w-20" aria-hidden="true">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="break-words font-display text-xl font-bold text-foreground sm:text-2xl">{displayName}</p>
              <p className="mt-1 break-all text-xs text-muted-foreground">{user.email}</p>
              <span className="mt-2 inline-flex border border-accent/50 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-accent">● Sesión activa</span>
            </div>
            <span className="hidden shrink-0 border border-primary/40 px-3 py-2 font-mono text-xs text-primary sm:inline">LVL {Math.floor(safeXp / 100) + 1}</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="Rango actual" value={rankProgress.rank.name} detail={`${safeXp.toLocaleString("es-ES")} XP acumulados`} />
            <Metric label="Puntuación total" value={myStats.totalScore.toLocaleString("es-ES")} detail="En el periodo actual del ranking" />
            <Metric label="Misiones registradas" value={String(myStats.missions)} detail="Resultados online disponibles" />
            <Metric label="Cuenta desde" value={createdAt} detail="Fecha de registro" />
          </div>

          <div className="mt-4 border border-border p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Progreso al siguiente rango</p>
              <p className="font-mono text-xs text-primary">{rankProgress.current}%</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden bg-muted" role="progressbar" aria-label="Progreso al siguiente rango" aria-valuenow={rankProgress.current} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full bg-primary transition-all" style={{ width: `${rankProgress.current}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{rankProgress.remaining > 0 ? `Faltan ${rankProgress.remaining.toLocaleString("es-ES")} XP para el siguiente rango.` : "Has alcanzado el rango máximo."}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">La progresión XP local del juego y las puntuaciones online aún son sistemas separados; aquí no se inventan datos de misiones no sincronizadas.</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button className={button} onClick={() => setSection("account")}>Editar perfil →</button>
            <button className={button + " border-border text-muted-foreground"} onClick={() => setSection("ranking")}>Ver ranking →</button>
          </div>
        </div>
      ) : section === "ranking" ? (
        <div className={panel}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Clasificación de la red</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">RANKING DE OPERADORES</h2>
            </div>
            <button className={button} disabled={scoresLoading} onClick={() => void loadScores()}>{scoresLoading ? "Actualizando…" : "↻ Actualizar"}</button>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2" aria-label="Periodo del ranking">
            {([
              ["global", "Mundial"],
              ["weekly", "Semanal"],
              ["daily", "Diario"],
            ] as const).map(([value, label]) => (
              <button key={value} className={tabButton(period === value)} aria-pressed={period === value} onClick={() => setPeriod(value)}>{label}</button>
            ))}
          </div>
          {user && (
            <div className="mt-4 border border-primary/40 bg-primary/[0.04] p-3 text-sm">
              <span className="text-muted-foreground">Tu puesto en el top 10: </span>
              <strong className="text-primary">{myStats.position ? `#${myStats.position}` : "Fuera del top 10"}</strong>
            </div>
          )}
          <ol className="mt-4 space-y-2">
            {scores.map((row, i) => (
              <li key={row.user_id} className={"flex min-w-0 items-center gap-3 border p-3 sm:p-4 " + (user?.id === row.user_id ? "border-primary/70 bg-primary/[0.05]" : "border-border/70 bg-background/50")}>
                <span className="w-8 shrink-0 font-mono text-lg text-primary">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <strong className="break-words text-sm">{row.username}{user?.id === row.user_id ? " · Tú" : ""}</strong>
                  <p className="mt-1 text-xs text-muted-foreground">{row.missions} {row.missions === 1 ? "misión" : "misiones"} · Última: {new Date(row.lastPlayed).toLocaleDateString("es-ES")}</p>
                </div>
                <span className="shrink-0 text-right font-mono text-sm text-accent">{row.totalScore.toLocaleString("es-ES")} <span className="text-[10px]">PTS</span></span>
              </li>
            ))}
            {!scoresLoading && scores.length === 0 && (
              <li className="border border-dashed border-border p-6 text-center">
                <p className="font-display text-lg text-muted-foreground">La red está en silencio</p>
                <p className="mt-1 text-xs text-muted-foreground">Aún no hay puntuaciones en este periodo.</p>
              </li>
            )}
          </ol>
          <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">Clasificaciones calculadas a partir de puntuaciones online registradas. Mundial incluye todo el historial; semanal y diario usan su periodo correspondiente.</p>
        </div>
      ) : (
        <div className={panel}>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Seguridad de la cuenta</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-primary sm:text-3xl">CONFIGURACIÓN DE CUENTA</h2>
          <div className="mt-5 flex min-w-0 items-center gap-3 border border-border p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-primary font-display text-lg font-bold text-primary">{initials}</div>
            <div className="min-w-0">
              <p className="break-words font-display text-lg font-bold">{displayName}</p>
              <p className="break-all text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          {editingProfile ? (
            <form className="mt-4 grid gap-3 sm:max-w-xl" onSubmit={(e) => void saveProfile(e)}>
              <label className="block text-xs text-muted-foreground">
                Nombre de operador
                <input className={field} autoComplete="username" minLength={3} maxLength={20} pattern="[A-Za-z0-9_]+" required value={profileName} onChange={(e) => setProfileName(e.target.value)} />
              </label>
              <p className="text-xs text-muted-foreground">De 3 a 20 caracteres: letras, números o guion bajo.</p>
              <div className="flex flex-wrap gap-2">
                <button className={button} disabled={busy}>{busy ? "Guardando…" : "Guardar cambios"}</button>
                <button type="button" className={button + " border-border text-muted-foreground"} disabled={busy} onClick={() => { setEditingProfile(false); setProfileName(displayName); setError(""); }}>Cancelar</button>
              </div>
            </form>
          ) : (
            <button className={button + " mt-4"} onClick={() => { setProfileName(displayName); setEditingProfile(true); setError(""); setMessage(""); }}>Editar nombre de operador</button>
          )}
          <div className="mt-6 border-t border-border pt-5">
            <h3 className="font-display text-lg font-bold">Recuperar contraseña</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{recoveryReady ? "Introduce una contraseña nueva para terminar la recuperación." : "Solicita un enlace seguro al correo asociado a tu cuenta."}</p>
            <form className="mt-3 grid gap-3 sm:max-w-xl" onSubmit={(e) => void submit(e)}>
              {!recoveryReady && (
                <label className="block text-xs text-muted-foreground">
                  Correo electrónico
                  <input className={field} type="email" autoComplete="email" required value={email || user.email || ""} onChange={(e) => setEmail(e.target.value)} />
                </label>
              )}
              {recoveryReady && (
                <label className="block text-xs text-muted-foreground">
                  Nueva contraseña
                  <input className={field} type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
                </label>
              )}
              <button className={button + " w-fit"} disabled={busy}>{busy ? "Procesando…" : recoveryReady ? "Actualizar contraseña" : "Enviar enlace de recuperación"}</button>
            </form>
          </div>
          <div className="mt-6 border-t border-border pt-5">
            <h3 className="font-display text-lg font-bold">Cerrar sesión</h3>
            <p className="mt-1 text-sm text-muted-foreground">Se cerrará la sesión de esta cuenta en este navegador.</p>
            <button className={button + " mt-3 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"} disabled={busy} onClick={() => void signOut()}>{busy ? "Cerrando…" : "Cerrar sesión"}</button>
          </div>
        </div>
      )}

      {message && <p role="status" className="border border-primary/30 p-3 text-sm text-primary">{message}</p>}
      {error && <p role="alert" className="break-words border border-destructive/40 p-3 text-sm text-destructive">{error}</p>}
      {!user && !authLoading && (
        <p className="border-l-2 border-accent/60 px-4 py-2 text-xs leading-relaxed text-muted-foreground">Puedes seguir jugando como invitado; el registro solo es necesario para guardar identidad online y participar en el ranking.</p>
      )}
    </section>
  );
}
