import { useEffect, useRef } from "react";
import type { GameState } from "@/game/reducer";
import { submitCompletedMission, type ScoreGateway } from "@/game/scoreSubmission";
import { getSupabase } from "@/lib/supabase";

function createSupabaseScoreGateway(): ScoreGateway | null {
  const supabase = getSupabase();
  if (!supabase) return null;

  return {
    async getAuthenticatedUserId() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      return error ? null : (user?.id ?? null);
    },
    async insertMissionScore(score) {
      const { error } = await supabase.from("game_scores").insert({
        user_id: score.userId,
        score: score.score,
        difficulty: score.difficulty,
        missions_completed: score.missionsCompleted,
        duration_seconds: score.durationSeconds,
      });
      return !error;
    },
  };
}

function readSessionSubmission(key: string): boolean {
  try {
    return window.sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function markSessionSubmission(key: string): void {
  try {
    window.sessionStorage.setItem(key, "1");
  } catch {
    // The in-memory guard still prevents duplicate submissions in this mount.
  }
}

/** Sends each completed mission once per browser session for authenticated players. */
export function useSubmitMissionScore(state: GameState) {
  const inFlight = useRef(new Set<string>());

  useEffect(() => {
    if (state.phase !== "won" || typeof window === "undefined") return;

    const key = `neon-breach:submitted:${state.seed}:${state.missionIndex}:${state.difficulty}`;
    if (readSessionSubmission(key) || inFlight.current.has(key)) return;

    const gateway = createSupabaseScoreGateway();
    if (!gateway) return;

    inFlight.current.add(key);
    let cancelled = false;

    void submitCompletedMission(
      {
        seed: state.seed,
        missionIndex: state.missionIndex,
        difficulty: state.difficulty,
        score: state.lastScore?.total ?? state.runScore,
        timeLeft: state.timeLeft,
      },
      gateway,
    )
      .then((submitted) => {
        if (submitted && !cancelled) markSessionSubmission(key);
      })
      .catch(() => {
        // A failed network request must not break the game UI.
      })
      .finally(() => {
        inFlight.current.delete(key);
      });

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
