import type { EquipmentInstance, EquipmentSocketId, RoomId } from "../types";

type ScenarioRoomEquipment = Partial<
  Record<RoomId, Partial<Record<EquipmentSocketId, EquipmentInstance>>>
>;

export const TUTORIAL_EQUIPMENT: ScenarioRoomEquipment = {
  furnace: {
    socket_a: { equipmentId: "thermal_coil", level: 1, enabled: true },
    socket_b: { equipmentId: "gas_agitator", level: 1, enabled: true },
  },
  reservoir: {
    socket_a: { equipmentId: "wet_contactor", level: 1, enabled: true },
  },
  lower_intake: {
    socket_a: { equipmentId: "membrane_cell", level: 1, enabled: true },
  },
  washlock: {
    socket_a: { equipmentId: "wet_contactor", level: 1, enabled: true },
  },
};

export const TUTORIAL_INITIAL_TEMPERATURES: Partial<Record<RoomId, number>> = {
  furnace: 68,
};
