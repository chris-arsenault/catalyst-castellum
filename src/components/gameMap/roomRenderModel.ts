import {
  FACILITY_MAP,
  GAS_COLORS,
  LIQUID_COLORS,
  ROOM_DEFINITIONS,
  facilityRingForRoom,
  roomAtmosphericCells,
  roomCenterWorld,
} from "../../game/config";
import { analyzeRoom } from "../../game/simulation";
import type { GameState, RoomId } from "../../game/types";
import {
  WORLD_PIXELS_PER_UNIT,
  colorNumber,
  gridCellMapRect,
  roomMapRect,
  worldToMapPoint,
} from "./mapGeometry";
import type { RoomDrawModel } from "./roomGraphics";

/** Pure projection from canonical room cells and simulation state to the room renderer. */
export const roomRenderModel = (
  game: GameState,
  roomId: RoomId,
  selected: boolean,
  occupied: number
): RoomDrawModel => {
  const definition = ROOM_DEFINITIONS[roomId];
  const room = game.rooms[roomId];
  const analysis = analyzeRoom(room);
  const dimensions = roomMapRect(roomId);
  const lowerGasColor = colorNumber(GAS_COLORS[analysis.lowerDominantGas]);
  const upperGasColor = colorNumber(GAS_COLORS[analysis.upperDominantGas]);
  const liquidColor = analysis.dominantLiquid
    ? colorNumber(LIQUID_COLORS[analysis.dominantLiquid])
    : 0x4ca9d6;
  const center = worldToMapPoint(roomCenterWorld(roomId));
  const zoneSplit =
    FACILITY_MAP.rooms[roomId].bounds.elevation + FACILITY_MAP.rooms[roomId].bounds.height / 2;
  return {
    width: dimensions.width,
    height: dimensions.height,
    structure: definition.structure,
    selected,
    analysis,
    ring: facilityRingForRoom(roomId),
    lowerGasColor,
    upperGasColor,
    liquidColor,
    cells: roomAtmosphericCells(roomId).map((atmosphericCell) => {
      const rect = gridCellMapRect(atmosphericCell);
      return {
        cell: atmosphericCell,
        left: rect.left - center.x,
        top: rect.top - center.y,
        size: WORLD_PIXELS_PER_UNIT,
        zone: atmosphericCell.elevation + 0.5 >= zoneSplit ? "upper" : "lower",
        liquidFill: Math.max(
          0,
          Math.min(1, analysis.liquidSurfaceElevation - atmosphericCell.elevation)
        ),
      };
    }),
    reactionIntensity: room.reactionIntensity,
    pressurePulse: room.pressurePulse,
    occupied,
    coreIntegrity: game.coreIntegrity,
  };
};
