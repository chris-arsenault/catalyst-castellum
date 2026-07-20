import type { GameDefinition } from "../definitionTypes";
import type {
  ConnectionId,
  EnemyType,
  EquipmentId,
  EquipmentSocketId,
  GameState,
  RoomId,
} from "../types";
import { definitionForMap } from "../world/activeDefinition";
import { conduitState } from "../world/instances";
import {
  DEFENSIVE_POSTURE_PROJECTION_SECONDS,
  defensivePostureForIncidents,
  type DefensivePosture,
} from "./defensivePosture";
import { cloneGame } from "./roomState";
import { stepGame } from "./step";

export const CONDUIT_POSTURE_MAX_SECONDS = 30;

export interface DefensiveEnemyImpact {
  type: EnemyType;
  damageDelta: number;
  delayDelta: number;
  projectedDamagePerTraversal: number;
  health: number;
}

export interface DefensiveRoomImpact {
  roomId: RoomId;
  damageDelta: number;
  delayDelta: number;
  supportRateDelta: number;
  tone: "gain" | "loss" | "mixed" | "support";
}

export interface DefensiveEquipmentImpact {
  roomId: RoomId;
  socketId: EquipmentSocketId;
  equipmentId: EquipmentId;
  currentRate: number;
  projectedRate: number;
  rateDelta: number;
}

export interface ConduitDefensiveImpact {
  connectionId: ConnectionId;
  enabled: boolean;
  seconds: number;
  enemies: readonly DefensiveEnemyImpact[];
  rooms: readonly DefensiveRoomImpact[];
  equipment: readonly DefensiveEquipmentImpact[];
}

interface EquipmentOperationSnapshot {
  roomId: RoomId;
  socketId: EquipmentSocketId;
  equipmentId: EquipmentId;
  rate: number;
}

interface OperationalProjection {
  state: GameState;
  firstIncidentId: number;
}

interface MutableRoomImpact extends Omit<DefensiveRoomImpact, "tone"> {
  hasGain: boolean;
  hasLoss: boolean;
}

const roomDamage = (room: DefensivePosture["enemies"][number]["rooms"][number] | undefined) =>
  room?.damagePerTraversal ?? 0;

const roomDelay = (room: DefensivePosture["enemies"][number]["rooms"][number] | undefined) =>
  room?.delaySeconds ?? 0;

const operationalProjection = (
  source: GameState,
  seconds: number,
  gameDefinition: GameDefinition,
  conduitOverride?: { connectionId: ConnectionId; enabled: boolean }
): OperationalProjection => {
  let state = cloneGame(source);
  const firstIncidentId = state.nextIncidentId;
  state.phase = "prime";
  // A negative local clock holds chemistry in Prime for the comparison interval.
  state.phaseTime = -seconds;
  state.paused = false;
  state.speed = 1;
  state.enemies = [];
  state.spawnCursor = 0;
  if (conduitOverride) {
    conduitState(state, conduitOverride.connectionId).enabled = conduitOverride.enabled;
  }
  let remaining = seconds;
  while (remaining > 0) {
    const duration = Math.min(2, remaining);
    state = stepGame(state, duration, gameDefinition);
    remaining -= duration;
  }
  return { state, firstIncidentId };
};

const projectedPosture = (
  projection: OperationalProjection,
  gameDefinition: GameDefinition,
  seconds: number
): DefensivePosture =>
  defensivePostureForIncidents(
    projection.state,
    gameDefinition,
    (incident) => incident.id >= projection.firstIncidentId,
    seconds
  );

const operationSnapshots = (state: GameState): EquipmentOperationSnapshot[] =>
  Object.entries(state.rooms).flatMap(([roomId, room]) =>
    Object.entries(room.equipment).flatMap(([socketId, equipment]) =>
      equipment?.operation
        ? [
            {
              roomId,
              socketId: socketId as EquipmentSocketId,
              equipmentId: equipment.equipmentId,
              rate: equipment.operation.lastRate,
            },
          ]
        : []
    )
  );

const equipmentImpacts = (baseline: GameState, toggled: GameState): DefensiveEquipmentImpact[] => {
  const baselineBySocket = new Map(
    operationSnapshots(baseline).map((operation) => [
      `${operation.roomId}:${operation.socketId}`,
      operation,
    ])
  );
  return operationSnapshots(toggled)
    .map((projected) => {
      const current = baselineBySocket.get(`${projected.roomId}:${projected.socketId}`);
      const currentRate = current?.rate ?? 0;
      return {
        roomId: projected.roomId,
        socketId: projected.socketId,
        equipmentId: projected.equipmentId,
        currentRate,
        projectedRate: projected.rate,
        rateDelta: projected.rate - currentRate,
      };
    })
    .filter((impact) => Math.abs(impact.rateDelta) >= 0.001);
};

const addRoomImpact = (
  impacts: Map<RoomId, MutableRoomImpact>,
  roomId: RoomId,
  damageDelta = 0,
  delayDelta = 0,
  supportRateDelta = 0
): void => {
  const current = impacts.get(roomId) ?? {
    roomId,
    damageDelta: 0,
    delayDelta: 0,
    supportRateDelta: 0,
    hasGain: false,
    hasLoss: false,
  };
  current.damageDelta += damageDelta;
  current.delayDelta += delayDelta;
  current.supportRateDelta += supportRateDelta;
  current.hasGain ||= damageDelta >= 0.01 || delayDelta >= 0.01;
  current.hasLoss ||= damageDelta <= -0.01 || delayDelta <= -0.01;
  impacts.set(roomId, current);
};

const addEnemyRoomImpacts = (
  impacts: Map<RoomId, MutableRoomImpact>,
  baseline: DefensivePosture,
  projectedEnemy: DefensivePosture["enemies"][number]
): void => {
  const currentEnemy = baseline.enemies.find((enemy) => enemy.type === projectedEnemy.type);
  if (!currentEnemy) return;
  const roomIds = new Set([
    ...currentEnemy.rooms.map((room) => room.roomId),
    ...projectedEnemy.rooms.map((room) => room.roomId),
  ]);
  for (const roomId of roomIds) {
    const currentRoom = currentEnemy.rooms.find((room) => room.roomId === roomId);
    const projectedRoom = projectedEnemy.rooms.find((room) => room.roomId === roomId);
    addRoomImpact(
      impacts,
      roomId,
      roomDamage(projectedRoom) - roomDamage(currentRoom),
      roomDelay(projectedRoom) - roomDelay(currentRoom)
    );
  }
};

const roomImpactVisible = (impact: MutableRoomImpact): boolean =>
  Math.abs(impact.damageDelta) >= 0.01 ||
  Math.abs(impact.delayDelta) >= 0.01 ||
  Math.abs(impact.supportRateDelta) >= 0.001 ||
  impact.hasGain ||
  impact.hasLoss;

const roomImpactTone = (impact: MutableRoomImpact): DefensiveRoomImpact["tone"] => {
  if (impact.hasGain && impact.hasLoss) return "mixed";
  if (impact.hasGain) return "gain";
  if (impact.hasLoss) return "loss";
  return "support";
};

const roomImpacts = (
  baseline: DefensivePosture,
  toggled: DefensivePosture,
  equipment: readonly DefensiveEquipmentImpact[]
): DefensiveRoomImpact[] => {
  const impacts = new Map<RoomId, MutableRoomImpact>();
  for (const projectedEnemy of toggled.enemies) {
    addEnemyRoomImpacts(impacts, baseline, projectedEnemy);
  }
  for (const operation of equipment) {
    addRoomImpact(impacts, operation.roomId, 0, 0, operation.rateDelta);
  }
  return [...impacts.values()].filter(roomImpactVisible).map((impact) => {
    return {
      roomId: impact.roomId,
      damageDelta: impact.damageDelta,
      delayDelta: impact.delayDelta,
      supportRateDelta: impact.supportRateDelta,
      tone: roomImpactTone(impact),
    };
  });
};

const projectionSecondsFor = (
  source: GameState,
  definition: GameDefinition,
  requested?: number
): number => {
  if (requested !== undefined) return requested;
  const round = definition.levels[source.campaign.levelId].rounds[source.campaign.roundIndex];
  const elapsedPrime = source.phase === "prime" ? source.phaseTime : 0;
  const remaining = (round?.primeSeconds ?? DEFENSIVE_POSTURE_PROJECTION_SECONDS) - elapsedPrime;
  return Math.min(
    CONDUIT_POSTURE_MAX_SECONDS,
    Math.max(DEFENSIVE_POSTURE_PROJECTION_SECONDS, remaining)
  );
};

/** Equal held-operation branches differ only in one conduit setting. */
export const conduitDefensiveImpact = (
  source: GameState,
  connectionId: ConnectionId,
  enabled: boolean,
  gameDefinition: GameDefinition,
  seconds?: number
): ConduitDefensiveImpact => {
  const definition = definitionForMap(gameDefinition, source.map);
  const duration = projectionSecondsFor(source, definition, seconds);
  const baselineProjection = operationalProjection(source, duration, gameDefinition);
  const toggledProjection = operationalProjection(source, duration, gameDefinition, {
    connectionId,
    enabled,
  });
  const baseline = projectedPosture(baselineProjection, gameDefinition, duration);
  const toggled = projectedPosture(toggledProjection, gameDefinition, duration);
  const equipment = equipmentImpacts(baselineProjection.state, toggledProjection.state);
  return {
    connectionId,
    enabled,
    seconds: duration,
    enemies: toggled.enemies.map((projected) => {
      const current = baseline.enemies.find((enemy) => enemy.type === projected.type);
      return {
        type: projected.type,
        damageDelta: projected.damagePerTraversal - (current?.damagePerTraversal ?? 0),
        delayDelta: projected.delaySeconds - (current?.delaySeconds ?? 0),
        projectedDamagePerTraversal: projected.damagePerTraversal,
        health: projected.health,
      };
    }),
    rooms: roomImpacts(baseline, toggled, equipment),
    equipment,
  };
};

export const projectedDefensivePosture = (
  source: GameState,
  gameDefinition: GameDefinition,
  seconds = DEFENSIVE_POSTURE_PROJECTION_SECONDS
): DefensivePosture =>
  projectedPosture(operationalProjection(source, seconds, gameDefinition), gameDefinition, seconds);
