import { facilityModelForMap } from "../world/derivedModel";
import type { GameDefinition } from "../definitionTypes";
import type { EnemyState, GameState, RoomId, RoomState } from "../types";
import { levelDefinitionFor, roundDefinitionFor } from "./campaign";
import {
  dominantLedgerSource,
  emptyDamageLedger,
  emptyHazardChannels,
  type DamageApplication,
  type HazardBurst,
} from "./damage";
import { addCombatIncident, addEvent } from "./events";
import { clamp } from "./math";
import { findEnemyPathBetween } from "./navigation";
import { roomMovementMultiplier } from "./roomState";
import { enemyRoomId } from "./enemyPosition";
import {
  enemyBehaviorSpeedMultiplier,
  ENEMY_WORLD_SPEED_SCALE,
  LOCOMOTION_SPEED,
} from "./enemyMovementRules";
import { enemyStatsAtLevel, resolveEnemyLevel } from "./enemyLevel";
import { roomState } from "../world/instances";
import { initialEnemyBehaviorState } from "./enemyBehaviors";
import { routePathForEnemy } from "../world/routes";
import { environmentalEnemyMovementMultiplier } from "./environmentalFields";

export { enemyRoomId, enemyWorldPosition } from "./enemyPosition";

export const spawnEnemies = (state: GameState, gameDefinition: GameDefinition): void => {
  const level = levelDefinitionFor(state, gameDefinition);
  const wave = roundDefinitionFor(state, gameDefinition).wave;
  while (state.spawnCursor < wave.length) {
    const entry = wave[state.spawnCursor];
    if (!entry || entry.at > state.phaseTime) break;
    const definition = gameDefinition.enemies[entry.type];
    const path = routePathForEnemy(entry, state.map, state.portalStates, gameDefinition);
    if (path.length === 0) throw new Error(`No cell route reaches Core for ${entry.type}.`);
    const enemyLevel = resolveEnemyLevel(level.enemyLevel, entry.levelOffset);
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
  state: GameState,
  enemy: EnemyState,
  roomId: RoomId,
  application: DamageApplication,
  gameDefinition: GameDefinition
): void => {
  const definition = gameDefinition.enemies[enemy.type];
  const leveled = enemyStatsAtLevel(definition, enemy.level);
  const finalSource = application.dominantSource ?? dominantLedgerSource(enemy.damageBySource);
  const lifetimeSource = dominantLedgerSource(enemy.damageBySource);
  const finalChannel = application.dominantChannel;
  state.stats.killed += 1;
  if (finalSource) state.stats.killsBySource[finalSource] += 1;
  state.stats.matterHarvested += leveled.matterYield;
  state.pendingMatter += leveled.matterYield;
  roomState(state, roomId).residue = clamp(
    roomState(state, roomId).residue + leveled.residueOnDeath,
    0,
    100
  );

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

const recordBurstIncidents = (state: GameState, bursts: HazardBurst[]): void => {
  for (const burst of bursts) {
    const incident = addCombatIncident(state, {
      elapsed: state.elapsed,
      levelId: state.campaign.levelId,
      round: state.campaign.roundIndex + 1,
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
  state: GameState,
  dt: number,
  bursts: HazardBurst[],
  _definition: GameDefinition
): void => {
  for (const enemy of state.enemies) enemy.spawnAge += dt;
  recordBurstIncidents(state, bursts);
};

const repathEnemy = (state: GameState, enemy: EnemyState, definition: GameDefinition): boolean => {
  const current = enemy.path[Math.min(enemy.pathIndex, enemy.path.length - 1)];
  if (!current) return false;
  const enemyDefinition = definition.enemies[enemy.type];
  const path = findEnemyPathBetween(
    {
      flying: enemyDefinition.flying,
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

const isClosedCoreThresholdStep = (
  step: EnemyState["path"][number],
  definition: GameDefinition
): boolean =>
  step.mode === "door" &&
  step.cell.column === definition.map.coreBreachCell.column &&
  step.cell.elevation === definition.map.coreBreachCell.elevation &&
  step.portalId !== null &&
  step.portalId ===
    facilityModelForMap(definition.map).cellDefinition(definition.map.coreBreachCell).portalId &&
  facilityModelForMap(definition.map).cellDefinition(step.cell).terrain === "door";

const nextEnemySegment = (
  state: GameState,
  enemy: EnemyState,
  definition: GameDefinition
): readonly [EnemyState["path"][number], EnemyState["path"][number]] | null => {
  let current = enemy.path[enemy.pathIndex];
  let next = enemy.path[enemy.pathIndex + 1];
  if (!current || !next) return null;
  if (
    facilityModelForMap(definition.map).cellIsTraversable(next.cell, state.portalStates) ||
    isClosedCoreThresholdStep(next, definition)
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
  state: GameState,
  enemy: EnemyState,
  room: RoomState | null,
  dt: number,
  gameDefinition: GameDefinition
): boolean => {
  const definition = gameDefinition.enemies[enemy.type];
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
    (room ? roomMovementMultiplier(room, definition.flying, gameDefinition) : 1) *
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

const breachCore = (state: GameState, enemy: EnemyState, gameDefinition: GameDefinition): void => {
  const definition = gameDefinition.enemies[enemy.type];
  const coreDamage = enemyStatsAtLevel(definition, enemy.level).coreDamage;
  state.coreIntegrity = Math.max(0, state.coreIntegrity - coreDamage);
  state.stats.breached += 1;
  state.stats.coreDamage += coreDamage;
  state.stats.breachesByRoute[enemy.routeId] =
    (state.stats.breachesByRoute[enemy.routeId] ?? 0) + 1;
  addEvent(state, "danger", "core_breached", { enemyType: enemy.type, coreDamage }, "core");
};

export const moveEnemies = (state: GameState, dt: number, definition: GameDefinition): void => {
  state.enemies = state.enemies.filter((enemy) => {
    const roomId = enemyRoomId(enemy, state.map);
    const room = roomId ? roomState(state, roomId) : null;
    if (!moveEnemy(state, enemy, room, dt, definition)) return true;
    breachCore(state, enemy, definition);
    return false;
  });
};

export const simulateEnemies = (state: GameState, dt: number, definition: GameDefinition): void => {
  resolveEnemyCombat(state, dt, [], definition);
  moveEnemies(state, dt, definition);
};
