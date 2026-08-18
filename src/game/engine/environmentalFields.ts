import type { EnvironmentalField, GameState, GasZone, TowerInstance } from "../types";
import { enemyGasZone, enemyRoomId } from "./enemyPosition";
import { clamp } from "./math";
import { towerRoomId } from "./towerPlacement";

type FieldDefinition = Omit<EnvironmentalField, "remaining" | "intensity"> & {
  intensity: number;
  duration: number;
};

export const upsertEnvironmentalField = (state: GameState, incoming: FieldDefinition): void => {
  const field: EnvironmentalField = {
    id: incoming.id,
    sourceId: incoming.sourceId,
    effect: incoming.effect,
    roomId: incoming.roomId,
    zone: incoming.zone,
    intensity: incoming.intensity,
    remaining: incoming.duration,
    decayPerSecond: incoming.decayPerSecond,
    stacking: incoming.stacking,
    species: incoming.species,
  };
  const index = state.environmentalFields.findIndex((candidate) => candidate.id === field.id);
  if (index < 0) state.environmentalFields.push(field);
  else state.environmentalFields[index] = field;
  state.environmentalFields.sort((left, right) => left.id.localeCompare(right.id));
};

export const tickEnvironmentalFields = (state: GameState, dt: number): void => {
  state.environmentalFields = state.environmentalFields
    .map((field) => ({
      ...field,
      remaining: Math.max(0, field.remaining - dt),
      intensity: Math.max(0, field.intensity - field.decayPerSecond * dt),
    }))
    .filter((field) => field.remaining > 0 && field.intensity > 0);
};

const zoneMatches = (field: EnvironmentalField, zone: GasZone): boolean =>
  field.zone === "both" || field.zone === zone;

export const environmentalFieldIntensity = (
  state: GameState,
  roomId: string,
  zone: GasZone,
  effect: EnvironmentalField["effect"]
): number => {
  const fields = state.environmentalFields.filter(
    (field) => field.roomId === roomId && field.effect === effect && zoneMatches(field, zone)
  );
  const strongest = fields
    .filter((field) => field.stacking === "strongest")
    .reduce((maximum, field) => Math.max(maximum, field.intensity), 0);
  const additive = fields
    .filter((field) => field.stacking === "additive")
    .reduce((total, field) => total + field.intensity, 0);
  return clamp(strongest + additive, 0, 0.9);
};

const towerZone = (state: GameState, tower: TowerInstance): GasZone => {
  const roomId = towerRoomId(state, tower);
  const room = roomId ? state.map.rooms[roomId] : null;
  if (!room) return "lower";
  const midpoint = room.bounds.elevation + room.bounds.height / 2;
  return tower.placement.firingOrigin.elevation >= midpoint ? "upper" : "lower";
};

export const environmentalTowerRangeMultiplier = (
  state: GameState,
  tower: TowerInstance
): number => {
  const roomId = towerRoomId(state, tower);
  if (!roomId) return 1;
  const zone = towerZone(state, tower);
  const obscured = environmentalFieldIntensity(state, roomId, zone, "visibility");
  const revealed = environmentalFieldIntensity(state, roomId, zone, "reveal");
  return clamp(1 - obscured + revealed, 0.45, 1.35);
};

export const environmentalTowerCadenceMultiplier = (
  state: GameState,
  tower: TowerInstance
): number => {
  const roomId = towerRoomId(state, tower);
  return roomId
    ? 1 + environmentalFieldIntensity(state, roomId, towerZone(state, tower), "cadence")
    : 1;
};

export const environmentalEnemyMovementMultiplier = (
  state: GameState,
  enemy: GameState["enemies"][number]
): number => {
  const roomId = enemyRoomId(enemy, state.map);
  if (!roomId) return 1;
  const intensity = environmentalFieldIntensity(
    state,
    roomId,
    enemyGasZone(enemy, state.map),
    "movement"
  );
  return Math.max(0.35, 1 - intensity);
};
