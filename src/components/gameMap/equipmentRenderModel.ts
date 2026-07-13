import { EQUIPMENT_DEFINITIONS, FACILITY_MAP, ROOM_ORDER } from "../../game/config";
import {
  EQUIPMENT_SOCKET_IDS,
  type EquipmentId,
  type EquipmentLevel,
  type EquipmentSocketId,
  type GameState,
  type RoomId,
} from "../../game/types";
import { colorNumber, gridCellMapRect } from "./mapGeometry";

export const EQUIPMENT_MAP_CODES: Record<EquipmentId, string> = {
  gas_agitator: "MIX",
  wet_contactor: "WET",
  thermal_coil: "HEAT",
  membrane_cell: "CELL",
};

export interface EquipmentRenderModel {
  accent: number;
  code: string;
  enabled: boolean;
  equipmentId: EquipmentId;
  level: EquipmentLevel;
  roomId: RoomId;
  socketId: EquipmentSocketId;
  x: number;
  y: number;
}

export const equipmentRenderModels = (game: GameState): EquipmentRenderModel[] =>
  ROOM_ORDER.flatMap((roomId) =>
    EQUIPMENT_SOCKET_IDS.flatMap((socketId) => {
      const instance = game.rooms[roomId].equipment[socketId];
      const cell = FACILITY_MAP.rooms[roomId].socketCells[socketId];
      if (!instance || !cell) return [];
      const rect = gridCellMapRect(cell);
      return [
        {
          accent: colorNumber(EQUIPMENT_DEFINITIONS[instance.equipmentId].accent),
          code: EQUIPMENT_MAP_CODES[instance.equipmentId],
          enabled: instance.enabled,
          equipmentId: instance.equipmentId,
          level: instance.level,
          roomId,
          socketId,
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        },
      ];
    })
  );
