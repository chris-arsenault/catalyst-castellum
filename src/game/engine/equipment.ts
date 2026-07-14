import { DEFAULT_GAME_DEFINITION, type GameDefinition } from "../definition";
import {
  EQUIPMENT_SOCKET_IDS,
  type EquipmentGradeDefinition,
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

export const NATURAL_REACTION_MULTIPLIER = 0.55;

export const emptyRoomEquipment = (): RoomEquipment => ({ socket_a: null, socket_b: null });

export const roomSocketIds = (
  roomId: RoomId,
  definition: GameDefinition = DEFAULT_GAME_DEFINITION
): EquipmentSocketId[] => EQUIPMENT_SOCKET_IDS.slice(0, definition.rooms[roomId].socketCount);

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
  equipmentId: EquipmentId,
  definition: GameDefinition = DEFAULT_GAME_DEFINITION
): { roomId: RoomId; socketId: EquipmentSocketId; instance: EquipmentInstance } | null => {
  for (const [roomId, room] of Object.entries(state.rooms) as [RoomId, RoomState][]) {
    for (const socketId of roomSocketIds(roomId, definition)) {
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

const gradeFor = (
  equipmentId: EquipmentId,
  level: EquipmentLevel,
  definition: GameDefinition
): EquipmentGradeDefinition => {
  const grade = definition.equipment[equipmentId].grades.find(
    (candidate) => candidate.level === level
  );
  if (!grade) throw new Error(`Missing grade ${level} for ${equipmentId}`);
  return grade;
};

const activeGrade = (
  room: RoomState,
  equipmentId: EquipmentId,
  definition: GameDefinition
): EquipmentGradeDefinition | null => {
  const level = activeLevel(room, equipmentId);
  return level ? gradeFor(equipmentId, level, definition) : null;
};

export const roomEquipmentIsActive = (room: RoomState, equipmentId: EquipmentId): boolean =>
  activeLevel(room, equipmentId) !== null;

export const roomGasMixingRate = (
  room: RoomState,
  definition: GameDefinition = DEFAULT_GAME_DEFINITION
): number => {
  const behavior = activeGrade(room, "gas_agitator", definition)?.behavior;
  return behavior?.kind === "gas_agitator" ? behavior.layerExchangeRate : 0;
};

export const roomGasReactionMultiplier = (
  room: RoomState,
  definition: GameDefinition = DEFAULT_GAME_DEFINITION
): number => {
  const behavior = activeGrade(room, "gas_agitator", definition)?.behavior;
  return behavior?.kind === "gas_agitator"
    ? behavior.reactionMultiplier
    : NATURAL_REACTION_MULTIPLIER;
};

export const roomContactReactionMultiplier = (
  room: RoomState,
  definition: GameDefinition = DEFAULT_GAME_DEFINITION
): number => {
  const behavior = activeGrade(room, "wet_contactor", definition)?.behavior;
  return behavior?.kind === "wet_contactor"
    ? behavior.reactionMultiplier
    : NATURAL_REACTION_MULTIPLIER;
};

export const roomEquipmentVolume = (
  room: Pick<RoomState, "equipment">,
  definition: GameDefinition = DEFAULT_GAME_DEFINITION
): number =>
  installedEquipment(room).reduce(
    (total, instance) =>
      total + gradeFor(instance.equipmentId, instance.level, definition).occupiedVolume,
    0
  );

export const equipmentInvestedMatter = (
  instance: EquipmentInstance,
  gameDefinition: GameDefinition = DEFAULT_GAME_DEFINITION
): number => {
  const equipment = gameDefinition.equipment[instance.equipmentId];
  let total = equipment.buildCost;
  if (instance.level >= 2) total += equipment.upgradeCosts[0];
  if (instance.level >= 3) total += equipment.upgradeCosts[1];
  return total;
};

export const equipmentDismantleRefund = (
  instance: EquipmentInstance,
  definition: GameDefinition = DEFAULT_GAME_DEFINITION
): number => Math.floor(equipmentInvestedMatter(instance, definition) * 0.75);

const membraneCellBehavior = (level: EquipmentLevel, definition: GameDefinition) => {
  const behavior = gradeFor("membrane_cell", level, definition).behavior;
  if (behavior.kind !== "membrane_cell") throw new Error("Invalid membrane cell grade behavior");
  return behavior;
};

export const membraneCellRate = (
  level: EquipmentLevel,
  definition: GameDefinition = DEFAULT_GAME_DEFINITION
): number => membraneCellBehavior(level, definition).processRate;
export const membraneCellPower = (
  level: EquipmentLevel,
  definition: GameDefinition = DEFAULT_GAME_DEFINITION
): number => membraneCellBehavior(level, definition).powerDraw;

const heatRoom = (room: RoomState, target: number, dt: number): void => {
  const wallStep = clamp(target - room.temperature, 0, 18 * dt);
  room.temperature += wallStep;
  for (const zone of ["lower", "upper"] as const) {
    const gasStep = clamp(target - room.gasTemperature[zone], 0, 8 * dt);
    room.gasTemperature[zone] += gasStep;
  }
};

export const simulateInstalledEquipment = (
  state: GameState,
  dt: number,
  definition: GameDefinition = DEFAULT_GAME_DEFINITION
): void => {
  for (const room of Object.values(state.rooms)) {
    const behavior = activeGrade(room, "thermal_coil", definition)?.behavior;
    if (behavior?.kind === "thermal_coil") heatRoom(room, behavior.targetTemperature, dt);
  }
};
