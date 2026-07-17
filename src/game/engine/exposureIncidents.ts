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
  emptyHazardChannels,
  type AppliedDamagePacket,
  type DamageApplication,
  type DamagePacket,
} from "./damage";
import { enemyGasZone, enemyWorldPosition } from "./enemyPosition";
import { upsertContinuousCombatIncident } from "./events";
import { liquidSurfaceElevation } from "./physics";
import { roomHazards } from "./roomState";

const channelsWith = (channel: keyof HazardChannels, amount: number): HazardChannels => ({
  ...emptyHazardChannels(),
  [channel]: amount,
});

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
  const hazards = roomHazards(
    room,
    floorContact,
    definition.needsOxygen,
    enemyGasZone(enemy, map),
    gameDefinition
  );
  return [
    {
      key: "environment:atmospheric_exposure",
      sourceId: "atmospheric_exposure",
      channels: channelsWith("atmosphere", hazards.atmosphere * dt),
    },
    {
      key: "environment:surface_corrosion",
      sourceId: "surface_corrosion",
      channels: channelsWith("corrosion", hazards.corrosion * dt),
    },
    {
      key: "environment:thermal_exposure",
      sourceId: "thermal_exposure",
      channels: channelsWith("heat", hazards.heat * dt),
    },
    {
      key: "environment:catastrophic_overpressure",
      sourceId: "catastrophic_overpressure",
      channels: channelsWith("pressure", hazards.pressure * dt),
    },
    {
      key: "environment:radiation_field",
      sourceId: "radiation_field",
      channels: channelsWith("radiation", hazards.radiation * dt),
    },
  ];
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
