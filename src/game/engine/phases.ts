import { nextLevelId } from "../config";
import type { GameState, RoundReport } from "../types";
import { copyAvailability, levelDefinitionFor, roundDefinitionFor } from "./campaign";
import { addEvent, makeStats } from "./events";

const reportHeadline = (breaches: number): string => {
  if (breaches === 0) return "Containment held";
  const suffix = breaches === 1 ? "" : "es";
  return `${breaches} breach${suffix} recorded`;
};

const reportDetail = (state: GameState): string => {
  if (state.stats.breached === 0) {
    return `${state.stats.killed} hostiles yielded ${state.pendingMatter} matter. Every process inventory remains in place.`;
  }
  return `The core lost ${state.stats.coreDamage}% integrity. The exact process state is preserved for diagnosis.`;
};

const makeReport = (state: GameState): RoundReport => ({
  ...state.stats,
  levelId: state.campaign.levelId,
  round: state.campaign.roundIndex + 1,
  headline: reportHeadline(state.stats.breached),
  detail: reportDetail(state),
});

const bankRound = (state: GameState): RoundReport => {
  const report = makeReport(state);
  state.matter += state.pendingMatter;
  state.pendingMatter = 0;
  state.lastReport = report;
  state.phaseTime = 0;
  state.paused = false;
  state.enemies = [];
  addEvent(
    state,
    report.breached > 0 ? "warning" : "good",
    report.headline,
    `${report.detail} The simulation is frozen at its exact ending state.`
  );
  return report;
};

const completeCampaign = (state: GameState): void => {
  const level = levelDefinitionFor(state);
  if (!state.campaign.completedLevelIds.includes(level.id)) {
    state.campaign.completedLevelIds.push(level.id);
  }
  state.phase = "victory";
  addEvent(
    state,
    "good",
    "Castellum curriculum complete",
    `All ${state.campaign.completedLevelIds.length} checkpoints survived with ${Math.round(state.coreIntegrity)}% core integrity in the final exam.`
  );
};

export const completeAssault = (state: GameState): void => {
  bankRound(state);
  const level = levelDefinitionFor(state);
  const finalRound = state.campaign.roundIndex >= level.rounds.length - 1;
  if (!finalRound) {
    state.phase = "round_result";
    return;
  }
  if (nextLevelId(level.id)) {
    if (!state.campaign.completedLevelIds.includes(level.id)) {
      state.campaign.completedLevelIds.push(level.id);
    }
    state.phase = "level_complete";
    return;
  }
  completeCampaign(state);
};

export const beginAssault = (state: GameState, automatic: boolean): void => {
  state.phase = "assault";
  state.phaseTime = 0;
  state.spawnCursor = 0;
  state.enemies = [];
  state.paused = false;
  addEvent(
    state,
    "warning",
    `${automatic ? "Prime window elapsed" : "Early lock confirmed"} — round ${state.campaign.roundIndex + 1}`,
    "Configuration is locked until every hostile is neutralized or breaches the core."
  );
};

export const advanceRound = (state: GameState): void => {
  state.campaign.roundIndex += 1;
  const round = roundDefinitionFor(state);
  state.availability = copyAvailability(round.availability);
  state.phase = "build";
  state.phaseTime = 0;
  state.paused = false;
  state.stats = makeStats();
  state.spawnCursor = 0;
  state.enemies = [];
  addEvent(
    state,
    "info",
    `Round ${state.campaign.roundIndex + 1}: ${round.title}`,
    `${round.detail} New availability is now visible in the control room.`
  );
};

export const declareDefeat = (state: GameState): void => {
  state.lastReport = makeReport(state);
  state.phase = "defeat";
  state.phaseTime = 0;
  state.paused = false;
  addEvent(
    state,
    "danger",
    "Catalyst core lost",
    `${levelDefinitionFor(state).name}, round ${state.campaign.roundIndex + 1}, failed. The checkpoint can be retried from its original facility state.`,
    "core"
  );
};
