import type { GameDefinition } from "../definitionTypes";
import type {
  EnemyDefinition,
  EnemyState,
  EnemyType,
  GasZone,
  GameState,
  HazardChannels,
  RoomId,
} from "../types";
import { definitionForMap } from "../world/activeDefinition";
import { roomState } from "../world/instances";
import { requestedDamageForPackets, emptyDamageLedger } from "./damage";
import { initialEnemyBehaviorState } from "./enemyBehaviors";
import { enemyStatsAtLevel, resolveEnemyLevel } from "./enemyLevel";
import {
  enemyBehaviorSpeedMultiplier,
  ENEMY_WORLD_SPEED_SCALE,
  LOCOMOTION_SPEED,
} from "./enemyMovementRules";
import { enemyGasZone, enemyRoomId } from "./enemyPosition";
import { environmentalDamagePackets } from "./exposureIncidents";
import { findEnemyPath } from "./navigation";
import { roomMovementMultiplier } from "./physics";

export const DEFENSIVE_POSTURE_PROJECTION_SECONDS = 6;

export interface DefensiveRoomPosture {
  roomId: RoomId;
  damagePerTraversal: number;
  continuousDamagePerTraversal: number;
  pulseDamagePerTraversal: number;
  traversalSeconds: number;
  delaySeconds: number;
}

export interface DefensiveEnemyPosture {
  type: EnemyType;
  count: number;
  minimumLevel: number;
  maximumLevel: number;
  health: number;
  damagePerTraversal: number;
  traversalSeconds: number;
  delaySeconds: number;
  rooms: readonly DefensiveRoomPosture[];
}

export interface DefensivePosture {
  enemies: readonly DefensiveEnemyPosture[];
}

interface WaveEnemyGroup {
  type: EnemyType;
  count: number;
  minimumLevel: number;
  maximumLevel: number;
}

interface DefensiveBurstRate {
  roomId: RoomId;
  zone: GasZone | null;
  channelsPerSecond: HazardChannels;
}

const waveEnemyGroups = (state: GameState, definition: GameDefinition): WaveEnemyGroup[] => {
  const level = definition.levels[state.campaign.levelId];
  const round = level.rounds[Math.min(state.campaign.roundIndex, level.rounds.length - 1)];
  if (!round) return [];
  const groups = new Map<EnemyType, WaveEnemyGroup>();
  for (const entry of round.wave) {
    const enemyLevel = resolveEnemyLevel(level.enemyLevel, entry.levelOffset);
    const current = groups.get(entry.type);
    if (current) {
      current.count += 1;
      current.minimumLevel = Math.min(current.minimumLevel, enemyLevel);
      current.maximumLevel = Math.max(current.maximumLevel, enemyLevel);
      continue;
    }
    groups.set(entry.type, {
      type: entry.type,
      count: 1,
      minimumLevel: enemyLevel,
      maximumLevel: enemyLevel,
    });
  }
  return [...groups.values()];
};

const postureEnemy = (
  state: GameState,
  type: EnemyType,
  level: number,
  definition: GameDefinition
): EnemyState => {
  const enemy = definition.enemies[type];
  const health = enemyStatsAtLevel(enemy, level).health;
  return {
    id: -1,
    type,
    level,
    health,
    maxHealth: health,
    routeId: "defensive_posture",
    path: findEnemyPath({ flying: enemy.flying, portalStates: state.portalStates }, state.map),
    pathIndex: 0,
    progress: 0,
    mode: enemy.flying ? "flying" : "walking",
    facing: 1,
    spawnAge: 0,
    damageTaken: 0,
    damageBySource: emptyDamageLedger(),
    lastDamage: null,
    behavior: initialEnemyBehaviorState(enemy, level),
  };
};

const segmentSeconds = (
  enemy: EnemyState,
  enemyDefinition: EnemyDefinition,
  segmentIndex: number,
  movementMultiplier: number
): number => {
  const current = enemy.path[segmentIndex];
  const next = enemy.path[segmentIndex + 1];
  if (!current || !next) return 0;
  const length = Math.hypot(
    next.cell.column - current.cell.column,
    next.cell.elevation - current.cell.elevation
  );
  const modeEnemy = { ...enemy, mode: next.mode };
  return (
    length /
    (enemyDefinition.speed *
      ENEMY_WORLD_SPEED_SCALE *
      LOCOMOTION_SPEED[next.mode] *
      movementMultiplier *
      enemyBehaviorSpeedMultiplier(modeEnemy, enemyDefinition))
  );
};

const pulseDamageForSegment = (
  enemy: EnemyState,
  roomId: RoomId,
  zone: GasZone,
  seconds: number,
  burstRates: readonly DefensiveBurstRate[],
  definition: GameDefinition
): number =>
  burstRates
    .filter((burst) => burst.roomId === roomId && (burst.zone === null || burst.zone === zone))
    .reduce(
      (total, burst, burstIndex) =>
        total +
        requestedDamageForPackets(
          enemy,
          [
            {
              key: `posture-burst:${burstIndex}`,
              sourceId: "hydrogen_oxygen_combustion",
              channels: burst.channelsPerSecond,
            },
          ],
          definition
        ) *
          seconds,
      0
    );

const accumulateRoomPosture = (
  rooms: Map<RoomId, DefensiveRoomPosture>,
  roomId: RoomId,
  currentSeconds: number,
  drySeconds: number,
  continuousDamage: number,
  pulseDamage: number
): void => {
  const posture = rooms.get(roomId) ?? {
    roomId,
    damagePerTraversal: 0,
    continuousDamagePerTraversal: 0,
    pulseDamagePerTraversal: 0,
    traversalSeconds: 0,
    delaySeconds: 0,
  };
  posture.continuousDamagePerTraversal += continuousDamage;
  posture.pulseDamagePerTraversal += pulseDamage;
  posture.damagePerTraversal += continuousDamage + pulseDamage;
  posture.traversalSeconds += currentSeconds;
  posture.delaySeconds += currentSeconds - drySeconds;
  rooms.set(roomId, posture);
};

const enemyPosture = (
  state: GameState,
  group: WaveEnemyGroup,
  definition: GameDefinition,
  burstRates: readonly DefensiveBurstRate[]
): DefensiveEnemyPosture => {
  // The highest authored level is the useful conservative comparison for a mixed-level archetype.
  const enemy = postureEnemy(state, group.type, group.maximumLevel, definition);
  const enemyDefinition = definition.enemies[group.type];
  const rooms = new Map<RoomId, DefensiveRoomPosture>();
  let traversalSeconds = 0;
  let dryTraversalSeconds = 0;

  for (let index = 0; index < enemy.path.length - 1; index += 1) {
    const next = enemy.path[index + 1];
    if (!next) continue;
    enemy.pathIndex = index;
    enemy.progress = 0.5;
    enemy.mode = next.mode;
    const roomId = enemyRoomId(enemy, state.map);
    const zone = enemyGasZone(enemy, state.map);
    const room = roomId ? roomState(state, roomId) : null;
    const movement = room ? roomMovementMultiplier(room, enemyDefinition.flying, definition) : 1;
    const currentSeconds = segmentSeconds(enemy, enemyDefinition, index, movement);
    const drySeconds = segmentSeconds(enemy, enemyDefinition, index, 1);
    traversalSeconds += currentSeconds;
    dryTraversalSeconds += drySeconds;
    if (!roomId || !room) continue;

    const damagePerSecond = requestedDamageForPackets(
      enemy,
      environmentalDamagePackets(room, enemy, 1, state.map, definition),
      definition
    );
    const continuousDamage = damagePerSecond * currentSeconds;
    const pulseDamage = pulseDamageForSegment(
      enemy,
      roomId,
      zone,
      currentSeconds,
      burstRates,
      definition
    );
    accumulateRoomPosture(rooms, roomId, currentSeconds, drySeconds, continuousDamage, pulseDamage);
  }

  const roomPostures = [...rooms.values()];
  return {
    ...group,
    health: enemy.maxHealth,
    damagePerTraversal: roomPostures.reduce((total, room) => total + room.damagePerTraversal, 0),
    traversalSeconds,
    delaySeconds: traversalSeconds - dryTraversalSeconds,
    rooms: roomPostures,
  };
};

/**
 * Current, enemy-adjusted exposure across one traversal of the active route.
 * It intentionally excludes formation fields, exact future burst timing, and inventory depletion.
 */
export const defensivePostureForIncidents = (
  state: GameState,
  gameDefinition: GameDefinition,
  include: (incident: GameState["incidents"][number]) => boolean,
  seconds: number
): DefensivePosture => {
  const definition = definitionForMap(gameDefinition, state.map);
  const burstRates = burstRatesFor(state, definition, include, seconds);
  return {
    enemies: waveEnemyGroups(state, definition).map((group) =>
      enemyPosture(state, group, definition, burstRates)
    ),
  };
};

export const defensivePosture = (
  state: GameState,
  gameDefinition: GameDefinition
): DefensivePosture =>
  defensivePostureForIncidents(
    state,
    gameDefinition,
    (incident) =>
      incident.round === state.campaign.roundIndex + 1 &&
      incident.elapsed >= state.elapsed - DEFENSIVE_POSTURE_PROJECTION_SECONDS,
    DEFENSIVE_POSTURE_PROJECTION_SECONDS
  );

const burstRatesFor = (
  state: GameState,
  definition: GameDefinition,
  include: (incident: GameState["incidents"][number]) => boolean,
  seconds: number
): DefensiveBurstRate[] => {
  const flash = definition.reactions.hydrogen_oxygen_combustion.behavior;
  if (flash.kind !== "flash") return [];
  const grouped = new Map<string, DefensiveBurstRate>();
  for (const incident of state.incidents) {
    if (incident.sourceId !== "hydrogen_oxygen_combustion" || !include(incident)) continue;
    const key = `${incident.roomId}:${incident.zone ?? "all"}`;
    const current = grouped.get(key) ?? {
      roomId: incident.roomId,
      zone: incident.zone,
      channelsPerSecond: {
        atmosphere: 0,
        corrosion: 0,
        heat: 0,
        pressure: 0,
        radiation: 0,
      },
    };
    current.channelsPerSecond.pressure +=
      (flash.pressureDamageBase + incident.reactionExtent * flash.pressureDamagePerExtent) /
      seconds;
    current.channelsPerSecond.heat +=
      (incident.reactionExtent * flash.heatDamagePerExtent) / seconds;
    grouped.set(key, current);
  }
  return [...grouped.values()];
};
