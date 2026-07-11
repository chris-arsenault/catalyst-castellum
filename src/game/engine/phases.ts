import { MAX_CYCLES, MAX_ENERGY } from "../config";
import type { CycleReport, GameState } from "../types";
import { addEvent, makeStats } from "./events";

const makeReport = (state: GameState): CycleReport => {
  if (state.stats.breached === 0) {
    return {
      ...state.stats,
      cycle: state.cycle,
      headline: "Containment held",
      detail: `All ${state.stats.killed} hostiles were neutralized. Room contents will persist into the next cycle.`,
    };
  }
  return {
    ...state.stats,
    cycle: state.cycle,
    headline: `${state.stats.breached} breach${state.stats.breached === 1 ? "" : "es"} recorded`,
    detail: `The core lost ${state.stats.coreDamage}% integrity. Inspect the event trace and surviving room states before rebuilding.`,
  };
};

export const beginSettle = (state: GameState): void => {
  state.phase = "settle";
  state.phaseTime = 0;
  state.lastReport = makeReport(state);
  addEvent(
    state,
    state.stats.breached > 0 ? "warning" : "good",
    state.lastReport.headline,
    state.lastReport.detail
  );
};

const declareVictory = (state: GameState): void => {
  state.phase = "victory";
  state.phaseTime = 0;
  state.paused = false;
  addEvent(
    state,
    "good",
    "Base neutralized",
    `Five assault cycles survived with ${Math.round(state.coreIntegrity)}% core integrity.`
  );
};

export const advanceAfterSettle = (state: GameState): void => {
  if (state.cycle >= MAX_CYCLES) return declareVictory(state);
  state.cycle += 1;
  state.phase = "build";
  state.phaseTime = 0;
  state.buildPoints += 2;
  state.energy = MAX_ENERGY;
  state.cooldowns = {};
  state.stats = makeStats();
  state.spawnCursor = 0;
  state.enemies = [];
  addEvent(
    state,
    "info",
    `Build window — cycle ${state.cycle}`,
    "Two fabricator points added. Existing atmosphere, liquids, heat, and residue remain."
  );
};

export const declareDefeat = (state: GameState): void => {
  state.phase = "defeat";
  state.paused = false;
  state.lastReport = makeReport(state);
  addEvent(
    state,
    "danger",
    "Catalyst core lost",
    `The base failed during assault cycle ${state.cycle}.`,
    "core"
  );
};
