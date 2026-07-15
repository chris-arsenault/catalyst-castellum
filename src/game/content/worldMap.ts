import type { GridCell, RoomId } from "../types";
import { cell } from "../spatial";
import type { GasTapDefinition, LiquidTapDefinition, MapRoom, WorldMap } from "../world/map";
import { WORLD_MAP_CONNECTIONS } from "./worldMapConnections";

const horizontalCells = (fromColumn: number, toColumn: number, elevation: number): GridCell[] =>
  Array.from({ length: toColumn - fromColumn + 1 }, (_, index) =>
    cell(fromColumn + index, elevation)
  );

const verticalCells = (column: number, fromElevation: number, toElevation: number): GridCell[] =>
  Array.from({ length: toElevation - fromElevation + 1 }, (_, index) =>
    cell(column, fromElevation + index)
  );

const gasTap = (overrides: Partial<GasTapDefinition> = {}): GasTapDefinition => ({
  capacity: 18,
  includeRoomInventory: true,
  roomPortHeight: 0.72,
  sourceIds: [],
  ...overrides,
});

const liquidTap = (overrides: Partial<LiquidTapDefinition> = {}): LiquidTapDefinition => ({
  capacity: 18,
  includeRoomInventory: true,
  roomPortHeight: 0.12,
  sourceIds: [],
  ...overrides,
});

const room = (
  id: RoomId,
  bounds: MapRoom["bounds"],
  overrides: Partial<Omit<MapRoom, "id" | "bounds">> = {}
): MapRoom => ({
  id,
  bounds,
  socketCells: {},
  platformCells: [],
  ladderCells: [],
  taps: { gas: gasTap(), liquid: liquidTap() },
  provenance: "site",
  ...overrides,
});

/** Compact, room-dominant side-view platform world authored in exact grid cells. */
export const WORLD_MAP: WorldMap = {
  width: 76,
  height: 40,
  cellSize: 16,
  coreAnchor: cell(60, 12),
  ringRadii: { inner: 22, middle: 38 },
  entryCell: cell(1, 4),
  coreBreachCell: cell(49, 4),
  rooms: {
    west_intake: room("west_intake", { column: 1, elevation: 4, width: 4, height: 8 }),
    switchyard: room(
      "switchyard",
      { column: 6, elevation: 4, width: 22, height: 8 },
      {
        socketCells: { socket_a: cell(12, 4), socket_b: cell(22, 4) },
        ladderCells: verticalCells(8, 4, 11),
      }
    ),
    furnace: room(
      "furnace",
      { column: 6, elevation: 13, width: 15, height: 20 },
      {
        socketCells: { socket_a: cell(12, 13), socket_b: cell(18, 13) },
        platformCells: horizontalCells(9, 20, 23),
        ladderCells: verticalCells(8, 13, 24),
      }
    ),
    reservoir: room(
      "reservoir",
      { column: 22, elevation: 24, width: 27, height: 9 },
      { socketCells: { socket_a: cell(32, 24), socket_b: cell(43, 24) } }
    ),
    gallery: room(
      "gallery",
      { column: 22, elevation: 14, width: 12, height: 9 },
      { socketCells: { socket_a: cell(25, 14), socket_b: cell(31, 14) } }
    ),
    lower_intake: room(
      "lower_intake",
      { column: 36, elevation: 14, width: 13, height: 9 },
      {
        socketCells: { socket_a: cell(39, 14), socket_b: cell(46, 14) },
        taps: { gas: gasTap({ capacity: 22 }), liquid: liquidTap({ capacity: 24 }) },
      }
    ),
    washlock: room(
      "washlock",
      { column: 30, elevation: 4, width: 19, height: 9 },
      { socketCells: { socket_a: cell(35, 4), socket_b: cell(45, 4) } }
    ),
    core: room(
      "core",
      { column: 51, elevation: 4, width: 18, height: 16 },
      {
        taps: {
          gas: gasTap({
            capacity: 24,
            includeRoomInventory: false,
            sourceIds: ["starter_gas_header"],
          }),
          liquid: liquidTap({
            capacity: 28,
            includeRoomInventory: false,
            sourceIds: ["water_tank", "sodium_chloride_tank"],
          }),
        },
      }
    ),
  },
  connections: Object.fromEntries(
    WORLD_MAP_CONNECTIONS.map((connection) => [connection.id, connection])
  ),
  utilityNodes: {
    starter_gas_header: { cell: cell(54, 16), hostRoomId: "core" },
    water_tank: { cell: cell(54, 6), hostRoomId: "core" },
    sodium_chloride_tank: { cell: cell(58, 6), hostRoomId: "core" },
    gas_vent: { cell: cell(64, 16), hostRoomId: "core" },
    liquid_drain: { cell: cell(64, 6), hostRoomId: "core" },
  },
};
