import { validateEnemyDefinitions } from "../authoring/enemyValidation";
import { validateTowerDefinitions } from "../authoring/towerValidation";
import { towerPlacementIssue } from "../engine/towerPlacement";
import { validateWorldMap } from "../world/mapValidation";
import { routePathForEnemy } from "../world/routes";
import { configuredProcess } from "./processContext";
import { validateEncounterGeometry } from "./geometryValidation";
import { validateCatalystDefinition, validateCatalystState } from "./catalystValidation";
import { validatePendingAttacks } from "./projectileValidation";
import type { ProcessBridge } from "./processTypes";
import type {
  CombatDefinition,
  EncounterContext,
  EncounterDefinition,
  EncounterState,
} from "./types";

const validateMetadata = (
  combat: CombatDefinition,
  definition: EncounterDefinition,
  bridge: ProcessBridge | null
): string[] => {
  const issues: string[] = [];
  if (!combat.id || !definition.id || !definition.instanceNamespace)
    issues.push("Encounter, combat, and instance namespace identities are required");
  if (Math.abs(combat.tickSeconds - 0.1) > 0) issues.push("Combat tick must equal 0.1 seconds");
  validatePositiveIntegers(
    {
      combatVersion: combat.contentVersion,
      contentVersion: definition.contentVersion,
      maximumTicks: definition.maximumTicks,
    },
    issues
  );
  validateNonnegative(
    {
      startingMatter: definition.startingMatter,
      startingCoreIntegrity: definition.startingCoreIntegrity,
    },
    issues
  );
  if (definition.process && !bridge) issues.push("Configured process requires a bridge");
  return issues;
};

const validatePositiveIntegers = (values: Record<string, number>, issues: string[]): void => {
  for (const [name, value] of Object.entries(values)) {
    if (!Number.isSafeInteger(value) || value <= 0)
      issues.push(`${name} must be a positive integer`);
  }
};

const validateNonnegative = (values: Record<string, number>, issues: string[]): void => {
  for (const [name, value] of Object.entries(values)) {
    if (!Number.isFinite(value) || value < 0) issues.push(`${name} must be finite and nonnegative`);
  }
};

export const validateEncounterDefinition = (
  combat: CombatDefinition,
  definition: EncounterDefinition,
  bridge: ProcessBridge | null
): string[] => {
  const issues = validateMetadata(combat, definition, bridge);
  issues.push(...validateCatalystDefinition(combat));
  const species = definition.process?.species ?? null;
  const mechanics = combat.mechanics;
  const passiveTowers =
    mechanics.kind === "catalyst"
      ? Object.values(combat.towers)
          .filter((tower) => {
            const kind = mechanics.devices[tower.id]?.kind;
            return kind === "field" || kind === "discharge";
          })
          .map((tower) => tower.id)
      : [];
  issues.push(
    ...validateTowerDefinitions({ towers: combat.towers, species, passiveTowers }).map(
      (issue) => `${issue.path}: ${issue.message}`
    )
  );
  issues.push(
    ...validateEnemyDefinitions({ enemies: combat.enemies, species }).map(
      (issue) => `${issue.path}: ${issue.message}`
    )
  );
  issues.push(
    ...validateWorldMap(definition.map).map((issue) => `${issue.path}: ${issue.message}`)
  );
  validateWave(combat, definition, issues);
  validateInitialTowers(combat, definition, issues);
  return issues;
};

const validateWave = (
  combat: CombatDefinition,
  definition: EncounterDefinition,
  issues: string[]
): void => {
  let previous = -1;
  for (const [index, spawn] of definition.wave.entries()) {
    if (!Number.isSafeInteger(spawn.tick) || spawn.tick < previous || spawn.tick < 0)
      issues.push(`wave.${index}.tick must be a nonnegative ordered integer`);
    previous = spawn.tick;
    if (!Number.isSafeInteger(spawn.level) || spawn.level < 1)
      issues.push(`wave.${index}.level must be a positive integer`);
    validateSpawn(combat, definition, index, issues);
  }
};

const validateSpawn = (
  combat: CombatDefinition,
  definition: EncounterDefinition,
  index: number,
  issues: string[]
): void => {
  const spawn = definition.wave[index]!;
  const enemy = combat.enemies[spawn.type];
  if (!enemy) {
    issues.push(`wave.${index}: unknown enemy ${spawn.type}`);
    return;
  }
  if (enemy.behavior.kind === "gas_emitter" && !definition.process)
    issues.push(`wave.${index}: gas emitter requires a process definition`);
  if (!routePathForEnemy(spawn, definition.map, definition.initialPortalStates, combat).length)
    issues.push(`wave.${index}: route does not reach Core`);
};

const validateInitialTowers = (
  combat: CombatDefinition,
  definition: EncounterDefinition,
  issues: string[]
): void => {
  for (const id of definition.availability.towers)
    if (!combat.towers[id]) issues.push(`availability: unknown tower ${id}`);
  for (const [id, tower] of Object.entries(definition.initialTowers)) {
    if (id !== tower.id) issues.push(`initialTowers.${id}: identity does not match key`);
    const issue = towerPlacementIssue(
      { map: definition.map, towers: definition.initialTowers },
      tower.chassisId,
      tower.placement,
      combat,
      id
    );
    if (issue) issues.push(`initialTowers.${id}: ${issue}`);
  }
};

export const assertEncounterDefinition = (
  combat: CombatDefinition,
  definition: EncounterDefinition,
  bridge: ProcessBridge | null
): void => {
  const issues = validateEncounterDefinition(combat, definition, bridge);
  if (issues.length) throw new Error(`Invalid encounter definition: ${issues.join("; ")}`);
};

const checkFinite = (value: unknown, path: string, issues: string[]): void => {
  if (typeof value === "number" && !Number.isFinite(value))
    issues.push(`${path}: non-finite value`);
  else if (value && typeof value === "object")
    for (const [key, child] of Object.entries(value)) checkFinite(child, `${path}.${key}`, issues);
};

const validateStateCounters = (state: EncounterState, context: EncounterContext): string[] => {
  const issues: string[] = [];
  for (const key of [
    "tick",
    "spawnCursor",
    "nextEnemyId",
    "nextTowerSequence",
    "nextTowerAttackId",
    "nextEventId",
    "nextIncidentId",
  ] as const)
    if (!Number.isSafeInteger(state[key]) || state[key] < 0)
      issues.push(`${key}: invalid sequence`);
  if (state.spawnCursor > context.definition.wave.length) issues.push("spawnCursor exceeds wave");
  for (const key of ["elapsed", "phaseTime", "matter", "pendingMatter", "coreIntegrity"] as const)
    if (state[key] < 0) issues.push(`${key}: must be nonnegative`);
  if (Boolean(state.process) !== Boolean(context.definition.process))
    issues.push("Process snapshot configuration mismatch");
  return issues;
};

const validateStateTowers = (
  state: EncounterState,
  context: EncounterContext,
  issues: string[]
): void => {
  for (const attack of state.towerAttacks)
    if (!state.towers[attack.towerId] && !state.catalyst?.sources[attack.towerId])
      issues.push(`towerAttacks.${attack.id}: missing source`);
  for (const [id, tower] of Object.entries(state.towers)) {
    const chassis = context.combat.towers[tower.chassisId];
    if (!chassis || id !== tower.id) issues.push(`towers.${id}: invalid identity`);
    else if (
      tower.upgrades.some((upgrade) => !chassis.upgrades.some((entry) => entry.id === upgrade))
    )
      issues.push(`towers.${id}: invalid upgrade`);
  }
};

const validateStateEnemies = (
  state: EncounterState,
  context: EncounterContext,
  issues: string[]
): void => {
  for (const enemy of state.enemies) {
    if (!context.combat.enemies[enemy.type]) issues.push(`enemies.${enemy.id}: unknown definition`);
    if (
      !enemy.path.length ||
      enemy.pathIndex < 0 ||
      enemy.pathIndex >= enemy.path.length ||
      enemy.progress < 0 ||
      enemy.progress > 1
    )
      issues.push(`enemies.${enemy.id}: invalid route progress`);
  }
};

const validateCursor = (state: EncounterState, issues: string[]): void => {
  const cursor = state.commandCursor;
  if (!Number.isSafeInteger(cursor.tick) || cursor.tick < 0 || cursor.tick > state.tick)
    issues.push("commandCursor.tick: outside the processed timeline");
  if (!Number.isSafeInteger(cursor.sequence) || cursor.sequence < -1)
    issues.push("commandCursor.sequence: invalid sequence");
};

const validateIdentitySequence = (
  ids: number[],
  next: number,
  label: string,
  issues: string[]
): void => {
  if (new Set(ids).size !== ids.length) issues.push(`${label}: duplicate identity`);
  if (ids.some((id) => !Number.isSafeInteger(id) || id < 1 || id >= next))
    issues.push(`${label}: identity outside its sequence`);
};

const validateTerminalState = (
  state: EncounterState,
  context: EncounterContext,
  issues: string[]
): void => {
  if (!state.result) {
    if (state.phase !== "build" && state.phase !== "assault")
      issues.push("Terminal phase requires its result");
    return;
  }
  if (
    state.result.termination !== state.phase ||
    state.result.ticks !== state.tick ||
    state.result.encounterId !== state.definition.id
  )
    issues.push("Terminal result differs from encounter state");
  validateNonnegative(
    {
      resultMatter: state.result.matter,
      resultPendingMatter: state.result.pendingMatter,
      resultCoreIntegrity: state.result.coreIntegrity,
    },
    issues
  );
  if (
    state.result.pendingMatter !== state.result.report.matterHarvested ||
    state.result.coreIntegrity !== state.coreIntegrity
  )
    issues.push("Terminal result reward or Core differs from its encounter");
  validateTermination(state, context, issues);
};

const validateTermination = (
  state: EncounterState,
  context: EncounterContext,
  issues: string[]
): void => {
  if (
    state.phase === "complete" &&
    (state.enemies.length > 0 ||
      state.pendingAttacks.length > 0 ||
      state.spawnCursor !== context.definition.wave.length)
  )
    issues.push("Completed encounter must resolve every spawn");
  if (state.phase === "defeat" && state.coreIntegrity > 0)
    issues.push("Defeated encounter must exhaust Core integrity");
  if (state.phase === "timeout" && state.tick < context.definition.maximumTicks)
    issues.push("Timeout precedes the encounter tick limit");
};

export const validateEncounterState = (
  state: EncounterState,
  context: EncounterContext
): string[] => {
  const issues = validateStateCounters(state, context);
  issues.push(...validateCatalystState(state, context));
  issues.push(...validatePendingAttacks(state, context));
  checkFinite(state, "encounter", issues);
  if (
    state.definition.id !== context.definition.id ||
    state.definition.contentVersion !== context.definition.contentVersion ||
    state.definition.combatId !== context.combat.id ||
    state.definition.combatVersion !== context.combat.contentVersion
  )
    issues.push("Encounter snapshot definition identity differs from the bound definition");
  validateStateTowers(state, context, issues);
  validateStateEnemies(state, context, issues);
  validateCursor(state, issues);
  issues.push(...validateEncounterGeometry(state, context));
  validateTerminalState(state, context, issues);
  validateIdentitySequence(
    state.enemies.map((enemy) => enemy.id),
    state.nextEnemyId,
    "enemies",
    issues
  );
  validateIdentitySequence(
    state.events.map((event) => event.id),
    state.nextEventId,
    "events",
    issues
  );
  validateIdentitySequence(
    state.incidents.map((incident) => incident.id),
    state.nextIncidentId,
    "incidents",
    issues
  );
  validateIdentitySequence(
    [...state.towerAttacks, ...state.pendingAttacks].map((attack) => attack.id),
    state.nextTowerAttackId,
    "towerAttacks",
    issues
  );
  if (state.process && context.process && context.definition.process) {
    const process = configuredProcess(state, context)!;
    issues.push(...process.bridge.validate(process.state, process.context));
  }
  return issues;
};
