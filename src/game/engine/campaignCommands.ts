import { nextLevelId } from "../config";
import type { CommandResult, GameState } from "../types";
import { levelDefinitionFor, roundDefinitionFor } from "./campaign";
import { addEvent } from "./events";
import { advanceRound } from "./phases";
import { cloneGame } from "./roomState";
import { createScenarioGame } from "./scenarioState";

const reject = (state: GameState, reason: string): CommandResult => ({
  state,
  accepted: false,
  reason,
});

const accept = (state: GameState): CommandResult => ({ state, accepted: true, reason: null });

export const beginLevelCommand = (source: GameState): CommandResult => {
  if (source.phase !== "level_briefing")
    return reject(source, "This checkpoint briefing has already been acknowledged.");
  const state = cloneGame(source);
  state.phase = "build";
  state.phaseTime = 0;
  addEvent(
    state,
    "info",
    `${levelDefinitionFor(state).name} planning unlocked`,
    roundDefinitionFor(state).objective
  );
  return accept(state);
};

export const skipTutorialCommand = (source: GameState): CommandResult => {
  if (source.phase !== "level_briefing" || source.campaign.levelId !== "flash_point") {
    return reject(source, "The opening tutorial can only be skipped from its first briefing.");
  }
  const completedLevelIds = [
    ...new Set([...source.campaign.completedLevelIds, "flash_point"]),
  ] as GameState["campaign"]["completedLevelIds"];
  return beginLevelCommand(createScenarioGame("make_the_reagent", completedLevelIds));
};

export const continueRoundCommand = (source: GameState): CommandResult => {
  if (source.phase !== "round_result")
    return reject(source, "There is no completed round to continue from.");
  const state = cloneGame(source);
  advanceRound(state);
  return accept(state);
};

export const startNextLevelCommand = (source: GameState): CommandResult => {
  if (source.phase !== "level_complete")
    return reject(source, "Complete the current checkpoint before advancing.");
  const next = nextLevelId(source.campaign.levelId);
  if (!next) return reject(source, "The campaign is already complete.");
  return accept(createScenarioGame(next, source.campaign.completedLevelIds));
};

export const retryLevelCommand = (source: GameState): CommandResult => {
  if (source.phase !== "defeat") return reject(source, "Retry is available only after defeat.");
  return accept(
    createScenarioGame(source.campaign.checkpointLevelId, source.campaign.completedLevelIds)
  );
};
