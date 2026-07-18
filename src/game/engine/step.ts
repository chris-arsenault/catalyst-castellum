import type { GameState } from "../types";
import type { GameDefinition } from "../definitionTypes";
import { moveEnemies, resolveEnemyCombat, spawnEnemies } from "./combat";
import { simulateInstalledEquipment } from "./equipment";
import { simulateNetworks } from "./flow";
import { beginAssault, completeAssault, declareDefeat } from "./phases";
import { simulateReactions } from "./reactions";
import { cloneGame } from "./roomState";
import { simulateStratification } from "./stratification";
import { roundDefinitionFor } from "./campaign";
import { phaseIsStatic } from "./phaseModel";
import { definitionForMap } from "../world/activeDefinition";
import { simulateEnemyBehaviors } from "./enemyBehaviors";

const finishAssaultStep = (state: GameState, dt: number, definition: GameDefinition): void => {
  moveEnemies(state, dt, definition);
  if (state.coreIntegrity <= 0) return declareDefeat(state);
  const waveComplete = state.spawnCursor >= roundDefinitionFor(state, definition).wave.length;
  if (waveComplete && state.enemies.length === 0) completeAssault(state, definition);
};

const stepMutable = (state: GameState, dt: number, definition: GameDefinition): void => {
  state.phaseTime += dt;
  state.elapsed += dt;
  simulateNetworks(state, dt, definition);
  simulateInstalledEquipment(state, dt, definition);
  simulateStratification(state, dt, definition);
  if (state.phase === "assault") spawnEnemies(state, definition);
  simulateEnemyBehaviors(state, dt, definition);
  const bursts = simulateReactions(state, dt, definition);
  resolveEnemyCombat(state, dt, bursts, definition);
  if (
    state.phase === "prime" &&
    state.phaseTime >= roundDefinitionFor(state, definition).primeSeconds
  ) {
    beginAssault(state, true);
    return;
  }
  if (state.phase === "assault") finishAssaultStep(state, dt, definition);
};

const shouldStep = (state: GameState, dt: number): boolean =>
  !state.paused && !phaseIsStatic(state.phase) && dt > 0;

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
