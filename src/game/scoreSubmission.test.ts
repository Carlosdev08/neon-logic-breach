import { describe, expect, it, vi } from "vitest";
import { submitCompletedMission, type ScoreGateway } from "./scoreSubmission";

function createGateway(): ScoreGateway {
  return {
    getAuthenticatedUserId: vi.fn().mockResolvedValue("user-123"),
    insertMissionScore: vi.fn().mockResolvedValue(true),
  };
}

describe("submitCompletedMission", () => {
  it("does not submit a score when there is no authenticated user", async () => {
    const gateway = createGateway();
    vi.mocked(gateway.getAuthenticatedUserId).mockResolvedValue(null);

    await expect(
      submitCompletedMission(
        { seed: 7, missionIndex: 0, difficulty: "medio", score: 150, timeLeft: 240 },
        gateway,
      ),
    ).resolves.toBe(false);
    expect(gateway.insertMissionScore).not.toHaveBeenCalled();
  });

  it("normalizes and submits the completed mission score", async () => {
    const gateway = createGateway();

    await expect(
      submitCompletedMission(
        { seed: 7, missionIndex: 9, difficulty: "avanzado", score: 150.9, timeLeft: 320 },
        gateway,
      ),
    ).resolves.toBe(true);

    expect(gateway.insertMissionScore).toHaveBeenCalledWith({
      userId: "user-123",
      score: 150,
      difficulty: "avanzado",
      missionsCompleted: 5,
      durationSeconds: 0,
    });
  });

  it("propagates a failed repository result without throwing", async () => {
    const gateway = createGateway();
    vi.mocked(gateway.insertMissionScore).mockResolvedValue(false);

    await expect(
      submitCompletedMission(
        { seed: 7, missionIndex: 1, difficulty: "facil", score: -20, timeLeft: 120 },
        gateway,
      ),
    ).resolves.toBe(false);

    expect(gateway.insertMissionScore).toHaveBeenCalledWith({
      userId: "user-123",
      score: 0,
      difficulty: "facil",
      missionsCompleted: 2,
      durationSeconds: 180,
    });
  });
});
