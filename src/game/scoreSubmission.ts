import type { Difficulty } from "@/game/logic";

export interface MissionScore {
  userId: string;
  score: number;
  difficulty: Difficulty;
  missionsCompleted: number;
  durationSeconds: number;
}

export interface ScoreGateway {
  getAuthenticatedUserId(): Promise<string | null>;
  insertMissionScore(score: MissionScore): Promise<boolean>;
}

export interface CompletedMission {
  seed: number;
  missionIndex: number;
  difficulty: Difficulty;
  score: number;
  timeLeft: number;
}

/** Application service: maps a completed mission into a persisted score. */
export async function submitCompletedMission(
  mission: CompletedMission,
  gateway: ScoreGateway,
): Promise<boolean> {
  const userId = await gateway.getAuthenticatedUserId();
  if (!userId) return false;

  return gateway.insertMissionScore({
    userId,
    score: Math.max(0, Math.floor(mission.score)),
    difficulty: mission.difficulty,
    missionsCompleted: Math.min(5, Math.max(1, mission.missionIndex + 1)),
    durationSeconds: Math.max(0, 300 - mission.timeLeft),
  });
}
