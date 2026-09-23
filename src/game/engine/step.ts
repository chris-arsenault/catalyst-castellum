import type { GameState } from "../types";
import type { GameDefinition } from "../definitionTypes";
import { completeAssault, declareDefeat } from "./phases";
import { cloneGame } from "./gameState";
import { campaignEncounterContext } from "./campaignEncounter";
import { createEncounterRuntime } from "../encounter/runtime";
import { tickEnvironmentalFields } from "./environmentalFields";

/** Browser time accumulation belongs to the application. This adapter accepts exact ticks. */
export const advanceGameTicks = (
  source: GameState,
  count: number,
  definition: GameDefinition
): GameState => {
  if (!Number.isSafeInteger(count) || count < 0)
    throw new RangeError("Tick count must be a nonnegative integer");
  if (source.phase !== "assault" || count === 0) return source;
  const state = cloneGame(source);
  const result = createEncounterRuntime(campaignEncounterContext(state, definition)).advanceTicks(
    state.encounter,
    count
  );
  if (!result.state.process) throw new Error("Campaign encounter lost its process state");
  state.encounter = { ...result.state, process: result.state.process };
  if (result.termination === "complete") completeAssault(state, definition);
  else if (result.termination) declareDefeat(state);
  return state;
};

export const stepGame = (
  source: GameState,
  seconds: number,
  definition: GameDefinition
): GameState => {
  const ticks = Math.round(seconds * 10);
  if (!Number.isFinite(seconds) || seconds < 0 || Math.abs(ticks / 10 - seconds) > 1e-8)
    throw new RangeError("Headless seconds must represent whole 0.1 second ticks");
  return advanceGameTicks(source, ticks, definition);
};

/** A cloned process-only forecast uses the same bridge order and never mutates the live encounter. */
export const projectOperationalState = (
  source: GameState,
  seconds: number,
  definition: GameDefinition
): GameState => {
  if (!Number.isFinite(seconds) || seconds < 0)
    throw new RangeError("Projection duration must be finite and nonnegative");
  const state = cloneGame(source);
  const context = campaignEncounterContext(state, definition);
  const ticks = Math.round(seconds * 10);
  for (let tick = 0; tick < ticks; tick += 1) {
    state.encounter.elapsed += 0.1;
    state.encounter.phaseTime += 0.1;
    tickEnvironmentalFields(state.encounter, 0.1);
    context.process.beforeSpawn(state.encounter, 0.1, context);
    context.process.afterTowers(state.encounter, 0.1, context);
  }
  return state;
};
