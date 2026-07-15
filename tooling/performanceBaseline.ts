/* global console, process */
import { performance } from "node:perf_hooks";
import { roomRenderModel } from "../src/components/gameMap/roomRenderModel";
import { DEFAULT_GAME_RUNTIME } from "../src/game/runtime";
import { LEVEL_PLAYTEST_PLANS } from "../src/game/content/playtestPlans";
import { cloneGame } from "../src/game/engine/roomState";
import { decodeGame, encodeGame } from "../src/game/save";
import type { GameState } from "../src/game/types";
import { roomAnalysis } from "../src/presentation/selectors";
import { roomState } from "../src/game/world/instances";

interface Measurement {
  averageMs: number;
  iterations: number;
  totalMs: number;
}

interface PerformanceBaseline {
  scenario: string;
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

const representativeState = (): GameState => {
  const runtime = DEFAULT_GAME_RUNTIME;
  let state = runtime.execute(runtime.createScenario("commissioning_exam"), {
    type: "begin_level",
  }).state;
  for (const command of LEVEL_PLAYTEST_PLANS.commissioning_exam.commands) {
    const result = runtime.execute(state, command);
    if (result.accepted) state = result.state;
  }
  state = runtime.execute(state, { type: "start_prime" }).state;
  return runtime.step(state, runtime.round(state).primeSeconds + 8);
};

const baseline = (): PerformanceBaseline => {
  const state = representativeState();
  const encoded = encodeGame(state);
  return {
    scenario: "commissioning_exam after prime plus 8 simulated seconds",
    saveBytes: Buffer.byteLength(encoded, "utf8"),
    clone: measure(200, () => {
      cloneGame(state);
    }),
    fixedStep: measure(200, () => {
      DEFAULT_GAME_RUNTIME.step(state, 0.1);
    }),
    encode: measure(100, () => {
      encodeGame(state);
    }),
    decode: measure(100, () => {
      decodeGame(encoded);
    }),
    cachedRoomAnalysis: measure(5_000, () => {
      roomAnalysis(roomState(state, "furnace"));
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
