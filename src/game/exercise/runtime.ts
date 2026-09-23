import { harkerCatalystCombat, harkerCatalystExercise } from "../content/exercises/harkerCatalyst";
import { cloneEncounter } from "../encounter/clone";
import { createEncounter } from "../encounter/create";
import { makeStats } from "../encounter/events";
import { createEncounterRuntime } from "../encounter/runtime";
import type { CommandDecision } from "../types";
import type { EncounterContext } from "../encounter/types";
import { decodeExercise, encodeExercise } from "./snapshot";
import { resetWaveAccounting } from "./waveAccounting";
import { recordDiscard } from "./discard";
import type { ExerciseCommand, ExerciseRuntime, ExerciseState } from "./types";

const definition = harkerCatalystExercise;
const contextFor = (state: Pick<ExerciseState, "waveIndex">): EncounterContext => {
  const wave = definition.waves[state.waveIndex];
  if (!wave) throw new RangeError("Exercise wave is outside the authored sequence");
  return { combat: harkerCatalystCombat, definition: wave, process: null };
};
const decision = (allowed: boolean): CommandDecision => ({
  allowed,
  code: allowed ? null : "invalid_phase",
  parameters: {},
  amount: 0,
  cost: 0,
  refund: 0,
});
const create = (): ExerciseState => {
  const context = contextFor({ waveIndex: 0 });
  return {
    version: 1,
    exerciseId: definition.id,
    contentVersion: definition.contentVersion,
    waveIndex: 0,
    encounter: createEncounter(context.combat, context.definition),
    reports: [],
    settledEncounterIds: [],
    checkpoint: null,
    discardedReports: [],
  };
};
const clone = (state: ExerciseState): ExerciseState => ({
  ...state,
  encounter: cloneEncounter(state.encounter),
  reports: structuredClone(state.reports),
  discardedReports: structuredClone(state.discardedReports),
  settledEncounterIds: [...state.settledEncounterIds],
});
const settle = (state: ExerciseState): ExerciseState => {
  const result = state.encounter.result;
  if (!result) return state;
  if (state.reports.length === state.waveIndex) state.reports.push(structuredClone(result));
  if (
    result.termination === "complete" &&
    !state.settledEncounterIds.includes(result.encounterId)
  ) {
    state.settledEncounterIds.push(result.encounterId);
    state.encounter.matter += result.pendingMatter;
    state.encounter.pendingMatter = 0;
  }
  return state;
};
const nextWave = (source: ExerciseState): ExerciseState => {
  const state = settle(clone(source));
  state.waveIndex += 1;
  const next = contextFor(state).definition;
  const encounter = state.encounter;
  encounter.definition.id = next.id;
  encounter.definition.contentVersion = next.contentVersion;
  encounter.availability = structuredClone(next.availability);
  encounter.phase = "build";
  encounter.tick = 0;
  encounter.phaseTime = 0;
  encounter.commandCursor = { tick: 0, sequence: -1 };
  encounter.spawnCursor = 0;
  encounter.result = null;
  encounter.stats = makeStats();
  encounter.towerAttacks = [];
  encounter.pendingAttacks = [];
  encounter.incidents = [];
  for (const tower of Object.values(encounter.towers)) {
    tower.damageDealt = 0;
    tower.kills = 0;
    tower.shots = 0;
    tower.currentTargetIds = [];
    tower.telemetry = {
      engagedSeconds: 0,
      targetsServiced: 0,
      overkillDamage: 0,
      controlApplications: 0,
      downtime: { noTarget: 0, cooldown: 0, supply: 0 },
    };
  }
  resetWaveAccounting(encounter);
  state.checkpoint = null;
  return state;
};
const execute = (
  source: ExerciseState,
  command: ExerciseCommand
): ReturnType<ExerciseRuntime["execute"]> => {
  if (command.type === "restart_exercise")
    return {
      state: { ...create(), discardedReports: recordDiscard(source, "restart") },
      decision: decision(true),
    };
  if (command.type === "continue_wave") {
    const allowed =
      source.encounter.result?.termination === "complete" &&
      source.waveIndex + 1 < definition.waves.length;
    return { state: allowed ? nextWave(source) : source, decision: decision(allowed) };
  }
  const context = contextFor(source);
  const runtime = createEncounterRuntime(context);
  if (command.type === "retry_wave") {
    const restored = source.checkpoint ? runtime.load(source.checkpoint) : null;
    const allowed = restored?.phase === "build";
    return {
      state: allowed
        ? {
            ...clone(source),
            encounter: restored,
            reports: structuredClone(source.reports.slice(0, source.waveIndex)),
            settledEncounterIds: source.settledEncounterIds.filter(
              (id) => id !== restored.definition.id
            ),
            checkpoint: null,
            discardedReports: recordDiscard(source, "retry"),
          }
        : source,
      decision: decision(allowed),
    };
  }
  return executeOrdered(source, {
    tick: source.encounter.tick,
    sequence: source.encounter.commandCursor.sequence + 1,
    command,
  });
};
const executeOrdered: ExerciseRuntime["executeOrdered"] = (source, input) => {
  const runtime = createEncounterRuntime(contextFor(source));
  const result = runtime.execute(source.encounter, input);
  const state = { ...clone(source), encounter: result.state };
  if (input.command.type === "start_assault" && result.decision.allowed)
    state.checkpoint = runtime.save(source.encounter);
  return { state, decision: result.decision };
};

export const createCatalystExerciseRuntime = (): ExerciseRuntime => ({
  definition,
  create,
  execute,
  executeOrdered,
  context: contextFor,
  advanceTicks: (source, count) =>
    settle({
      ...clone(source),
      encounter: createEncounterRuntime(contextFor(source)).advanceTicks(source.encounter, count)
        .state,
    }),
  save: (state) => encodeExercise(state, definition, contextFor),
  load: (raw) => decodeExercise(raw, definition, contextFor),
});
