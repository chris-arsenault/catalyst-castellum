import type { GameDefinition } from "../definitionTypes";
import type { CommandResult, GameState } from "../types";
import { acceptCommand } from "./commandResult";
import { addEvent } from "./events";
import { advanceRound } from "./phases";
import { cloneGame } from "./roomState";
import { createScenarioGame } from "./scenarioState";
import { nextLevelIdFor } from "./campaign";
import { extractHullFragment } from "../world/hullFragment";
import { materializeLevelSite } from "../world/siteMaterialization";
import { transitionPhase } from "./phaseModel";
import { restoreOperationCheckpoint } from "../persistence/operationCheckpoint";

const recoverSiteTowers = (state: GameState, definition: GameDefinition): void => {
  for (const [towerId, tower] of Object.entries(state.towers)) {
    if (tower.provenance !== "site") continue;
    state.matter += Math.floor(
      tower.totalMatterSpent * definition.towers[tower.chassisId].recoveryRatio
    );
    delete state.towers[towerId];
    delete state.towerSupply[towerId];
  }
};

export const beginLevelCommand = (source: GameState): CommandResult => {
  const state = cloneGame(source);
  transitionPhase(state, "build");
  addEvent(state, "info", "level_planning_started");
  return acceptCommand(state);
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
  recoverSiteTowers(state, definition);
  state.campaign.operationCheckpoint = null;
  transitionPhase(state, "travel");
  addEvent(state, "info", "travel_started");
  return acceptCommand(state);
};

/** Docking joins the next authored site to the traveling hull. */
export const dockAtSiteCommand = (source: GameState, definition: GameDefinition): CommandResult => {
  const next = nextLevelIdFor(source.campaign.levelId, definition);
  if (!next) throw new Error("Dock command was applied after campaign completion.");
  const hull = extractHullFragment(source);
  const site = materializeLevelSite(definition, next, hull);
  return acceptCommand(
    createScenarioGame(next, source.campaign.completedLevelIds, definition, site, {
      matter: source.matter,
      coreIntegrity: source.coreIntegrity,
      retryCount: source.campaign.retryCount,
    })
  );
};

export const retryLevelCommand = (source: GameState, definition: GameDefinition): CommandResult => {
  const checkpoint = source.campaign.operationCheckpoint;
  if (!checkpoint) throw new Error("Retry command was applied without an operation checkpoint.");
  const restored = restoreOperationCheckpoint(checkpoint, definition);
  if (!restored) throw new Error("Operation checkpoint failed save validation.");
  restored.campaign.operationCheckpoint = checkpoint;
  restored.campaign.retryCount = source.campaign.retryCount + 1;
  return acceptCommand(restored);
};
