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
  score: number;
  difficulty: string;
  created_at: string;
  profiles: { username: string } | { username: string }[] | null;
};
const field =
  "mt-1 w-full border border-border bg-background px-3 py-2 font-mono text-sm text-foreground";
const button =
  "border border-primary px-3 py-2 font-mono text-xs uppercase tracking-wider text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-50";

export function OnlineHub() {
  const supabase = getSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [period, setPeriod] = useState<LeaderboardPeriod>("global");
  const [scores, setScores] = useState<Score[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const loadScores = useCallback(async () => {
    if (!supabase) return;
    let query = supabase
      .from("game_scores")
      .select("id,score,difficulty,created_at,profiles(username)")
      .order("score", { ascending: false })
      .limit(10);
    const start = getLeaderboardPeriodStart(period);
    if (start) query = query.gte("created_at", start.toISOString());
    const { data, error: queryError } = await query;
    if (queryError) setError("No se pudo cargar el ranking. Revisa la configuración de Supabase.");
    else setScores(aggregateLeaderboardScores((data ?? []) as unknown as Score[]) as Score[]);
  }, [supabase, period]);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setUser(data.user);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
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
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname + window.location.search,
        );
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
          setError("Usuario: 3–20 caracteres, letras, números o guion bajo.");
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
          setMessage("Cuenta creada y sesión iniciada.");
        } else {
          setConfirmationSent(true);
          setMessage(
            "Te hemos enviado un enlace de confirmación. Ábrelo una sola vez desde el dominio público de NEON BREACH.",
          );
        }
      } else if (mode === "login") {
        const { error: e } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (e) throw e;
        setMessage("Sesión iniciada.");
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
  if (!isOnlineConfigured)
    return (
      <section className="panel p-5 sm:p-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
          Red global · Fase 1
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold text-primary">
          PERFIL Y RANKING ONLINE
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Puedes seguir jugando como invitado. Las cuentas online y el ranking se activarán cuando
          la configuración de autenticación esté lista.
        </p>
      </section>
    );
  return (
    <section className="panel grid gap-6 p-5 sm:p-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
          Red global · Fase 1
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold text-primary">
          PERFIL Y RANKING ONLINE
        </h2>
        {user ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm">
              Conectado como{" "}
              <strong>{String(user.user_metadata?.username ?? user.email ?? "Operador")}</strong>
            </p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <button className={button} onClick={() => void supabase?.auth.signOut()}>
              Cerrar sesión
            </button>
          </div>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              {(
                [
                  ["login", "Entrar"],
                  ["signup", "Crear cuenta"],
                  ["reset", "Recuperar acceso"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  className={button}
                  onClick={() => {
                    setMode(v);
                    setError("");
                    setMessage("");
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <form className="mt-4 space-y-3" onSubmit={(e) => void submit(e)}>
              {mode === "signup" && (
                <label className="block text-xs text-muted-foreground">
                  Nombre de usuario
                  <input
                    className={field}
                    autoComplete="username"
                    minLength={3}
                    maxLength={20}
                    pattern="[A-Za-z0-9_]+"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </label>
              )}
              <label className="block text-xs text-muted-foreground">
                Correo electrónico
                <input
                  className={field}
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              {(mode !== "reset" || recoveryReady) && (
                <label className="block text-xs text-muted-foreground">
                  Contraseña
                  <input
                    className={field}
                    type="password"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    minLength={mode === "signup" || recoveryReady ? 8 : undefined}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
              )}
              <button className={button} disabled={busy}>
                {busy
                  ? "Procesando…"
                  : recoveryReady
                    ? "Actualizar contraseña"
                    : mode === "signup"
                      ? "Crear cuenta"
                      : mode === "reset"
                        ? "Enviar recuperación"
                        : "Iniciar sesión"}
              </button>
            </form>
          </>
        )}
        {message && (
          <p role="status" className="mt-3 text-sm text-primary">
            {message}
          </p>
        )}
        {confirmationSent && !user && (
          <button
            type="button"
            className={button + " mt-3"}
            disabled={busy}
            onClick={async () => {
              if (!supabase || !email.trim()) return;
              setBusy(true);
              setError("");
              setMessage("");
              try {
                const { error: resendError } = await supabase.auth.resend({
                  type: "signup",
                  email: email.trim(),
                  options: { emailRedirectTo: window.location.origin },
                });
                if (resendError) throw resendError;
                setMessage(
                  "Nuevo correo enviado. Espera al menos un minuto antes de volver a solicitarlo.",
                );
              } catch (e) {
                setError(e instanceof Error ? e.message : "No se pudo reenviar el correo.");
              } finally {
                setBusy(false);
              }
            }}
          >
            Reenviar confirmación
          </button>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-xl font-bold">TOP OPERADORES</h3>
          <div className="flex gap-1">
            {(
              [
                ["global", "Mundial"],
                ["weekly", "Semanal"],
                ["daily", "Hoy"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                className={button + (period === v ? " bg-primary text-primary-foreground" : "")}
                aria-pressed={period === v}
                onClick={() => setPeriod(v)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <ol className="mt-4 space-y-2">
          {scores.map((row, i) => (
            <li
              key={row.user_id}
              className="flex items-center justify-between gap-3 border border-border/70 bg-background/50 px-3 py-3"
            >
              <div>
                <span className="mr-3 font-mono text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <strong className="text-sm">{getLeaderboardUsername(row.profiles)}</strong>
                <p className="ml-8 text-xs text-muted-foreground">
                  {row.missions} {row.missions === 1 ? "misión" : "misiones"} · última: {row.difficulty} · {new Date(row.created_at).toLocaleDateString("es-ES")}
                </p>
              </div>
              <span className="font-mono text-accent">{("totalScore" in row ? row.totalScore : row.score).toLocaleString("es-ES")} pts</span>
            </li>
          ))}
          {scores.length === 0 && (
            <li className="border border-border/70 p-4 text-sm text-muted-foreground">
              Todavía no hay puntuaciones en este periodo.
            </li>
          )}
        </ol>
        <button className={button + " mt-3"} onClick={() => void loadScores()}>
          Actualizar ranking
        </button>
        <p className="mt-3 text-xs text-muted-foreground">
          Las puntuaciones de misiones completadas se envían automáticamente cuando has iniciado
          sesión.
        </p>
      </div>
    </section>
  );
}
