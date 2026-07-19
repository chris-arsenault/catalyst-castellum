import { createScenarioGame, executeCommand } from "./simulation";
import type { GameState } from "./types";

export const createMorrowPocketGame = (): GameState => {
  const briefing = createScenarioGame("morrow_pocket");
  const result = executeCommand(briefing, { type: "begin_level" });
  if (!result.accepted) throw new Error(result.code ?? "Could not enter Morrow Pocket");
  return result.state;
};
