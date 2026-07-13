import { DEFAULT_GAME_DEFINITION, type GameDefinition } from "../definition";
import type { CommandResult, GameState } from "../types";
import { acceptCommand } from "./commandResult";
import { addEvent } from "./events";
import { advanceRound } from "./phases";
import { cloneGame } from "./roomState";
import { createScenarioGame } from "./scenarioState";
import { nextLevelIdFor } from "./campaign";
import { transitionPhase } from "./phaseModel";

export const beginLevelCommand = (source: GameState): CommandResult => {
  const state = cloneGame(source);
  transitionPhase(state, "build");
  addEvent(state, "info", "level_planning_started");
  return acceptCommand(state);
};

export const skipTutorialCommand = (
  source: GameState,
  definition: GameDefinition = DEFAULT_GAME_DEFINITION
): CommandResult => {
  const completedLevelIds = [
    ...new Set([...source.campaign.completedLevelIds, "flash_point"]),
  ] as GameState["campaign"]["completedLevelIds"];
  return beginLevelCommand(createScenarioGame("make_the_reagent", completedLevelIds, definition));
};

export const continueRoundCommand = (
  source: GameState,
  definition: GameDefinition = DEFAULT_GAME_DEFINITION
): CommandResult => {
  const state = cloneGame(source);
  advanceRound(state, definition);
  return acceptCommand(state);
};

export const startNextLevelCommand = (
  source: GameState,
  definition: GameDefinition = DEFAULT_GAME_DEFINITION
): CommandResult => {
  const next = nextLevelIdFor(source.campaign.levelId, definition);
  if (!next) throw new Error("Next-level command was applied after campaign completion.");
  return acceptCommand(createScenarioGame(next, source.campaign.completedLevelIds, definition));
};

export const retryLevelCommand = (
  source: GameState,
  definition: GameDefinition = DEFAULT_GAME_DEFINITION
): CommandResult => {
  return acceptCommand(
    createScenarioGame(
      source.campaign.checkpointLevelId,
      source.campaign.completedLevelIds,
      definition
    )
  );
};
