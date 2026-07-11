import { MAX_ENERGY, SETTLE_DURATION, WAVES } from "../config";
import type { GamePhase, GameState } from "../types";
import { simulateEnemies, spawnEnemies } from "./combat";
import { simulateFlow, simulateReactions } from "./environment";
import { advanceAfterSettle, beginSettle, declareDefeat } from "./phases";
import { cloneGame } from "./roomState";

const STATIC_PHASES = new Set<GamePhase>(["build", "victory", "defeat"]);

const updateCooldowns = (state: GameState, dt: number): void => {
  for (const key of Object.keys(state.cooldowns)) {
    const remaining = Math.max(0, (state.cooldowns[key] ?? 0) - dt);
    if (remaining <= 0) delete state.cooldowns[key];
    else state.cooldowns[key] = remaining;
  }
};

const stepAssault = (state: GameState, dt: number): void => {
  spawnEnemies(state);
  simulateEnemies(state, dt);
  if (state.coreIntegrity <= 0) return declareDefeat(state);
  const waveComplete = state.spawnCursor >= (WAVES[state.cycle]?.length ?? 0);
  if (waveComplete && state.enemies.length === 0) beginSettle(state);
};

const stepMutable = (state: GameState, dt: number): void => {
  state.phaseTime += dt;
  state.elapsed += dt;
  state.energy = Math.min(MAX_ENERGY, state.energy + 6.5 * dt);
  updateCooldowns(state, dt);
  simulateFlow(state, dt);
  simulateReactions(state, dt);
  if (state.phase === "assault") stepAssault(state, dt);
  else if (state.phase === "settle" && state.phaseTime >= SETTLE_DURATION) {
    advanceAfterSettle(state);
  }
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
