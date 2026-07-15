import type { GameDefinition } from "../definitionTypes";
import type { CommandResult, GameState } from "../types";
import { acceptCommand } from "./commandResult";
import { addEvent } from "./events";
import { advanceRound } from "./phases";
import { cloneGame } from "./roomState";
import { createScenarioGame } from "./scenarioState";
import { nextLevelIdFor } from "./campaign";
import { extractHullFragment } from "../world/hullFragment";
import { authoredSiteSpec, produceAuthoredSite } from "../world/producer";
import { transitionPhase } from "./phaseModel";

export const beginLevelCommand = (source: GameState): CommandResult => {
  const state = cloneGame(source);
  transitionPhase(state, "build");
  addEvent(state, "info", "level_planning_started");
  return acceptCommand(state);
};

export const skipTutorialCommand = (
  source: GameState,
  definition: GameDefinition
): CommandResult => {
  const completedLevelIds = [
    ...new Set([...source.campaign.completedLevelIds, "flash_point"]),
  ] as GameState["campaign"]["completedLevelIds"];
  return beginLevelCommand(createScenarioGame("make_the_reagent", completedLevelIds, definition));
};

export const continueRoundCommand = (
  source: GameState,
  definition: GameDefinition
): CommandResult => {
  const state = cloneGame(source);
  advanceRound(state, definition);
  return acceptCommand(state);
};

/** Leaving a cleared site: the castellum is underway until it docks. */
export const startNextLevelCommand = (
  source: GameState,
  definition: GameDefinition
): CommandResult => {
  const next = nextLevelIdFor(source.campaign.levelId, definition);
  if (!next) throw new Error("Next-level command was applied after campaign completion.");
  const state = cloneGame(source);
  transitionPhase(state, "travel");
  addEvent(state, "info", "travel_started");
  return acceptCommand(state);
};

/** Docking runs the producer over the next site with the traveling hull. */
export const dockAtSiteCommand = (source: GameState, definition: GameDefinition): CommandResult => {
  const next = nextLevelIdFor(source.campaign.levelId, definition);
  if (!next) throw new Error("Dock command was applied after campaign completion.");
  const hull = extractHullFragment(source);
  const site = produceAuthoredSite(authoredSiteSpec(definition, next), hull);
  return acceptCommand(
    createScenarioGame(next, source.campaign.completedLevelIds, definition, site)
  );
};

export const retryLevelCommand = (source: GameState, definition: GameDefinition): CommandResult => {
  return acceptCommand(
    createScenarioGame(
      source.campaign.checkpointLevelId,
      source.campaign.completedLevelIds,
      definition
    )
  );
};
