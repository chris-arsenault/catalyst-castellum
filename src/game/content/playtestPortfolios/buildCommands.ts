import type { GameCommand, RoomId } from "../../types";
import { processLineId } from "../../world/map";
import type { ReferenceBuildDefinition } from "../playtestPortfolios";

export const portfolioRound = (
  commands: readonly GameCommand[] = []
): ReferenceBuildDefinition["rounds"][number] => ({ commands, primeFraction: 1 });

export const install = (
  roomId: RoomId,
  socketId: "socket_a" | "socket_b",
  equipmentId: Extract<GameCommand, { type: "install_equipment" }>["equipmentId"]
): GameCommand => ({ type: "install_equipment", roomId, socketId, equipmentId });

export const upgrade = (roomId: RoomId, socketId: "socket_a" | "socket_b"): GameCommand => ({
  type: "upgrade_equipment",
  roomId,
  socketId,
});

export const buildLine = (
  kind: "gas_line" | "liquid_line",
  fromRoomId: RoomId,
  toRoomId: RoomId
): readonly GameCommand[] => {
  const connectionId = processLineId(kind, fromRoomId, toRoomId);
  return [
    { type: "build_connection", kind, fromRoomId, toRoomId },
    { type: "set_conduit", connectionId, enabled: true },
  ];
};

export const GAS_CHARGE: GameCommand = {
  type: "charge_gas_source",
  sourceId: "gas_reservoir",
};

export const SPECIALTY_GAS_CHARGE: GameCommand = {
  type: "charge_gas_source",
  sourceId: "specialty_gas_reservoir",
};

export const HAZARD_GAS_CHARGE: GameCommand = {
  type: "charge_gas_source",
  sourceId: "hazard_gas_reservoir",
};

export const loadMedium = (
  roomId: RoomId,
  socketId: "socket_a" | "socket_b",
  medium: Extract<GameCommand, { type: "load_vessel_medium" }>["medium"]
): GameCommand => ({ type: "load_vessel_medium", roomId, socketId, medium });

export const LIQUID_CHARGES: readonly GameCommand[] = [
  { type: "charge_liquid_source", sourceId: "liquid_reservoir_a" },
  { type: "charge_liquid_source", sourceId: "liquid_reservoir_b" },
];
