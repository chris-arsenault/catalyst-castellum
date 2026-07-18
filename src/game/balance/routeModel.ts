import type { GameDefinition } from "../definitionTypes";
import { enemyGasZone, enemyRoomId, enemyWorldPosition } from "../engine/enemyPosition";
import {
  enemyBehaviorSpeedMultiplier,
  ENEMY_WORLD_SPEED_SCALE,
  LOCOMOTION_SPEED,
} from "../engine/enemyMovementRules";
import { emptyDamageLedger } from "../engine/damage";
import { REFERENCE_ENEMY_LEVEL } from "../engine/enemyLevel";
import { initialEnemyBehaviorState } from "../engine/enemyBehaviors";
import { findEnemyPath } from "../engine/navigation";
import { conduitCapacity, conduitLength, conduitMaxFlow } from "../engine/networkGeometry";
import { roomMovementMultiplier } from "../engine/physics";
import { createGameRuntime } from "../runtime";
import type { EnemyDefinition, EnemyState, EnemyType, GameState, LevelId, RoomId } from "../types";
import { facilityModelForMap } from "../world/derivedModel";
import { isProcessLine } from "../world/map";

export interface RouteRoomProfile {
  roomId: RoomId;
  volume: number;
  cells: number;
  drySeconds: number;
  currentSeconds: number;
  currentMovementMultiplier: number;
}

export interface EnemyRouteProfile {
  levelId: LevelId;
  enemyType: EnemyType;
  pathCells: number;
  roomsVisited: number;
  drySeconds: number;
  currentSeconds: number;
  pressureSeconds: number;
  floodedSeconds: number | null;
  combinedDragSeconds: number | null;
  rooms: RouteRoomProfile[];
}

const syntheticEnemy = (
  type: EnemyType,
  state: GameState,
  definition: GameDefinition
): EnemyState => {
  const enemyDefinition = definition.enemies[type];
  const path = findEnemyPath(
    { flying: enemyDefinition.flying, portalStates: state.portalStates },
    state.map
  );
  return {
    id: -1,
    type,
    level: REFERENCE_ENEMY_LEVEL,
    health: enemyDefinition.health,
    maxHealth: enemyDefinition.health,
    routeId: "balance_probe",
    path,
    pathIndex: 0,
    progress: 0,
    mode: enemyDefinition.flying ? "flying" : "walking",
    facing: 1,
    spawnAge: 0,
    damageTaken: 0,
    damageBySource: emptyDamageLedger(),
    lastDamage: null,
    behavior: initialEnemyBehaviorState(enemyDefinition, REFERENCE_ENEMY_LEVEL),
  };
};

const roomForSegment = (enemy: EnemyState, index: number, state: GameState): RoomId | null => {
  enemy.pathIndex = index;
  enemy.progress = 0.5;
  return enemyRoomId(enemy, state.map);
};

const segmentSeconds = (
  enemy: EnemyState,
  index: number,
  speed: number,
  movementMultiplier: number,
  enemyDefinition: EnemyDefinition
): number => {
  const current = enemy.path[index];
  const next = enemy.path[index + 1];
  if (!current || !next) return 0;
  const length = Math.hypot(
    next.cell.column - current.cell.column,
    next.cell.elevation - current.cell.elevation
  );
  return (
    length /
    (speed *
      ENEMY_WORLD_SPEED_SCALE *
      LOCOMOTION_SPEED[next.mode] *
      movementMultiplier *
      enemyBehaviorSpeedMultiplier({ ...enemy, mode: next.mode }, enemyDefinition))
  );
};

const hypotheticalMovement = (
  state: GameState,
  roomId: RoomId,
  enemy: EnemyDefinition,
  gasPressureScale: number,
  liquidFillScale: number,
  definition: GameDefinition
): number | null => {
  const room = structuredClone(state.rooms[roomId]);
  if (!room) return null;
  const usableVolume = facilityModelForMap(state.map).roomVolume(roomId);
  if (liquidFillScale > 0) room.liquid.water = usableVolume * liquidFillScale;
  const remainingGasFraction = Math.max(0.08, 1 - liquidFillScale);
  for (const zone of ["lower", "upper"] as const) {
    for (const species of Object.keys(room.gas[zone]) as Array<
      keyof (typeof room.gas)[typeof zone]
    >) {
      room.gas[zone][species] *= remainingGasFraction * gasPressureScale;
    }
  }
  return roomMovementMultiplier(room, enemy.flying, definition);
};

interface SegmentMovement {
  roomId: RoomId | null;
  dry: number;
  current: number;
  currentMultiplier: number;
  pressure: number;
  flooded: number | null;
  combined: number | null;
}

const segmentMovement = (
  enemy: EnemyState,
  index: number,
  state: GameState,
  enemyDefinition: EnemyDefinition,
  definition: GameDefinition
): SegmentMovement => {
  const roomId = roomForSegment(enemy, index, state);
  const dry = segmentSeconds(enemy, index, enemyDefinition.speed, 1, enemyDefinition);
  if (!roomId) {
    return {
      roomId,
      dry,
      current: dry,
      currentMultiplier: 1,
      pressure: dry,
      flooded: dry,
      combined: dry,
    };
  }
  const currentMultiplier = roomMovementMultiplier(
    state.rooms[roomId]!,
    enemyDefinition.flying,
    definition
  );
  const pressureMultiplier =
    hypotheticalMovement(state, roomId, enemyDefinition, 1.7, 0, definition) ?? 1;
  const floodedMultiplier = hypotheticalMovement(
    state,
    roomId,
    enemyDefinition,
    1,
    0.6,
    definition
  );
  const combinedMultiplier = hypotheticalMovement(
    state,
    roomId,
    enemyDefinition,
    1.7,
    0.6,
    definition
  );
  const secondsAt = (multiplier: number): number =>
    segmentSeconds(enemy, index, enemyDefinition.speed, multiplier, enemyDefinition);
  return {
    roomId,
    dry,
    current: secondsAt(currentMultiplier),
    currentMultiplier,
    pressure: secondsAt(pressureMultiplier),
    flooded: floodedMultiplier === null ? null : secondsAt(floodedMultiplier),
    combined: combinedMultiplier === null ? null : secondsAt(combinedMultiplier),
  };
};

export const routeProfile = (
  levelId: LevelId,
  enemyType: EnemyType,
  definition: GameDefinition
): EnemyRouteProfile => {
  const state = createGameRuntime(definition).createScenario(levelId);
  const enemyDefinition = definition.enemies[enemyType];
  const enemy = syntheticEnemy(enemyType, state, definition);
  const perRoom = new Map<RoomId, { dry: number; current: number; movement: number }>();
  let drySeconds = 0;
  let currentSeconds = 0;
  let pressureSeconds = 0;
  let floodedSeconds = 0;
  let combinedDragSeconds = 0;
  let floodApplicable = true;
  for (let index = 0; index < enemy.path.length - 1; index += 1) {
    const segment = segmentMovement(enemy, index, state, enemyDefinition, definition);
    drySeconds += segment.dry;
    currentSeconds += segment.current;
    pressureSeconds += segment.pressure;
    if (segment.flooded === null || segment.combined === null) floodApplicable = false;
    else {
      floodedSeconds += segment.flooded;
      combinedDragSeconds += segment.combined;
    }
    if (segment.roomId) {
      const existing = perRoom.get(segment.roomId) ?? {
        dry: 0,
        current: 0,
        movement: segment.currentMultiplier,
      };
      existing.dry += segment.dry;
      existing.current += segment.current;
      existing.movement = Math.min(existing.movement, segment.currentMultiplier);
      perRoom.set(segment.roomId, existing);
    }
  }
  const model = facilityModelForMap(state.map);
  const rooms = [...perRoom.entries()].map(([roomId, times]) => ({
    roomId,
    volume: model.roomVolume(roomId),
    cells: model.roomAtmosphericCells(roomId).length,
    drySeconds: times.dry,
    currentSeconds: times.current,
    currentMovementMultiplier: times.movement,
  }));
  return {
    levelId,
    enemyType,
    pathCells: enemy.path.length,
    roomsVisited: rooms.length,
    drySeconds,
    currentSeconds,
    pressureSeconds,
    floodedSeconds: floodApplicable ? floodedSeconds : null,
    combinedDragSeconds: floodApplicable ? combinedDragSeconds : null,
    rooms,
  };
};

export interface ConduitFeedProfile {
  levelId: LevelId;
  connectionId: string;
  phase: "gas" | "liquid";
  routeLength: number;
  capacity: number;
  maximumFlow: number;
  idealPrimeSeconds: number;
}

export const conduitProfiles = (
  levelId: LevelId,
  definition: GameDefinition
): ConduitFeedProfile[] => {
  const state = createGameRuntime(definition).createScenario(levelId);
  return Object.values(state.map.connections).flatMap((connection) => {
    if (!isProcessLine(connection)) return [];
    const phase = connection.kind === "gas_line" ? "gas" : "liquid";
    const capacity = conduitCapacity(state, connection.id, phase, definition);
    const maximumFlow = conduitMaxFlow(state, connection.id, phase, definition);
    return [
      {
        levelId,
        connectionId: connection.id,
        phase,
        routeLength: conduitLength(state, connection.id, phase),
        capacity,
        maximumFlow,
        idealPrimeSeconds: maximumFlow > 0 ? capacity / maximumFlow : Number.POSITIVE_INFINITY,
      },
    ];
  });
};

export interface EnemyPositionSample {
  roomId: RoomId | null;
  zone: "lower" | "upper";
  x: number;
  elevation: number;
}

/** Exposed for tests and spreadsheet-style consumers that need the exact route sampling rule. */
export const routePositionSample = (
  state: GameState,
  enemyType: EnemyType,
  pathIndex: number,
  progress: number,
  definition: GameDefinition
): EnemyPositionSample => {
  const enemy = syntheticEnemy(enemyType, state, definition);
  enemy.pathIndex = pathIndex;
  enemy.progress = progress;
  const position = enemyWorldPosition(enemy);
  return {
    roomId: enemyRoomId(enemy, state.map),
    zone: enemyGasZone(enemy, state.map),
    x: position.x,
    elevation: position.elevation,
  };
};
