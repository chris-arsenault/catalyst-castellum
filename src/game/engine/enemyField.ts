import type { GameDefinition } from "../definitionTypes";
import { DAMAGE_SOURCE_IDS, type EnemyState, type GameState } from "../types";
import type { WorldMap } from "../world/map";
import { roomState } from "../world/instances";
import {
  requestedDamageBySourceForPackets,
  requestedDamageForPackets,
  type DamagePacket,
  type HazardBurst,
} from "./damage";
import { enemyGasZone, enemyRoomId } from "./enemyPosition";
import { environmentalDamagePackets } from "./exposureIncidents";

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

const damagePacketsForEnemy = (
  state: GameState,
  enemy: EnemyState,
  dt: number,
  bursts: HazardBurst[],
  definition: GameDefinition
): DamagePacket[] => {
  const roomId = enemyRoomId(enemy, state.map);
  return [
    ...(roomId
      ? environmentalDamagePackets(roomState(state, roomId), enemy, dt, state.map, definition)
      : []),
    ...bursts.flatMap((burst, index) =>
      roomId !== null && burst.roomId === roomId
        ? [burstPacket(burst, index, enemy, state.map)]
        : []
    ),
  ];
};

const activeAnchor = (occupants: EnemyState[]): EnemyState | null =>
  occupants
    .filter(
      (enemy) =>
        enemy.behavior.kind === "shared_field" && enemy.behavior.active && enemy.behavior.charge > 0
    )
    .sort((left, right) => left.id - right.id)[0] ?? null;

const spendRoomField = (
  state: GameState,
  occupants: EnemyState[],
  dt: number,
  bursts: HazardBurst[],
  definition: GameDefinition,
  scales: Map<number, number>
): void => {
  const anchor = activeAnchor(occupants);
  if (!anchor || anchor.behavior.kind !== "shared_field") return;
  const requests = occupants
    .filter((enemy) => enemy.id !== anchor.id)
    .map((enemy) => {
      const packets = damagePacketsForEnemy(state, enemy, dt, bursts, definition);
      return {
        enemy,
        damage: requestedDamageForPackets(enemy, packets, definition),
        damageBySource: requestedDamageBySourceForPackets(enemy, packets, definition),
      };
    });
  const requested = requests.reduce((total, entry) => total + entry.damage, 0);
  if (requested <= 0) return;
  const absorbed = Math.min(anchor.behavior.charge, requested);
  const scale = 1 - absorbed / requested;
  for (const { enemy, damage } of requests) {
    if (damage > 0) scales.set(enemy.id, scale);
  }
  anchor.behavior.charge -= absorbed;
  if (anchor.behavior.charge <= 0.001) anchor.behavior.active = false;
  state.stats.fieldDamageAbsorbed += absorbed;
  for (const sourceId of DAMAGE_SOURCE_IDS) {
    const sourceRequested = requests.reduce(
      (total, request) => total + request.damageBySource[sourceId],
      0
    );
    state.stats.fieldDamageAbsorbedBySource[sourceId] += absorbed * (sourceRequested / requested);
  }
};

/** Resolves each room's single authored Anchor as a simultaneous proportional transaction. */
export const sharedFieldDamageScales = (
  state: GameState,
  dt: number,
  bursts: HazardBurst[],
  definition: GameDefinition
): Map<number, number> => {
  const scales = new Map<number, number>();
  const rooms = new Set(
    state.enemies.flatMap((enemy) => {
      const roomId = enemyRoomId(enemy, state.map);
      return roomId ? [roomId] : [];
    })
  );
  for (const roomId of rooms) {
    const occupants = state.enemies.filter((enemy) => enemyRoomId(enemy, state.map) === roomId);
    spendRoomField(state, occupants, dt, bursts, definition, scales);
  }
  return scales;
};
