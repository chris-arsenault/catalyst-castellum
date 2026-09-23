import { z } from "zod";
import {
  createCatalystExerciseRuntime,
  type ExerciseState,
  type ExerciseRuntime,
} from "../src/game/exercise";
import type { CommandDecision } from "../src/game/types";
import { encounterToolCommandSchema } from "./encounterArtifact";

export const exerciseCommandsSchema = z.array(
  z.strictObject({
    waveIndex: z.number().int().nonnegative(),
    tick: z.number().int().nonnegative(),
    sequence: z.number().int().nonnegative(),
    command: encounterToolCommandSchema,
  })
);
export type ExerciseScheduledCommand = z.infer<typeof exerciseCommandsSchema>[number];
export interface ExerciseRunOptions {
  ticks: number;
  observer: "summary" | "trace";
  traceLimit: number;
}
const compare = (left: ExerciseScheduledCommand, right: ExerciseScheduledCommand): number =>
  left.waveIndex - right.waveIndex || left.tick - right.tick || left.sequence - right.sequence;
const assertCommands = (commands: readonly ExerciseScheduledCommand[], waves: number): void => {
  for (const [index, input] of commands.entries()) {
    if (input.waveIndex >= waves || (index > 0 && compare(commands[index - 1]!, input) >= 0))
      throw new Error(
        "Exercise commands require strictly increasing wave, tick, and sequence order."
      );
  }
};
const consumed = (state: ExerciseState, input: ExerciseScheduledCommand): boolean =>
  input.waveIndex < state.waveIndex ||
  (input.waveIndex === state.waveIndex &&
    (input.tick < state.encounter.tick ||
      (input.tick === state.encounter.commandCursor.tick &&
        input.sequence <= state.encounter.commandCursor.sequence)));

const assertOptions = (options: ExerciseRunOptions): void => {
  if (
    !Number.isSafeInteger(options.ticks) ||
    options.ticks < 0 ||
    !Number.isSafeInteger(options.traceLimit) ||
    options.traceLimit < 0
  )
    throw new Error("Ticks and trace limit require nonnegative integers.");
};
interface RunRecords {
  cursor: number;
  decisions: { input: ExerciseScheduledCommand; decision: CommandDecision }[];
  trace: unknown[];
  traceDropped: number;
}
const executeDue = (
  runtime: ExerciseRuntime,
  source: ExerciseState,
  pending: readonly ExerciseScheduledCommand[],
  records: RunRecords
): ExerciseState => {
  let state = source;
  while (
    pending[records.cursor]?.waveIndex === state.waveIndex &&
    pending[records.cursor]!.tick === state.encounter.tick
  ) {
    const input = pending[records.cursor++]!;
    const result = runtime.executeOrdered(state, input);
    state = result.state;
    records.decisions.push({ input, decision: result.decision });
  }
  return state;
};
const observe = (
  state: ExerciseState,
  before: number,
  options: ExerciseRunOptions,
  records: RunRecords
): void => {
  if (options.observer !== "trace") return;
  const observations = state.encounter.events.filter((event) => event.id >= before).reverse();
  const room = Math.max(0, options.traceLimit - records.trace.length);
  records.trace.push(...structuredClone(observations.slice(0, room)));
  records.traceDropped += Math.max(0, observations.length - room);
};

const loadInitial = (runtime: ExerciseRuntime, snapshot: string | null): ExerciseState => {
  const state = snapshot === null ? runtime.create() : runtime.load(snapshot);
  if (!state) throw new Error("Exercise snapshot is incompatible or invalid.");
  return state;
};
const termination = (state: ExerciseState) => state.encounter.result?.termination ?? "tick_limit";

export const runExercise = (
  commands: readonly ExerciseScheduledCommand[] | null,
  options: ExerciseRunOptions,
  snapshot: string | null = null
) => {
  assertOptions(options);
  const runtime = createCatalystExerciseRuntime();
  let state = loadInitial(runtime, snapshot);
  const scheduled =
    commands ??
    runtime.definition.waves.map((_, waveIndex) => ({
      waveIndex,
      tick: 0,
      sequence: 0,
      command: { type: "start_assault" as const },
    }));
  assertCommands(scheduled, runtime.definition.waves.length);
  const pending = scheduled.filter((input) => !consumed(state!, input));
  const records: RunRecords = { cursor: 0, decisions: [], trace: [], traceDropped: 0 };
  const skipped: ExerciseScheduledCommand[] = [];
  let ticksAdvanced = 0;
  while (ticksAdvanced < options.ticks) {
    if (state.encounter.result) {
      if (
        state.encounter.result.termination !== "complete" ||
        state.waveIndex + 1 >= runtime.definition.waves.length
      )
        break;
      state = runtime.execute(state, { type: "continue_wave" }).state;
      while (pending[records.cursor] && pending[records.cursor]!.waveIndex < state.waveIndex)
        skipped.push(pending[records.cursor++]!);
    }
    state = executeDue(runtime, state, pending, records);
    const before = state.encounter.nextEventId;
    state = runtime.advanceTicks(state, 1);
    ticksAdvanced += 1;
    observe(state, before, options, records);
  }
  return {
    format: "catalyst-exercise-run" as const,
    version: 1 as const,
    scheduledCommands: scheduled,
    finalSnapshot: runtime.save(state),
    ticksAdvanced,
    waveIndex: state.waveIndex,
    termination: termination(state),
    reports: state.reports,
    current: {
      tick: state.encounter.tick,
      phase: state.encounter.phase,
      coreIntegrity: state.encounter.coreIntegrity,
      matter: state.encounter.matter,
      stats: state.encounter.stats,
      catalyst: state.encounter.catalyst,
    },
    commands: records.decisions,
    skippedCommands: skipped,
    unexecutedCommands: pending.slice(records.cursor),
    trace: records.trace,
    traceDropped: records.traceDropped,
  };
};
