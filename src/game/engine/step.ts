import type { GamePhase, GameState } from "../types";
import { moveEnemies, resolveEnemyCombat, spawnEnemies } from "./combat";
import { simulateInstalledEquipment } from "./equipment";
import { simulateNetworks } from "./flow";
import { beginAssault, completeAssault, declareDefeat } from "./phases";
import { simulateReactions } from "./reactions";
import { cloneGame } from "./roomState";
import { simulateStratification } from "./stratification";
import { roundDefinitionFor } from "./campaign";

const STATIC_PHASES = new Set<GamePhase>([
  "level_briefing",
  "build",
  "round_result",
  "level_complete",
  "victory",
  "defeat",
]);

const finishAssaultStep = (state: GameState, dt: number): void => {
  moveEnemies(state, dt);
  if (state.coreIntegrity <= 0) return declareDefeat(state);
  const waveComplete = state.spawnCursor >= roundDefinitionFor(state).wave.length;
  if (waveComplete && state.enemies.length === 0) completeAssault(state);
};

const stepMutable = (state: GameState, dt: number): void => {
  state.phaseTime += dt;
  state.elapsed += dt;
  simulateNetworks(state, dt);
  simulateInstalledEquipment(state, dt);
  simulateStratification(state, dt);
  if (state.phase === "assault") spawnEnemies(state);
  const bursts = simulateReactions(state, dt);
  resolveEnemyCombat(state, dt, bursts);
  if (state.phase === "prime" && state.phaseTime >= roundDefinitionFor(state).primeSeconds) {
    beginAssault(state, true);
    return;
  }
  if (state.phase === "assault") finishAssaultStep(state, dt);
};

const shouldStep = (state: GameState, dt: number): boolean =>
  !state.paused && !STATIC_PHASES.has(state.phase) && dt > 0;

export const stepGame = (source: GameState, realDt: number): GameState => {
  if (!shouldStep(source, realDt)) return source;
  const state = cloneGame(source);
  let remaining = Math.min(realDt * source.speed, 2);
  while (remaining > 0) {
    const dt = Math.min(remaining, 0.1);
    stepMutable(state, dt);
    remaining -= dt;
    if (STATIC_PHASES.has(state.phase)) break;
  }
  return state;
};
