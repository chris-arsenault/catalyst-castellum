/* global console, process */
import { performance } from "node:perf_hooks";
import { roomRenderModel } from "../src/components/gameMap/roomRenderModel";
import { DEFAULT_GAME_RUNTIME } from "../src/game/runtime";
import { primaryReferenceBuildFor } from "../src/game/content/playtestPortfolios";
import { cloneGame } from "../src/game/engine/gameState";
import { decodeGame, encodeGame } from "../src/game/save";
import type { GameCommand, GameState } from "../src/game/types";
import { roomAnalysis } from "../src/presentation/selectors";
import { roomState } from "../src/game/world/instances";

interface Measurement {
  averageMs: number;
  iterations: number;
  totalMs: number;
}

interface PerformanceBaseline {
  scenario: string;
  simulatedTicks: number;
  simulatedSeconds: number;
  enemies: number;
  towers: number;
  saveBytes: number;
  clone: Measurement;
  fixedStep: Measurement;
  encode: Measurement;
  decode: Measurement;
  cachedRoomAnalysis: Measurement;
  roomProjection: Measurement;
}

const measure = (iterations: number, operation: () => void): Measurement => {
  for (let index = 0; index < Math.min(10, iterations); index += 1) operation();
  const start = performance.now();
  for (let index = 0; index < iterations; index += 1) operation();
  const totalMs = performance.now() - start;
  return { averageMs: totalMs / iterations, iterations, totalMs };
};

const setupCommand = (state: GameState, command: GameCommand): GameState => {
  const result = DEFAULT_GAME_RUNTIME.execute(state, command);
  if (!result.accepted)
    throw new Error(`Performance setup ${command.type} rejected: ${result.code}`);
  return result.state;
};

const representativeState = (): GameState => {
  const runtime = DEFAULT_GAME_RUNTIME;
  let state = setupCommand(runtime.createScenario("morrow_pocket"), {
    type: "begin_level",
  });
  for (const command of primaryReferenceBuildFor("morrow_pocket").rounds[0]!.commands) {
    state = setupCommand(state, command);
  }
  state = setupCommand(state, { type: "start_assault" });
  state = runtime.advanceTicks(state, 80);
  if (
    state.encounter.tick !== 80 ||
    Math.abs(state.encounter.phaseTime - 8) > 1e-8 ||
    state.phase !== "assault"
  )
    throw new Error("Performance fixture must reach exactly 80 live assault ticks.");
  if (state.encounter.enemies.length === 0 || Object.keys(state.encounter.towers).length === 0)
    throw new Error("Performance fixture requires active enemies and installed towers.");
  return state;
};

const baseline = (): PerformanceBaseline => {
  const state = representativeState();
  const encoded = encodeGame(state);
  if (!decodeGame(encoded))
    throw new Error("Performance fixture must round-trip through the current save.");
  return {
    scenario: "morrow_pocket after 8 simulated assault seconds",
    simulatedTicks: state.encounter.tick,
    simulatedSeconds: state.encounter.phaseTime,
    enemies: state.encounter.enemies.length,
    towers: Object.keys(state.encounter.towers).length,
    saveBytes: Buffer.byteLength(encoded, "utf8"),
    clone: measure(200, () => {
      cloneGame(state);
    }),
    fixedStep: measure(200, () => {
      DEFAULT_GAME_RUNTIME.advanceTicks(state, 1);
    }),
    encode: measure(100, () => {
      encodeGame(state);
    }),
    decode: measure(100, () => {
      decodeGame(encoded);
    }),
    cachedRoomAnalysis: measure(5_000, () => {
      roomAnalysis(roomState(state.encounter, "furnace"), state.encounter);
    }),
    roomProjection: measure(1_000, () => {
      roomRenderModel(state, "furnace", true, 1);
    }),
  };
};

const assertBudget = (result: PerformanceBaseline): void => {
  const failures = [
    result.saveBytes > 2_000_000 ? `save size ${result.saveBytes} > 2 MB` : null,
    result.clone.averageMs > 10 ? `clone ${result.clone.averageMs.toFixed(2)} ms > 10 ms` : null,
    result.fixedStep.averageMs > 50
      ? `fixed step ${result.fixedStep.averageMs.toFixed(2)} ms > 50 ms`
      : null,
    result.encode.averageMs > 25 ? `encode ${result.encode.averageMs.toFixed(2)} ms > 25 ms` : null,
    result.decode.averageMs > 25 ? `decode ${result.decode.averageMs.toFixed(2)} ms > 25 ms` : null,
  ].filter((failure): failure is string => failure !== null);
  if (failures.length > 0) throw new Error(`Performance budget failed: ${failures.join("; ")}`);
};

try {
  const result = baseline();
  console.log(JSON.stringify(result, null, 2));
  if (process.argv.includes("--assert")) assertBudget(result);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
