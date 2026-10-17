import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase, isOnlineConfigured } from "@/lib/supabase";
import {
  getLeaderboardPeriodStart,
  getLeaderboardUsername,
  type LeaderboardPeriod,
} from "@/game/leaderboard";

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

const field =
  "mt-1 w-full border border-border bg-background px-3 py-3 font-mono text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary";
const button =
  "border border-primary px-3 py-2.5 font-mono text-xs uppercase tracking-wider text-primary transition hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50";
const panel = "border border-border/80 bg-background/50 p-4 sm:p-5";
const tabButton = (active: boolean) =>
  button + (active ? " bg-primary text-primary-foreground" : " border-border text-muted-foreground");

export function OnlineHub() {
  const supabase = getSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [period, setPeriod] = useState<LeaderboardPeriod>("global");
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const loadScores = useCallback(async () => {
    if (!supabase) return;
    let query = supabase
      .from("game_scores")
      .select("id,user_id,score,difficulty,created_at,profiles(username)")
      .order("created_at", { ascending: false });
    const start = getLeaderboardPeriodStart(period);
    if (start) query = query.gte("created_at", start.toISOString());
    const { data, error: queryError } = await query;
    if (queryError) {
      setError("No se pudo cargar el ranking. Inténtalo de nuevo en unos segundos.");
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
  }, [supabase, period]);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }
    let active = true;
    supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!active) return;
      setUser(data.user);
      setAuthLoading(false);
      if (authError) setError("No se pudo comprobar la sesión. Recarga la página.");
    }).catch(() => {
      if (active) {
        setAuthLoading(false);
        setError("No se pudo comprobar la sesión. Recarga la página.");
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryReady(true);
        setMode("reset");
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
          options: {
            data: { username: username.trim() },
            emailRedirectTo: window.location.origin,
          },
        });
        if (e) throw e;
        if (data.session) {
          setMessage("Cuenta creada. ¡Bienvenido a la red, operador!");
        } else {
          setConfirmationSent(true);
          setMessage("Te hemos enviado un enlace de confirmación. Ábrelo desde el dominio público de NEON BREACH.");
        }
      } else if (mode === "login") {
        const { error: e } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (e) throw e;
        setMessage("Sesión iniciada correctamente.");
      } else {
        const { error: e } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/`,
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

  if (!isOnlineConfigured) {
    return (
      <section className={panel}>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Red global · Fase 1</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-primary">PERFIL Y RANKING ONLINE</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Puedes seguir jugando como invitado. Las cuentas online y el ranking se activarán cuando la configuración de autenticación esté lista.
        </p>
      </section>
    );
  }

  const displayName = String(user?.user_metadata?.username ?? user?.email?.split("@")[0] ?? "Operador");
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <section className="grid min-w-0 gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="min-w-0 space-y-4">
        <div className={panel}>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Red global · Fase 1</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-primary">
            {authLoading ? "CONECTANDO A LA RED…" : user ? "TU PERFIL DE OPERADOR" : "ÚNETE A LA RED"}
          </h2>
          {authLoading ? (
            <div className="mt-5 animate-pulse space-y-3" aria-label="Comprobando sesión">
              <div className="h-16 border border-border bg-muted/20" />
              <div className="h-4 w-2/3 bg-muted/20" />
              <div className="h-10 bg-muted/20" />
            </div>
          ) : user ? (
            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-4 border border-primary/40 bg-primary/[0.04] p-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-primary font-display text-xl font-bold text-primary glow-primary" aria-hidden="true">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="break-words font-display text-xl font-bold text-foreground">{displayName}</p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">{user.email}</p>
                  <span className="mt-2 inline-flex border border-accent/50 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-accent">
                    ● Sesión activa
                  </span>
                </div>
              </div>
              {editingProfile ? (
                <form className="space-y-3 border border-border p-4" onSubmit={(e) => void saveProfile(e)}>
                  <label className="block text-xs text-muted-foreground">
                    Nombre de operador
                    <input className={field} autoComplete="username" minLength={3} maxLength={20}
                      pattern="[A-Za-z0-9_]+" required value={profileName}
                      onChange={(e) => setProfileName(e.target.value)} />
                  </label>
                  <p className="text-xs text-muted-foreground">3–20 caracteres. Letras, números y guion bajo.</p>
                  <div className="flex flex-wrap gap-2">
                    <button className={button} disabled={busy}>{busy ? "Guardando…" : "Guardar cambios"}</button>
                    <button type="button" className={button + " border-border text-muted-foreground"}
                      onClick={() => { setEditingProfile(false); setProfileName(displayName); setError(""); }}>Cancelar</button>
                  </div>
                </form>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="border border-border p-3">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Estado</p>
                    <p className="mt-1 text-sm text-accent">Operador conectado</p>
                  </div>
                  <div className="border border-border p-3">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Cuenta desde</p>
                    <p className="mt-1 text-sm text-foreground">{new Date(user.created_at).toLocaleDateString("es-ES")}</p>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {!editingProfile && <button className={button} onClick={() => { setEditingProfile(true); setError(""); setMessage(""); }}>Editar perfil</button>}
                <button className={button + " border-border text-muted-foreground"}
                  disabled={busy} onClick={() => void supabase?.auth.signOut()}>Cerrar sesión</button>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Tu cuenta te identifica en la red global. Completa misiones con la sesión iniciada para enviar tus puntuaciones al ranking.
              </p>
            </div>
          ) : (
            <>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                Guarda tu identidad de operador y compite en la clasificación global. También puedes jugar como invitado sin crear una cuenta.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {([
                  ["login", "Entrar"],
                  ["signup", "Crear cuenta"],
                  ["reset", "Recuperar"],
                ] as const).map(([value, label]) => (
                  <button key={value} type="button" className={tabButton(mode === value)}
                    aria-pressed={mode === value} onClick={() => {
                      setMode(value); setError(""); setMessage(""); setConfirmationSent(false);
                    }}>{label}</button>
                ))}
              </div>
              <form className="mt-4 space-y-3" onSubmit={(e) => void submit(e)}>
                {mode === "signup" && (
                  <label className="block text-xs text-muted-foreground">
                    Nombre de operador
                    <input className={field} autoComplete="username" minLength={3} maxLength={20}
                      pattern="[A-Za-z0-9_]+" required value={username}
                      onChange={(e) => setUsername(e.target.value)} placeholder="Ej. NeonRunner" />
                  </label>
                )}
                <label className="block text-xs text-muted-foreground">
                  Correo electrónico
                  <input className={field} type="email" autoComplete="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)} placeholder="operador@correo.com" />
                </label>
                {(mode !== "reset" || recoveryReady) && (
                  <label className="block text-xs text-muted-foreground">
                    {recoveryReady ? "Nueva contraseña" : "Contraseña"}
                    <input className={field} type="password"
                      autoComplete={mode === "signup" || recoveryReady ? "new-password" : "current-password"}
                      minLength={mode === "signup" || recoveryReady ? 8 : undefined} required
                      value={password} onChange={(e) => setPassword(e.target.value)} />
                  </label>
                )}
                <button className={button + " w-full py-3"} disabled={busy}>
                  {busy ? "Procesando…" : recoveryReady ? "Actualizar contraseña" :
                    mode === "signup" ? "Crear cuenta de operador →" :
                    mode === "reset" ? "Enviar enlace de recuperación →" : "Iniciar sesión →"}
                </button>
              </form>
              {confirmationSent && !user && (
                <button type="button" className={button + " mt-3"} disabled={busy}
                  onClick={async () => {
                    if (!supabase || !email.trim()) return;
                    setBusy(true); setError(""); setMessage("");
                    try {
                      const { error: resendError } = await supabase.auth.resend({
                        type: "signup", email: email.trim(),
                        options: { emailRedirectTo: window.location.origin },
                      });
                      if (resendError) throw resendError;
                      setMessage("Nuevo correo enviado. Espera al menos un minuto antes de volver a solicitarlo.");
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "No se pudo reenviar el correo.");
                    } finally { setBusy(false); }
                  }}>Reenviar confirmación</button>
              )}
            </>
          )}
          {message && <p role="status" className="mt-4 border border-primary/30 p-3 text-sm text-primary">{message}</p>}
          {error && <p role="alert" className="mt-4 border border-destructive/40 p-3 text-sm text-destructive">{error}</p>}
        </div>
        {!user && !authLoading && (
          <div className="border-l-2 border-accent/60 px-4 py-2">
            <p className="font-mono text-xs uppercase tracking-wider text-accent">Modo invitado disponible</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Vuelve al juego para completar misiones. Puedes registrarte más tarde para participar en el ranking online.
            </p>
          </div>
        )}
      </div>

      <div className={panel + " min-w-0"}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Clasificación de la red</p>
            <h3 className="mt-1 font-display text-xl font-bold text-foreground">TOP OPERADORES</h3>
          </div>
          <button className={button} onClick={() => void loadScores()}>↻ Actualizar</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Periodo del ranking">
          {([
            ["global", "Mundial"],
            ["weekly", "Semanal"],
            ["daily", "Hoy"],
          ] as const).map(([value, label]) => (
            <button key={value} className={tabButton(period === value)} aria-pressed={period === value}
              onClick={() => setPeriod(value)}>{label}</button>
          ))}
        </div>
        <ol className="mt-4 space-y-2">
          {scores.map((row, i) => (
            <li key={row.user_id}
              className={"flex min-w-0 items-center gap-3 border p-3 " +
                (user?.id === row.user_id ? "border-primary/70 bg-primary/[0.05]" : "border-border/70 bg-background/50")}>
              <span className="w-8 shrink-0 font-mono text-lg text-primary">{String(i + 1).padStart(2, "0")}</span>
              <div className="min-w-0 flex-1">
                <strong className="break-words text-sm">{row.username}{user?.id === row.user_id ? " · Tú" : ""}</strong>
                <p className="mt-1 text-xs text-muted-foreground">
                  {row.missions} {row.missions === 1 ? "misión" : "misiones"} · Última: {new Date(row.lastPlayed).toLocaleDateString("es-ES")}
                </p>
              </div>
              <span className="shrink-0 text-right font-mono text-sm text-accent">{row.totalScore.toLocaleString("es-ES")} <span className="text-[10px]">PTS</span></span>
            </li>
          ))}
          {scores.length === 0 && (
            <li className="border border-dashed border-border p-6 text-center">
              <p className="font-display text-lg text-muted-foreground">La red está en silencio</p>
              <p className="mt-1 text-xs text-muted-foreground">Aún no hay puntuaciones en este periodo.</p>
            </li>
          )}
        </ol>
        <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
          Las puntuaciones de las misiones completadas se envían automáticamente cuando tienes la sesión iniciada.
        </p>
      </div>
    </section>
  );
}
