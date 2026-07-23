import type { GameDefinition } from "../definitionTypes";
import {
  EQUIPMENT_SOCKET_IDS,
  EQUIPMENT_OUTPUT_IDS,
  type EquipmentGradeDefinition,
  type EquipmentId,
  type EquipmentInstance,
  type EquipmentLoadout,
  type EquipmentLevel,
  type EquipmentSocketId,
  type GameState,
  type RoomEquipment,
  type RoomId,
  type RoomState,
} from "../types";
import { emptyGas, emptyLiquid } from "../materials";
import { clamp } from "./math";
import { definitionRoom, type MapCarrier } from "../world/instances";

export const NATURAL_REACTION_MULTIPLIER = 0.55;

export const emptyRoomEquipment = (): RoomEquipment => ({ socket_a: null, socket_b: null });

export const createEquipmentInstance = (
  loadout: EquipmentLoadout,
  definition: GameDefinition
): EquipmentInstance => {
  const operationDefinition = definition.equipment[loadout.equipmentId].operation;
  const outputs = Object.fromEntries(EQUIPMENT_OUTPUT_IDS.map((id) => [id, null])) as NonNullable<
    EquipmentInstance["operation"]
  >["outputs"];
  if (!operationDefinition) return { ...loadout, operation: null, medium: null };
  for (const output of operationDefinition.outputs) {
    outputs[output.id] =
      output.phase === "gas"
        ? { phase: "gas", gas: emptyGas() }
        : { phase: "liquid", liquid: emptyLiquid() };
  }
  const primaryReactionId = operationDefinition.duties[0]?.reactionIds[0];
  if (!primaryReactionId)
    throw new Error(`Equipment ${loadout.equipmentId} operation has no duty.`);
  const firstReactant = definition.reactions[primaryReactionId].reactants[0];
  if (!firstReactant)
    throw new Error(`Equipment ${loadout.equipmentId} operation has no reactant.`);
  return {
    ...loadout,
    medium: null,
    operation: {
      lastRate: 0,
      totalProcessed: 0,
      limitingFactor: { kind: "species", speciesId: firstReactant.species, zone: null },
      powerDraw: 0,
      separatorLeakTotal: 0,
      outputs,
    },
  };
};

export const roomSocketIds = (roomId: RoomId, carrier: MapCarrier): EquipmentSocketId[] =>
  EQUIPMENT_SOCKET_IDS.slice(0, definitionRoom(carrier, roomId).socketCount);

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
  _definition: GameDefinition
): { roomId: RoomId; socketId: EquipmentSocketId; instance: EquipmentInstance } | null => {
  for (const [roomId, room] of Object.entries(state.rooms) as [RoomId, RoomState][]) {
    for (const socketId of roomSocketIds(roomId, state)) {
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

export const roomGasMixingRate = (room: RoomState, definition: GameDefinition): number => {
  const behavior = activeGrade(room, "gas_agitator", definition)?.behavior;
  return behavior?.kind === "gas_agitator" ? behavior.layerExchangeRate : 0;
};

export const roomGasReactionMultiplier = (room: RoomState, definition: GameDefinition): number => {
  const behavior = activeGrade(room, "gas_agitator", definition)?.behavior;
  return behavior?.kind === "gas_agitator"
    ? behavior.reactionMultiplier
    : NATURAL_REACTION_MULTIPLIER;
};

export const roomContactReactionMultiplier = (
  room: RoomState,
  definition: GameDefinition
): number => {
  const behavior = activeGrade(room, "wet_contactor", definition)?.behavior;
  return behavior?.kind === "wet_contactor"
    ? behavior.reactionMultiplier
    : NATURAL_REACTION_MULTIPLIER;
};

export const roomEquipmentVolume = (
  room: Pick<RoomState, "equipment">,
  definition: GameDefinition
): number =>
  installedEquipment(room).reduce(
    (total, instance) =>
      total + gradeFor(instance.equipmentId, instance.level, definition).occupiedVolume,
    0
  );

export const equipmentInvestedMatter = (
  instance: EquipmentInstance,
  gameDefinition: GameDefinition
): number => {
  const equipment = gameDefinition.equipment[instance.equipmentId];
  let total = equipment.buildCost;
  if (instance.level >= 2) total += equipment.upgradeCosts[0];
  if (instance.level >= 3) total += equipment.upgradeCosts[1];
  return total;
};

/** Dismantling before the wave refunds everything; after the wave starts, salvage recovers 75%. */
export const dismantleRefundRatio = (phase: GameState["phase"]): number =>
  phase === "build" ? 1 : 0.75;

export const equipmentDismantleRefund = (
  instance: EquipmentInstance,
  phase: GameState["phase"],
  definition: GameDefinition
): number =>
  Math.floor(equipmentInvestedMatter(instance, definition) * dismantleRefundRatio(phase));

const operationGradeBehavior = (
  equipmentId: EquipmentId,
  level: EquipmentLevel,
  definition: GameDefinition
) => {
  const behavior = gradeFor(equipmentId, level, definition).behavior;
  if (behavior.kind !== "electrolyzer" && behavior.kind !== "vessel")
    throw new Error(`Invalid operation grade ${equipmentId}`);
  return behavior;
};

export const operationProcessRate = (
  equipmentId: EquipmentId,
  level: EquipmentLevel,
  definition: GameDefinition
): number => operationGradeBehavior(equipmentId, level, definition).processRate;
export const operationPowerDraw = (
  equipmentId: EquipmentId,
  level: EquipmentLevel,
  definition: GameDefinition
): number => operationGradeBehavior(equipmentId, level, definition).powerDraw;

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
  definition: GameDefinition
): void => {
  for (const room of Object.values(state.rooms)) {
    const behavior = activeGrade(room, "thermal_coil", definition)?.behavior;
    if (behavior?.kind === "thermal_coil") heatRoom(room, behavior.targetTemperature, dt);
  }
};
