import type { GameDefinition } from "../definitionTypes";
import type { GameState, RoundReport } from "../types";
import {
  copyAvailability,
  levelDefinitionFor,
  nextLevelIdFor,
  roundDefinitionFor,
} from "./campaign";
import { addEvent, makeStats } from "./events";
import { transitionPhase } from "./phaseModel";

const makeReport = (state: GameState): RoundReport => ({
  ...state.stats,
  levelId: state.campaign.levelId,
  round: state.campaign.roundIndex + 1,
});

const bankRound = (state: GameState): RoundReport => {
  const report = makeReport(state);
  state.matter += state.pendingMatter;
  state.pendingMatter = 0;
  state.lastReport = report;
  state.phaseTime = 0;
  state.paused = false;
  state.enemies = [];
  addEvent(state, report.breached > 0 ? "warning" : "good", "round_completed", {
    breached: report.breached,
    killed: report.killed,
    coreDamage: report.coreDamage,
    matterHarvested: report.matterHarvested,
  });
  return report;
};

const completeCampaign = (state: GameState, definition: GameDefinition): void => {
  const level = levelDefinitionFor(state, definition);
  if (!state.campaign.completedLevelIds.includes(level.id)) {
    state.campaign.completedLevelIds.push(level.id);
  }
  transitionPhase(state, "victory");
  state.run.outcome = "victorious";
  addEvent(state, "good", "campaign_completed", {
    completedLevels: state.campaign.completedLevelIds.length,
    coreIntegrity: Math.round(state.coreIntegrity),
  });
};

export const completeAssault = (state: GameState, definition: GameDefinition): void => {
  bankRound(state);
  const level = levelDefinitionFor(state, definition);
  const finalRound = state.campaign.roundIndex >= level.rounds.length - 1;
  if (!finalRound) {
    transitionPhase(state, "round_result");
    return;
  }
  if (nextLevelIdFor(level.id, definition)) {
    if (!state.campaign.completedLevelIds.includes(level.id)) {
      state.campaign.completedLevelIds.push(level.id);
    }
    transitionPhase(state, "level_complete");
    return;
  }
  completeCampaign(state, definition);
};

export const beginAssault = (state: GameState, automatic: boolean): void => {
  transitionPhase(state, "assault");
  state.spawnCursor = 0;
  state.enemies = [];
  addEvent(state, "warning", "assault_started", { automatic });
};

export const advanceRound = (state: GameState, definition: GameDefinition): void => {
  state.campaign.roundIndex += 1;
  const round = roundDefinitionFor(state, definition);
  state.availability = copyAvailability(round.availability);
  transitionPhase(state, "build");
  state.stats = makeStats();
  state.spawnCursor = 0;
  state.enemies = [];
  addEvent(state, "info", "round_advanced");
};

export const declareDefeat = (state: GameState): void => {
  state.lastReport = makeReport(state);
  transitionPhase(state, "defeat");
  state.run.outcome = "defeated";
  addEvent(state, "danger", "scenario_defeated", {}, "core");
};
