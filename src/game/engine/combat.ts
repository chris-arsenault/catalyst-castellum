import { facilityModelForMap } from "../world/derivedModel";
import type { EncounterContext, EncounterState } from "../encounter/types";
import { enemyDefinition } from "../encounter/catalogs";
import { configuredProcess } from "../encounter/processContext";
import type { WorldMap } from "../world/map";
import type { EnemyState, RoomId } from "../types";
import {
  dominantLedgerSource,
  emptyDamageLedger,
  emptyHazardChannels,
  type DamageApplication,
  type HazardBurst,
} from "./damage";
import {
  addEncounterIncident as addCombatIncident,
  addEncounterEvent as addEvent,
} from "../encounter/events";
import { findEnemyPathBetween } from "./navigation";
import { enemyRoomId } from "./enemyPosition";
import {
  enemyBehaviorSpeedMultiplier,
  ENEMY_WORLD_SPEED_SCALE,
  LOCOMOTION_SPEED,
} from "./enemyMovementRules";
import { enemyStatsAtLevel } from "./enemyLevel";
import { initialEnemyBehaviorState } from "./enemyBehaviors";
import { routePathForEnemy } from "../world/routes";
import { environmentalEnemyMovementMultiplier } from "./environmentalFields";
import { clearEnemyCharge } from "../encounter/catalystCharge";
import { projectCatalystMovement } from "../encounter/catalystFields";
import type { CatalystFieldSample } from "../encounter/catalystTypes";

export { enemyRoomId, enemyWorldPosition } from "./enemyPosition";

export const spawnEnemies = (state: EncounterState, gameDefinition: EncounterContext): void => {
  const wave = gameDefinition.definition.wave;
  while (state.spawnCursor < wave.length) {
    const entry = wave[state.spawnCursor];
    if (!entry || entry.tick > Math.round(state.phaseTime / gameDefinition.combat.tickSeconds))
      break;
    const definition = enemyDefinition(gameDefinition.combat, entry.type);
    const path = routePathForEnemy(entry, state.map, state.portalStates, gameDefinition.combat);
    if (path.length === 0) throw new Error(`No cell route reaches Core for ${entry.type}.`);
    const enemyLevel = entry.level;
    const health = enemyStatsAtLevel(definition, enemyLevel).health;
    state.enemies.push({
      id: state.nextEnemyId,
      type: entry.type,
      level: enemyLevel,
      health,
      maxHealth: health,
      routeId: entry.routeId,
      path,
      pathIndex: 0,
      progress: 0,
      mode: definition.flying ? "flying" : "walking",
      facing: 1,
      spawnAge: 0,
      damageTaken: 0,
      damageBySource: emptyDamageLedger(),
      lastDamage: null,
      behavior: initialEnemyBehaviorState(definition, enemyLevel),
      effects: [],
    });
    state.nextEnemyId += 1;
    state.spawnCursor += 1;
    state.stats.spawned += 1;
  }
};

export const neutralizeEnemy = (
  state: EncounterState,
  enemy: EnemyState,
  roomId: RoomId,
  application: DamageApplication,
  gameDefinition: EncounterContext
): void => {
  const definition = enemyDefinition(gameDefinition.combat, enemy.type);
  const leveled = enemyStatsAtLevel(definition, enemy.level);
  const finalSource = application.dominantSource ?? dominantLedgerSource(enemy.damageBySource);
  const lifetimeSource = dominantLedgerSource(enemy.damageBySource);
  const finalChannel = application.dominantChannel;
  state.stats.killed += 1;
  if (finalSource) state.stats.killsBySource[finalSource] += 1;
  state.stats.matterHarvested += leveled.matterYield;
  state.pendingMatter += leveled.matterYield;
  clearEnemyCharge(state, enemy.id, "death");
  const process = configuredProcess(state, gameDefinition);
  process?.bridge.enemyDeath(process.state, enemy, roomId, process.context);

  addEvent(
    state,
    "good",
    "enemy_neutralized",
    {
      enemyType: enemy.type,
      damageTaken: Math.round(enemy.damageTaken),
      finalSource: finalSource ?? "",
      finalChannel: finalChannel ?? "",
      lifetimeSource: lifetimeSource && lifetimeSource !== finalSource ? lifetimeSource : "",
      matterYield: leveled.matterYield,
    },
    roomId
  );
};

const recordBurstIncidents = (state: EncounterState, bursts: readonly HazardBurst[]): void => {
  for (const burst of bursts) {
    const incident = addCombatIncident(state, {
      elapsed: state.elapsed,
      encounterId: state.definition.id,
      phase: state.phase,
      roomId: burst.roomId,
      zone: burst.zone,
      sourceId: burst.sourceId,
      reactionExtent: burst.reactionExtent,
      pressureImpulse: burst.pressureImpulse,
      heatDelta: burst.heatDelta,
      damageByChannel: emptyHazardChannels(),
      targets: [],
    });
    addEvent(
      state,
      "reaction",
      "flash_incident",
      {
        pressureImpulse: Math.round(burst.pressureImpulse),
        reactionExtent: burst.reactionExtent,
        heatDelta: burst.heatDelta,
      },
      burst.roomId,
      incident.id
    );
  }
};

/** Records process bursts as environmental telemetry. */
export const resolveEnemyCombat = (
  state: EncounterState,
  dt: number,
  bursts: readonly HazardBurst[],
  _definition: EncounterContext
): void => {
  for (const enemy of state.enemies) enemy.spawnAge += dt;
  recordBurstIncidents(state, bursts);
};

const repathEnemy = (
  state: EncounterState,
  enemy: EnemyState,
  definition: EncounterContext
): boolean => {
  const current = enemy.path[Math.min(enemy.pathIndex, enemy.path.length - 1)];
  if (!current) return false;
  const species = enemyDefinition(definition.combat, enemy.type);
  const path = findEnemyPathBetween(
    {
      flying: species.flying,
      portalStates: state.portalStates,
      start: current.cell,
      goal: state.map.coreBreachCell,
    },
    state.map
  );
  if (path.length === 0) return false;
  enemy.path = path;
  enemy.pathIndex = 0;
  enemy.progress = 0;
  enemy.mode = path[0]?.mode ?? "walking";
  return true;
};

const isClosedCoreThresholdStep = (step: EnemyState["path"][number], map: WorldMap): boolean =>
  step.mode === "door" &&
  step.cell.column === map.coreBreachCell.column &&
  step.cell.elevation === map.coreBreachCell.elevation &&
  step.portalId !== null &&
  step.portalId === facilityModelForMap(map).cellDefinition(map.coreBreachCell).portalId &&
  facilityModelForMap(map).cellDefinition(step.cell).terrain === "door";

const nextEnemySegment = (
  state: EncounterState,
  enemy: EnemyState,
  definition: EncounterContext
): readonly [EnemyState["path"][number], EnemyState["path"][number]] | null => {
  let current = enemy.path[enemy.pathIndex];
  let next = enemy.path[enemy.pathIndex + 1];
  if (!current || !next) return null;
  if (
    facilityModelForMap(state.map).cellIsTraversable(next.cell, state.portalStates) ||
    isClosedCoreThresholdStep(next, state.map)
  )
    return [current, next];
  if (!repathEnemy(state, enemy, definition)) return null;
  current = enemy.path[enemy.pathIndex];
  next = enemy.path[enemy.pathIndex + 1];
  return current && next ? [current, next] : null;
};

const prepareEnemySegment = (
  enemy: EnemyState,
  current: EnemyState["path"][number],
  next: EnemyState["path"][number]
): number => {
  enemy.mode = next.mode;
  if (next.cell.column !== current.cell.column) {
    enemy.facing = next.cell.column > current.cell.column ? 1 : -1;
  }
  return Math.hypot(
    next.cell.column - current.cell.column,
    next.cell.elevation - current.cell.elevation
  );
};

const moveEnemy = (
  state: EncounterState,
  enemy: EnemyState,
  roomMultiplier: number,
  dt: number,
  gameDefinition: EncounterContext
): boolean => {
  const definition = enemyDefinition(gameDefinition.combat, enemy.type);
  const slow = enemy.effects
    .filter((effect) => effect.kind === "slow")
    .reduce((strongest, effect) => Math.max(strongest, effect.magnitude), 0);
  const stunned = enemy.effects.some((effect) => effect.kind === "stun");
  const controlMultiplier = stunned ? 0 : Math.max(0.1, 1 - slow);
  let travel =
    definition.speed *
    enemyBehaviorSpeedMultiplier(enemy, definition) *
    ENEMY_WORLD_SPEED_SCALE *
    controlMultiplier *
    roomMultiplier *
    environmentalEnemyMovementMultiplier(state, enemy) *
    dt;
  while (travel > 0 && enemy.pathIndex < enemy.path.length - 1) {
    const segment = nextEnemySegment(state, enemy, gameDefinition);
    if (!segment) return false;
    const segmentLength = prepareEnemySegment(enemy, ...segment);
    const modeTravel = travel * LOCOMOTION_SPEED[enemy.mode];
    const remaining = segmentLength * (1 - enemy.progress);
    if (modeTravel < remaining) {
      enemy.progress += modeTravel / segmentLength;
      return false;
    }
    travel -= remaining / LOCOMOTION_SPEED[enemy.mode];
    enemy.pathIndex += 1;
    enemy.progress = 0;
  }
  return enemy.pathIndex >= enemy.path.length - 1;
};

const breachCore = (
  state: EncounterState,
  enemy: EnemyState,
  gameDefinition: EncounterContext
): void => {
  clearEnemyCharge(state, enemy.id, "breach");
  const definition = enemyDefinition(gameDefinition.combat, enemy.type);
  const coreDamage = enemyStatsAtLevel(definition, enemy.level).coreDamage;
  state.coreIntegrity = Math.max(0, state.coreIntegrity - coreDamage);
  state.stats.breached += 1;
  state.stats.coreDamage += coreDamage;
  state.stats.breachesByRoute[enemy.routeId] =
    (state.stats.breachesByRoute[enemy.routeId] ?? 0) + 1;
  addEvent(state, "danger", "core_breached", { enemyType: enemy.type, coreDamage }, "core");
};

export const moveEnemies = (
  state: EncounterState,
  dt: number,
  definition: EncounterContext,
  fields: CatalystFieldSample = { byEnemy: {}, servicedByDevice: {} }
): void => {
  state.enemies = state.enemies.filter((enemy) => {
    if (definition.combat.mechanics.kind === "catalyst" && state.coreIntegrity <= 0) return true;
    const roomId = enemyRoomId(enemy, state.map);
    const process = configuredProcess(state, definition);
    const multiplier =
      roomId && process
        ? process.bridge.movementMultiplier(process.state, enemy, roomId, process.context)
        : 1;
    const arrived =
      definition.combat.mechanics.kind === "catalyst"
        ? moveCatalystEnemy(state, enemy, multiplier, dt, definition, fields)
        : moveEnemy(state, enemy, multiplier, dt, definition);
    if (!arrived) return true;
    breachCore(state, enemy, definition);
    return false;
  });
};

const playerMovementMultiplier = (
  state: EncounterState,
  enemy: EnemyState,
  roomMultiplier: number
): number => {
  const slow = enemy.effects
    .filter((effect) => effect.kind === "slow")
    .reduce((strongest, effect) => Math.max(strongest, effect.magnitude), 0);
  const control = enemy.effects.some((effect) => effect.kind === "stun")
    ? 0
    : Math.max(0, 1 - slow);
  return control * roomMultiplier * environmentalEnemyMovementMultiplier(state, enemy);
};

const moveCatalystEnemy = (
  state: EncounterState,
  enemy: EnemyState,
  roomMultiplier: number,
  dt: number,
  context: EncounterContext,
  fields: CatalystFieldSample
): boolean => {
  const mechanics = context.combat.mechanics;
  if (mechanics.kind !== "catalyst") return false;
  const definition = enemyDefinition(context.combat, enemy.type);
  const playerMultiplier = playerMovementMultiplier(state, enemy, roomMultiplier);
  let remainingTime = dt;
  while (remainingTime > 0 && enemy.pathIndex < enemy.path.length - 1) {
    const segment = nextEnemySegment(state, enemy, context);
    if (!segment) return false;
    const length = prepareEnemySegment(enemy, ...segment);
    const [from, to] = segment;
    const multiplier = projectCatalystMovement(
      fields,
      enemy.id,
      { x: from.cell.column, elevation: from.cell.elevation },
      { x: to.cell.column, elevation: to.cell.elevation },
      playerMultiplier,
      mechanics.rules
    );
    const speed =
      definition.speed *
      enemyBehaviorSpeedMultiplier(enemy, definition) *
      ENEMY_WORLD_SPEED_SCALE *
      LOCOMOTION_SPEED[enemy.mode] *
      multiplier;
    const distance = length * (1 - enemy.progress);
    if (speed * remainingTime < distance) {
      enemy.progress += (speed * remainingTime) / length;
      return false;
    }
    remainingTime -= distance / speed;
    enemy.pathIndex += 1;
    enemy.progress = 0;
  }
  return enemy.pathIndex >= enemy.path.length - 1;
};

export const simulateEnemies = (
  state: EncounterState,
  dt: number,
  definition: EncounterContext
): void => {
  resolveEnemyCombat(state, dt, [], definition);
  moveEnemies(state, dt, definition);
};
