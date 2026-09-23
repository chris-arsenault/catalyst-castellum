import { moveEnemies, resolveEnemyCombat, spawnEnemies } from "../engine/combat";
import { simulateEnemyBehaviors } from "../engine/enemyBehaviors";
import { tickEnvironmentalFields } from "../engine/environmentalFields";
import { simulateTowers } from "../engine/towerCombat";
import {
  commitDischargeDamage,
  resolveProjectileImpact,
  tickTowerEffects,
} from "../engine/towerImpact";
import { beginCatalystTick, cleanupCatalystCharge } from "./catalystCharge";
import { sampleCatalystFields, recordCatalystFieldService } from "./catalystFields";
import { resolveCatalystDischarges } from "./catalystDischarge";
import { advanceProjectiles } from "./projectiles";
import { cloneEncounter } from "./clone";
import {
  evaluateEncounterCommand,
  executeEncounterCommand,
  validateCommandStream,
} from "./commands";
import { configuredProcess } from "./processContext";
import { finishEncounter } from "./reports";
import { decodeEncounterSnapshot, encodeEncounterSnapshot } from "./snapshot";
import { validateEncounterState } from "./validation";
import type {
  EncounterAdvanceResult,
  EncounterCommand,
  EncounterContext,
  EncounterState,
  OrderedEncounterCommand,
} from "./types";

/** Fields sample before this tick's impacts; all damage precedes route movement. */
const tick = (state: EncounterState, context: EncounterContext): void => {
  const dt = context.combat.tickSeconds;
  state.tick += 1;
  state.phaseTime += dt;
  state.elapsed += dt;
  tickEnvironmentalFields(state, dt);
  if (context.combat.mechanics.kind === "catalyst") tickTowerEffects(state, dt);
  beginCatalystTick(state, context);
  const process = configuredProcess(state, context);
  process?.bridge.beforeSpawn(process.state, dt, process.context);
  if (state.phase === "assault") spawnEnemies(state, context);
  simulateEnemyBehaviors(state, dt, context);
  const fieldSample = sampleCatalystFields(state, context);
  if (state.phase === "assault") recordCatalystFieldService(state, fieldSample, dt);
  advanceProjectiles(state, dt, context, (impact) =>
    resolveProjectileImpact(state, impact, context)
  );
  if (state.phase === "assault") simulateTowers(state, dt, context, fieldSample);
  if (state.phase === "assault") resolveCatalystDischarges(state, context, commitDischargeDamage);
  const bursts = process?.bridge.afterTowers(process.state, dt, process.context) ?? [];
  resolveEnemyCombat(state, dt, bursts, context);
  if (state.phase === "assault") moveEnemies(state, dt, context, fieldSample);
  resolveTermination(state, context);
};

const resolveTermination = (state: EncounterState, context: EncounterContext): void => {
  if (state.coreIntegrity <= 0) {
    cleanupCatalystCharge(state);
    finishEncounter(state, "defeat");
  } else if (
    state.phase === "assault" &&
    state.spawnCursor >= context.definition.wave.length &&
    state.enemies.length === 0 &&
    state.pendingAttacks.length === 0
  )
    finishEncounter(state, "complete");
  else if (state.tick >= context.definition.maximumTicks) finishEncounter(state, "timeout");
};

export const advanceEncounterTicks = (
  source: EncounterState,
  count: number,
  context: EncounterContext,
  commands: readonly OrderedEncounterCommand[] = []
): EncounterAdvanceResult => {
  if (!Number.isSafeInteger(count) || count < 0)
    throw new RangeError("Tick count must be a nonnegative integer");
  validateCommandStream(source, commands);
  let state = cloneEncounter(source);
  const events: EncounterAdvanceResult["events"][number][] = [];
  const records: EncounterAdvanceResult["commands"][number][] = [];
  let cursor = 0;
  let ticksAdvanced = 0;
  for (; ticksAdvanced < count && !state.result; ticksAdvanced += 1) {
    while (cursor < commands.length && commands[cursor]!.tick <= state.tick) {
      const input = commands[cursor++]!;
      const result = executeEncounterCommand(state, input, context);
      state = result.state;
      events.push(...result.events);
      records.push({ input, decision: result.decision });
    }
    const firstEvent = state.nextEventId;
    tick(state, context);
    events.push(
      ...structuredClone(state.events.filter((event) => event.id >= firstEvent).reverse())
    );
  }
  return {
    state,
    ticksAdvanced,
    termination: state.result?.termination ?? null,
    events,
    commands: records,
  };
};

export const createEncounterRuntime = (context: EncounterContext) => ({
  context,
  evaluate: (state: EncounterState, command: EncounterCommand) =>
    evaluateEncounterCommand(state, command, context),
  execute: (state: EncounterState, command: OrderedEncounterCommand) =>
    executeEncounterCommand(state, command, context),
  advanceTicks: (
    state: EncounterState,
    count: number,
    commands: readonly OrderedEncounterCommand[] = []
  ) => advanceEncounterTicks(state, count, context, commands),
  validate: (state: EncounterState) => validateEncounterState(state, context),
  save: (state: EncounterState) => encodeEncounterSnapshot(state, context),
  load: (snapshot: string) => decodeEncounterSnapshot(snapshot, context),
});
