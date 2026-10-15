import { useEffect } from "react";
import type { GameState } from "@/game/reducer";
import { getSupabase } from "@/lib/supabase";

/** Sends each completed mission once per browser session for authenticated players. */
export function useSubmitMissionScore(state: GameState) {
  useEffect(() => {
    if (state.phase !== "won" || typeof window === "undefined") return;
    const supabase = getSupabase();
    if (!supabase) return;

    const dedupeKey = `neon-breach:submitted:${state.seed}:${state.missionIndex}:${state.difficulty}`;
    if (window.sessionStorage.getItem(dedupeKey)) return;

    let cancelled = false;
    void (async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (cancelled || userError || !user) return;

      const { error } = await supabase.from("game_scores").insert({
        user_id: user.id,
        score: Math.max(0, Math.floor(state.lastScore?.total ?? state.runScore)),
        difficulty: state.difficulty,
        missions_completed: Math.min(5, state.missionIndex + 1),
        duration_seconds: Math.max(0, 300 - state.timeLeft),
      });
      if (!error && !cancelled) window.sessionStorage.setItem(dedupeKey, "1");
    })();

    return () => {
      cancelled = true;
    };
  }, [
    state.phase,
    state.seed,
    state.missionIndex,
    state.difficulty,
    state.lastScore?.total,
    state.runScore,
    state.timeLeft,
  ]);
}
