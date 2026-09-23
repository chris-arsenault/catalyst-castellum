import { createEncounter } from "./create";
import { cloneEncounter } from "./clone";
import { createEncounterRuntime } from "./runtime";
import { validateCommandStream } from "./commands";
import type {
  EncounterCommandRecord,
  EncounterContext,
  EncounterEvent,
  EncounterState,
  OrderedEncounterCommand,
} from "./types";

export type EncounterObserverMode = "off" | "summary" | "trace";
export interface EncounterRunOptions {
  ticks: number;
  batchSize: number;
  observer: EncounterObserverMode;
  traceLimit: number;
}
export const DEFAULT_ENCOUNTER_RUN_OPTIONS: EncounterRunOptions = {
  ticks: 300,
  batchSize: 50,
  observer: "summary",
  traceLimit: 200,
};

export const pendingEncounterCommands = (
  state: EncounterState,
  commands: readonly OrderedEncounterCommand[]
): OrderedEncounterCommand[] =>
  commands.filter(
    (input) =>
      input.tick > state.tick ||
      (input.tick === state.tick &&
        (state.commandCursor.tick < input.tick || input.sequence > state.commandCursor.sequence))
  );

const assertRunOptions = (options: EncounterRunOptions): void => {
  if (
    !Number.isSafeInteger(options.ticks) ||
    options.ticks < 0 ||
    !Number.isSafeInteger(options.batchSize) ||
    options.batchSize <= 0 ||
    !Number.isSafeInteger(options.traceLimit) ||
    options.traceLimit < 0
  )
    throw new RangeError(
      "Run ticks and trace limit must be nonnegative integers; batch size must be positive."
    );
};

export const encounterRunSummary = (
  state: EncounterState,
  commands: readonly EncounterCommandRecord[]
) => ({
  termination: state.result?.termination ?? "tick_limit",
  tick: state.tick,
  coreIntegrity: state.coreIntegrity,
  matter: state.matter,
  pendingMatter: state.pendingMatter,
  matterInvested: Object.values(state.towers).reduce(
    (sum, tower) => sum + tower.totalMatterSpent,
    0
  ),
  spawned: state.stats.spawned,
  killed: state.stats.killed,
  breached: state.stats.breached,
  damage: state.stats.damageDealt,
  damageBySource: { ...state.stats.damageBySource },
  rejectedCommands: commands.filter((record) => !record.decision.allowed).length,
});

/** Each scheduled input executes once. Observer copies never participate in simulation. */
export const runEncounter = (
  context: EncounterContext,
  commands: readonly OrderedEncounterCommand[],
  options: EncounterRunOptions = DEFAULT_ENCOUNTER_RUN_OPTIONS,
  snapshot: EncounterState | null = null
) => {
  assertRunOptions(options);
  const runtime = createEncounterRuntime(context);
  let state = snapshot
    ? cloneEncounter(snapshot)
    : createEncounter(context.combat, context.definition, context.process);
  const issues = runtime.validate(state);
  if (issues.length) throw new Error(`Invalid run state: ${issues.join("; ")}`);
  const pending = snapshot ? pendingEncounterCommands(state, commands) : [...commands];
  validateCommandStream(state, pending);
  const records: EncounterCommandRecord[] = [];
  const trace: EncounterEvent[] = [];
  let traceDropped = 0;
  let ticksAdvanced = 0;
  while (ticksAdvanced < options.ticks && !state.result) {
    const count = Math.min(options.batchSize, options.ticks - ticksAdvanced);
    const inputs = pending.filter(
      (input) => input.tick >= state.tick && input.tick < state.tick + count
    );
    const result = runtime.advanceTicks(state, count, inputs);
    state = result.state;
    ticksAdvanced += result.ticksAdvanced;
    records.push(...result.commands);
    if (options.observer === "trace") {
      const available = Math.max(0, options.traceLimit - trace.length);
      trace.push(...structuredClone(result.events.slice(0, available)));
      traceDropped += Math.max(0, result.events.length - available);
    }
  }
  return {
    state,
    summary: encounterRunSummary(state, records),
    commands: records,
    trace,
    traceDropped,
    ticksAdvanced,
  };
};
