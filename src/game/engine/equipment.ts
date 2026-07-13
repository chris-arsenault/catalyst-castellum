import { EQUIPMENT_DEFINITIONS, ROOM_DEFINITIONS, equipmentGrade } from "../config";
import {
  EQUIPMENT_SOCKET_IDS,
  type EquipmentId,
  type EquipmentInstance,
  type EquipmentLevel,
  type EquipmentSocketId,
  type GameState,
  type RoomEquipment,
  type RoomId,
  type RoomState,
} from "../types";
import { clamp } from "./math";

const NATURAL_REACTION_MULTIPLIER = 0.55;
const GAS_MIXING_RATES: Record<EquipmentLevel, number> = { 1: 1.5, 2: 1.85, 3: 2.2 };
const GAS_REACTION_MULTIPLIERS: Record<EquipmentLevel, number> = { 1: 1.5, 2: 2.15, 3: 3 };
const CONTACT_REACTION_MULTIPLIERS: Record<EquipmentLevel, number> = {
  1: 1,
  2: 1.45,
  3: 2,
};
const HEATER_TARGETS: Record<EquipmentLevel, number> = { 1: 68, 2: 92, 3: 120 };
const MEMBRANE_RATES: Record<EquipmentLevel, number> = { 1: 0.56, 2: 0.82, 3: 1.12 };
const MEMBRANE_POWER: Record<EquipmentLevel, number> = { 1: 67, 2: 98, 3: 134 };

export const emptyRoomEquipment = (): RoomEquipment => ({ socket_a: null, socket_b: null });

export const roomSocketIds = (roomId: RoomId): EquipmentSocketId[] =>
  EQUIPMENT_SOCKET_IDS.slice(0, ROOM_DEFINITIONS[roomId].socketCount);

export const installedEquipment = (room: Pick<RoomState, "equipment">): EquipmentInstance[] =>
  EQUIPMENT_SOCKET_IDS.flatMap((socketId) => {
    const instance = room.equipment[socketId];
    return instance ? [instance] : [];
  });

export const findRoomEquipment = (
  room: RoomState,
  equipmentId: EquipmentId
): EquipmentInstance | null =>
  installedEquipment(room).find((instance) => instance.equipmentId === equipmentId) ?? null;

export const findEquipmentInstallation = (
  state: GameState,
  equipmentId: EquipmentId
): { roomId: RoomId; socketId: EquipmentSocketId; instance: EquipmentInstance } | null => {
  for (const [roomId, room] of Object.entries(state.rooms) as [RoomId, RoomState][]) {
    for (const socketId of roomSocketIds(roomId)) {
      const instance = room.equipment[socketId];
      if (instance?.equipmentId === equipmentId) return { roomId, socketId, instance };
    }
  }
  return null;
};

const activeLevel = (room: RoomState, equipmentId: EquipmentId): EquipmentLevel | null => {
  const instance = findRoomEquipment(room, equipmentId);
  return instance?.enabled ? instance.level : null;
};

export const roomGasMixingRate = (room: RoomState): number => {
  const level = activeLevel(room, "gas_agitator");
  return level ? GAS_MIXING_RATES[level] : 0;
};

export const roomGasReactionMultiplier = (room: RoomState): number => {
  const level = activeLevel(room, "gas_agitator");
  return level ? GAS_REACTION_MULTIPLIERS[level] : NATURAL_REACTION_MULTIPLIER;
};

export const roomContactReactionMultiplier = (room: RoomState): number => {
  const level = activeLevel(room, "wet_contactor");
  return level ? CONTACT_REACTION_MULTIPLIERS[level] : NATURAL_REACTION_MULTIPLIER;
};

export const roomEquipmentVolume = (room: Pick<RoomState, "equipment">): number =>
  installedEquipment(room).reduce(
    (total, instance) =>
      total + equipmentGrade(instance.equipmentId, instance.level).occupiedVolume,
    0
  );

export const equipmentInvestedMatter = (instance: EquipmentInstance): number => {
  const definition = EQUIPMENT_DEFINITIONS[instance.equipmentId];
  let total = definition.buildCost;
  if (instance.level >= 2) total += definition.upgradeCosts[0];
  if (instance.level >= 3) total += definition.upgradeCosts[1];
  return total;
};

export const equipmentDismantleRefund = (instance: EquipmentInstance): number =>
  Math.floor(equipmentInvestedMatter(instance) * 0.75);

export const equipmentFunctionalSummary = (room: RoomState): string => {
  const equipment = installedEquipment(room);
  if (equipment.length === 0) return "Blank room · natural chemistry only";
  return equipment
    .map(
      (instance) =>
        `${EQUIPMENT_DEFINITIONS[instance.equipmentId].name} ${instance.level}${
          instance.enabled ? "" : " · off"
        }`
    )
    .join(" · ");
};

export const membraneCellRate = (level: EquipmentLevel): number => MEMBRANE_RATES[level];
export const membraneCellPower = (level: EquipmentLevel): number => MEMBRANE_POWER[level];

const heatRoom = (room: RoomState, target: number, dt: number): void => {
  const wallStep = clamp(target - room.temperature, 0, 18 * dt);
  room.temperature += wallStep;
  for (const zone of ["lower", "upper"] as const) {
    const gasStep = clamp(target - room.gasTemperature[zone], 0, 8 * dt);
    room.gasTemperature[zone] += gasStep;
  }
};

export const simulateInstalledEquipment = (state: GameState, dt: number): void => {
  for (const room of Object.values(state.rooms)) {
    const level = activeLevel(room, "thermal_coil");
    if (level) heatRoom(room, HEATER_TARGETS[level], dt);
  }
};
