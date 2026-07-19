import type { GameDefinition } from "../definitionTypes";
import type {
  CombatIncidentTarget,
  DamageSourceId,
  EnemyState,
  GameState,
  HazardChannels,
  RoomId,
  RoomState,
} from "../types";
import type { WorldMap } from "../world/map";
import {
  addChannels,
  channelTotal,
  emptyHazardChannels,
  type AppliedDamagePacket,
  type DamageApplication,
  type DamagePacket,
} from "./damage";
import { enemyGasZone, enemyWorldPosition } from "./enemyPosition";
import { upsertContinuousCombatIncident } from "./events";
import { liquidSurfaceElevation, roomHazardsBySource } from "./physics";

export const environmentalDamagePackets = (
  room: RoomState,
  enemy: EnemyState,
  dt: number,
  map: WorldMap,
  gameDefinition: GameDefinition
): DamagePacket[] => {
  const definition = gameDefinition.enemies[enemy.type];
  const footElevation = enemyWorldPosition(enemy).elevation - 0.5;
  const floorContact =
    !definition.flying &&
    enemy.mode !== "climbing" &&
    enemy.mode !== "falling" &&
    liquidSurfaceElevation(room, gameDefinition) > footElevation;
  const hazards = roomHazardsBySource(
    room,
    floorContact,
    definition.needsOxygen,
    enemyGasZone(enemy, map),
    gameDefinition
  );
  return Object.entries(hazards).flatMap(([sourceId, sourceHazards]) => {
    const channels = {
      atmosphere: sourceHazards.atmosphere * dt,
      corrosion: sourceHazards.corrosion * dt,
      heat: sourceHazards.heat * dt,
      pressure: sourceHazards.pressure * dt,
      radiation: sourceHazards.radiation * dt,
    };
    return channelTotal(channels) > 0
      ? [{ key: `environment:${sourceId}`, sourceId: sourceId as DamageSourceId, channels }]
      : [];
  });
};

interface ExposureIncidentBuilder {
  roomId: RoomId;
  sourceId: DamageSourceId;
  targets: CombatIncidentTarget[];
  damageByChannel: HazardChannels;
}

export type ExposureIncidentBuilders = Map<string, ExposureIncidentBuilder>;

const exposureBuilderFor = (
  builders: ExposureIncidentBuilders,
  roomId: RoomId,
  sourceId: DamageSourceId
): ExposureIncidentBuilder => {
  const key = `${roomId}:${sourceId}`;
  const existing = builders.get(key);
  if (existing) return existing;
  const created = { roomId, sourceId, targets: [], damageByChannel: emptyHazardChannels() };
  builders.set(key, created);
  return created;
};

export const collectExposureIncidents = (
  builders: ExposureIncidentBuilders,
  roomId: RoomId,
  enemy: EnemyState,
  position: CombatIncidentTarget["worldPosition"],
  application: DamageApplication,
  lethalPacket: AppliedDamagePacket | null
): void => {
  for (const packet of application.packets) {
    if (!packet.key.startsWith("environment:")) continue;
    const builder = exposureBuilderFor(builders, roomId, packet.sourceId);
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

export const recordExposureIncidents = (
  state: GameState,
  builders: ExposureIncidentBuilders
): void => {
  for (const builder of builders.values()) {
    upsertContinuousCombatIncident(state, {
      elapsed: state.elapsed,
      levelId: state.campaign.levelId,
      round: state.campaign.roundIndex + 1,
      phase: state.phase,
      roomId: builder.roomId,
      zone: null,
      sourceId: builder.sourceId,
      reactionExtent: 0,
      pressureImpulse: 0,
      heatDelta: 0,
      damageByChannel: builder.damageByChannel,
      targets: builder.targets,
    });
  }
};
