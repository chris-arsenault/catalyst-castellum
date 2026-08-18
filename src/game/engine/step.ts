import type { GameState } from "../types";
import type { GameDefinition } from "../definitionTypes";
import { moveEnemies, resolveEnemyCombat, spawnEnemies } from "./combat";
import { simulateInstalledEquipment } from "./equipment";
import { simulateNetworks } from "./flow";
import { completeAssault, declareDefeat } from "./phases";
import { simulateReactions } from "./reactions";
import { cloneGame } from "./roomState";
import { simulateStratification } from "./stratification";
import { roundDefinitionFor } from "./campaign";
import { phaseIsStatic } from "./phaseModel";
import { definitionForMap } from "../world/activeDefinition";
import { simulateEnemyBehaviors } from "./enemyBehaviors";
import { simulateTowers } from "./towerCombat";
import { serviceTowerSupplies } from "./towerSupply";
import { tickEnvironmentalFields } from "./environmentalFields";

const finishAssaultStep = (state: GameState, dt: number, definition: GameDefinition): void => {
  moveEnemies(state, dt, definition);
  if (state.coreIntegrity <= 0) return declareDefeat(state);
  const waveComplete = state.spawnCursor >= roundDefinitionFor(state, definition).wave.length;
  if (waveComplete && state.enemies.length === 0) completeAssault(state, definition);
};

const stepMutable = (state: GameState, dt: number, definition: GameDefinition): void => {
  state.phaseTime += dt;
  state.elapsed += dt;
  tickEnvironmentalFields(state, dt);
  simulateNetworks(state, dt, definition);
  simulateInstalledEquipment(state, dt, definition);
  serviceTowerSupplies(state, dt, definition);
  simulateStratification(state, dt, definition);
  if (state.phase === "assault") spawnEnemies(state, definition);
  simulateEnemyBehaviors(state, dt, definition);
  if (state.phase === "assault") simulateTowers(state, dt, definition);
  const bursts = simulateReactions(state, dt, definition);
  resolveEnemyCombat(state, dt, bursts, definition);
  if (state.phase === "assault") finishAssaultStep(state, dt, definition);
};

const shouldStep = (state: GameState, dt: number): boolean =>
  !state.paused && !phaseIsStatic(state.phase) && dt > 0;

/** Advances transport and chemistry for a read-only defense projection, without spawning a wave. */
export const projectOperationalState = (
  source: GameState,
  realDt: number,
  definition: GameDefinition
): GameState => {
  const state = cloneGame(source);
  const activeDefinition = definitionForMap(definition, state.map);
  let remaining = Math.max(0, realDt);
  while (remaining > 0) {
    const dt = Math.min(remaining, 0.1);
    state.phaseTime += dt;
    state.elapsed += dt;
    tickEnvironmentalFields(state, dt);
    simulateNetworks(state, dt, activeDefinition);
    simulateInstalledEquipment(state, dt, activeDefinition);
    serviceTowerSupplies(state, dt, activeDefinition);
    simulateStratification(state, dt, activeDefinition);
    simulateReactions(state, dt, activeDefinition);
    remaining -= dt;
  }
  return state;
};

export const stepGame = (
  source: GameState,
  realDt: number,
  definition: GameDefinition
): GameState => {
  if (!shouldStep(source, realDt)) return source;
  const state = cloneGame(source);
  const activeDefinition = definitionForMap(definition, state.map);
  let remaining = Math.min(realDt * source.speed, 2);
  while (remaining > 0) {
    const dt = Math.min(remaining, 0.1);
    stepMutable(state, dt, activeDefinition);
    remaining -= dt;
    if (phaseIsStatic(state.phase)) break;
  }
  return state;
};
