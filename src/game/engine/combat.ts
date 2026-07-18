import { facilityModelForMap } from "../world/derivedModel";
import type { GameDefinition } from "../definitionTypes";
import type {
  CombatIncidentTarget,
  EnemyState,
  GameState,
  HazardChannels,
  RoomId,
  RoomState,
} from "../types";
import { levelDefinitionFor, roundDefinitionFor } from "./campaign";
import {
  addChannels,
  applyDamagePacketsWithScale,
  channelTotal,
  dominantAppliedDamagePacket,
  dominantLedgerSource,
  emptyDamageLedger,
  emptyHazardChannels,
  type AppliedDamagePacket,
  type DamageApplication,
  type DamagePacket,
  type HazardBurst,
} from "./damage";
import { addCombatIncident, addEvent } from "./events";
import {
  collectExposureIncidents,
  environmentalDamagePackets,
  recordExposureIncidents,
  type ExposureIncidentBuilders,
} from "./exposureIncidents";
import { clamp } from "./math";
import { findEnemyPath, findEnemyPathBetween } from "./navigation";
import { roomMovementMultiplier } from "./roomState";
import { enemyGasZone, enemyRoomId, enemyWorldPosition } from "./enemyPosition";
import type { WorldMap } from "../world/map";
import {
  enemyBehaviorSpeedMultiplier,
  ENEMY_WORLD_SPEED_SCALE,
  LOCOMOTION_SPEED,
} from "./enemyMovementRules";
import { enemyStatsAtLevel, resolveEnemyLevel } from "./enemyLevel";
import { roomState } from "../world/instances";
import { initialEnemyBehaviorState, transitionArmoredMolt } from "./enemyBehaviors";
import { sharedFieldDamageScales } from "./enemyField";

export { enemyRoomId, enemyWorldPosition } from "./enemyPosition";

const burstPacket = (
  burst: HazardBurst,
  index: number,
  enemy: EnemyState,
  map: WorldMap
): DamagePacket => ({
  key: `burst:${index}`,
  sourceId: burst.sourceId,
  channels: {
    ...burst.channels,
    heat: burst.zone === null || burst.zone === enemyGasZone(enemy, map) ? burst.channels.heat : 0,
  },
});

export const spawnEnemies = (state: GameState, gameDefinition: GameDefinition): void => {
  const level = levelDefinitionFor(state, gameDefinition);
  const wave = roundDefinitionFor(state, gameDefinition).wave;
  while (state.spawnCursor < wave.length) {
    const entry = wave[state.spawnCursor];
    if (!entry || entry.at > state.phaseTime) break;
    const definition = gameDefinition.enemies[entry.type];
    const path = findEnemyPath(
      { flying: definition.flying, portalStates: state.portalStates },
      state.map
    );
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
    });
    state.nextEnemyId += 1;
    state.spawnCursor += 1;
    state.stats.spawned += 1;
  }
};

const appliedPacketFor = (
  application: DamageApplication,
  key: string
): AppliedDamagePacket | null => application.packets.find((packet) => packet.key === key) ?? null;

const neutralizeEnemy = (
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

interface IncidentBuilder {
  burst: HazardBurst;
  targets: CombatIncidentTarget[];
  damageByChannel: HazardChannels;
}

const incidentTone = (hitCount: number, killed: number): "good" | "warning" | "reaction" => {
  if (killed > 0) return "good";
  return hitCount > 0 ? "warning" : "reaction";
};

const recordBurstIncidents = (state: GameState, builders: IncidentBuilder[]): void => {
  for (const builder of builders) {
    const incident = addCombatIncident(state, {
      elapsed: state.elapsed,
      levelId: state.campaign.levelId,
      round: state.campaign.roundIndex + 1,
      phase: state.phase,
      roomId: builder.burst.roomId,
      zone: builder.burst.zone,
      sourceId: builder.burst.sourceId,
      reactionExtent: builder.burst.reactionExtent,
      pressureImpulse: builder.burst.pressureImpulse,
      heatDelta: builder.burst.heatDelta,
      damageByChannel: builder.damageByChannel,
      targets: builder.targets,
    });
    const killed = builder.targets.filter((target) => target.killed).length;
    const damage = channelTotal(builder.damageByChannel);
    addEvent(
      state,
      incidentTone(builder.targets.length, killed),
      "flash_incident",
      {
        hitCount: builder.targets.length,
        killed,
        damage: Math.round(damage),
        pressureImpulse: Math.round(builder.burst.pressureImpulse),
        reactionExtent: builder.burst.reactionExtent,
      },
      builder.burst.roomId,
      incident.id
    );
  }
};

const recordEnemyIncidents = (
  enemy: EnemyState,
  roomId: RoomId | null,
  position: ReturnType<typeof enemyWorldPosition>,
  application: DamageApplication,
  lethalPacket: AppliedDamagePacket | null,
  matchingBurstIndices: number[],
  builders: IncidentBuilder[],
  exposureBuilders: ExposureIncidentBuilders
): void => {
  if (roomId) {
    collectExposureIncidents(exposureBuilders, roomId, enemy, position, application, lethalPacket);
  }
  for (const index of matchingBurstIndices) {
    const packet = appliedPacketFor(application, `burst:${index}`);
    if (!packet || packet.amount <= 0) continue;
    const builder = builders[index] as IncidentBuilder;
    addChannels(builder.damageByChannel, packet.channels);
    builder.targets.push({
      enemyId: enemy.id,
      enemyType: enemy.type,
      worldPosition: position,
      healthBefore: application.healthBefore,
      healthAfter: application.healthAfter,
      damageByChannel: { ...packet.channels },
      killed: application.killed && lethalPacket?.key === packet.key,
    });
  }
};

const resolveCombatForEnemy = (
  state: GameState,
  enemy: EnemyState,
  dt: number,
  bursts: HazardBurst[],
  builders: IncidentBuilder[],
  exposureBuilders: ExposureIncidentBuilders,
  definition: GameDefinition,
  incomingScale: number
): boolean => {
  const position = enemyWorldPosition(enemy);
  const roomId = enemyRoomId(enemy, state.map);
  enemy.spawnAge += dt;
  const matchingBurstIndices = bursts.flatMap((burst, index) =>
    roomId !== null && burst.roomId === roomId ? [index] : []
  );
  const packets = [
    ...(roomId
      ? environmentalDamagePackets(roomState(state, roomId), enemy, dt, state.map, definition)
      : []),
    ...matchingBurstIndices.map((index) =>
      burstPacket(bursts[index] as HazardBurst, index, enemy, state.map)
    ),
  ];
  const application = applyDamagePacketsWithScale(state, enemy, packets, incomingScale, definition);
  const lethalPacket = dominantAppliedDamagePacket(application.packets);
  recordEnemyIncidents(
    enemy,
    roomId,
    position,
    application,
    lethalPacket,
    matchingBurstIndices,
    builders,
    exposureBuilders
  );
  transitionArmoredMolt(state, enemy, roomId, application.killed);
  if (!application.killed || !roomId) return true;
  neutralizeEnemy(state, enemy, roomId, application, definition);
  return false;
};

/**
 * Resolves all continuous exposure and instantaneous reaction bursts before movement.
 * Bursts are recorded even when they occur during prime or find an empty room.
 */
export const resolveEnemyCombat = (
  state: GameState,
  dt: number,
  bursts: HazardBurst[],
  definition: GameDefinition
): void => {
  const builders = bursts.map<IncidentBuilder>((burst) => ({
    burst,
    targets: [],
    damageByChannel: emptyHazardChannels(),
  }));
  const exposureBuilders: ExposureIncidentBuilders = new Map();
  const incomingScales = sharedFieldDamageScales(state, dt, bursts, definition);
  state.enemies = state.enemies.filter((enemy) =>
    resolveCombatForEnemy(
      state,
      enemy,
      dt,
      bursts,
      builders,
      exposureBuilders,
      definition,
      incomingScales.get(enemy.id) ?? 1
    )
  );
  recordExposureIncidents(state, exposureBuilders);
  recordBurstIncidents(state, builders);
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
  let travel =
    definition.speed *
    enemyBehaviorSpeedMultiplier(enemy, definition) *
    ENEMY_WORLD_SPEED_SCALE *
    (room ? roomMovementMultiplier(room, definition.flying, gameDefinition) : 1) *
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
