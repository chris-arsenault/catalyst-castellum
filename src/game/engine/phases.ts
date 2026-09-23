import type { GameDefinition } from "../definitionTypes";
import type { GameState } from "../types";
import {
  copyAvailability,
  levelDefinitionFor,
  nextLevelIdFor,
  roundDefinitionFor,
} from "./campaign";
import { addEvent, makeStats } from "./events";
import { transitionPhase } from "./phaseModel";
import { campaignEncounterDefinition } from "./campaignEncounter";

/** Settlement is idempotent across repeated adapter calls and save/load. */
export const completeAssault = (state: GameState, definition: GameDefinition): void => {
  const result = state.encounter.result;
  if (!result || result.termination !== "complete")
    throw new Error("Cannot settle an unfinished encounter");
  if (state.campaign.settledEncounterIds.includes(result.encounterId)) return;
  state.campaign.settledEncounterIds.push(result.encounterId);
  state.encounter.matter += result.pendingMatter;
  state.encounter.pendingMatter = 0;
  const report = result.report;
  addEvent(state, report.breached > 0 ? "warning" : "good", "round_completed", {
    breached: report.breached,
    killed: report.killed,
    coreDamage: report.coreDamage,
    matterHarvested: report.matterHarvested,
  });
  const level = levelDefinitionFor(state, definition);
  if (state.campaign.roundIndex < level.rounds.length - 1) {
    transitionPhase(state, "round_result");
    return;
  }
  if (!state.campaign.completedLevelIds.includes(level.id))
    state.campaign.completedLevelIds.push(level.id);
  if (nextLevelIdFor(level.id, definition)) {
    transitionPhase(state, "level_complete");
    return;
  }
  transitionPhase(state, "victory");
  addEvent(state, "good", "campaign_completed", {
    completedLevels: state.campaign.completedLevelIds.length,
    coreIntegrity: Math.round(state.encounter.coreIntegrity),
  });
};

export const advanceRound = (state: GameState, definition: GameDefinition): void => {
  state.campaign.roundIndex += 1;
  state.campaign.operationCheckpoint = null;
  const round = roundDefinitionFor(state, definition);
  const encounter = state.encounter;
  const next = campaignEncounterDefinition(
    definition,
    levelDefinitionFor(state, definition),
    state.campaign.roundIndex,
    encounter.map
  );
  encounter.definition.id = next.id;
  encounter.definition.contentVersion = next.contentVersion;
  encounter.availability = copyAvailability(round.availability);
  encounter.phase = "build";
  encounter.tick = 0;
  encounter.commandCursor = { tick: 0, sequence: -1 };
  encounter.result = null;
  encounter.stats = makeStats();
  encounter.spawnCursor = 0;
  encounter.enemies = [];
  encounter.towerAttacks = [];
  encounter.incidents = [];
  transitionPhase(state, "build");
  addEvent(state, "info", "round_advanced");
};

export const declareDefeat = (state: GameState): void => {
  transitionPhase(state, "defeat");
  addEvent(state, "danger", "scenario_defeated", {}, "core");
};
