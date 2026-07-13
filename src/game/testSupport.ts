import { createScenarioGame, executeCommand } from "./simulation";
import type { GameState } from "./types";

export const createCommissioningGame = (): GameState => {
  const briefing = createScenarioGame("commissioning_exam");
  const result = executeCommand(briefing, { type: "begin_level" });
  if (!result.accepted) throw new Error(result.reason ?? "Could not enter commissioning scenario");
  return result.state;
};
