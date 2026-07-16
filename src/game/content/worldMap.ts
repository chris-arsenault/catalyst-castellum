import type { GridCell, RoomId } from "../types";
import { cell } from "../spatial";
import type { GasTapDefinition, LiquidTapDefinition, MapRoom, WorldMap } from "../world/map";
import { WORLD_MAP_CONNECTIONS } from "./worldMapConnections";
import { isProcessLine } from "../world/map";
import { routeConnection } from "../world/autoRouter";

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

interface RoomIdentity {
  code: string;
  structure: MapRoom["structure"];
  ambientTemperature?: number;
  socketCount?: MapRoom["socketCount"];
}

const room = (
  id: RoomId,
  identity: RoomIdentity,
  bounds: MapRoom["bounds"],
  overrides: Partial<Omit<MapRoom, "id" | "bounds">> = {}
): MapRoom => ({
  id,
  code: identity.code,
  structure: identity.structure,
  ambientTemperature: identity.ambientTemperature ?? 22,
  socketCount: identity.socketCount ?? 2,
  bounds,
  socketCells: {},
  platformCells: [],
  ladderCells: [],
  taps: { gas: gasTap(), liquid: liquidTap() },
  hardpoints: [],
  provenance: "site",
  ...overrides,
});

/** Compact, room-dominant side-view platform world authored in exact grid cells. */
const WORLD_MAP_BASE: WorldMap = {
  width: 76,
  height: 40,
  cellSize: 16,
  coreAnchor: cell(60, 12),
  ringRadii: { inner: 22, middle: 38 },
  entryCell: cell(1, 4),
  coreBreachCell: cell(49, 4),
  rooms: {
    west_intake: room(
      "west_intake",
      { code: "ENTRY", structure: "entry", socketCount: 0 },
      { column: 1, elevation: 4, width: 4, height: 8 }
    ),
    switchyard: room(
      "switchyard",
      { code: "R-01", structure: "room" },
      { column: 6, elevation: 4, width: 22, height: 8 },
      {
        socketCells: { socket_a: cell(12, 4), socket_b: cell(22, 4) },
        ladderCells: verticalCells(8, 4, 11),
      }
    ),
    furnace: room(
      "furnace",
      { code: "R-02", structure: "room" },
      { column: 6, elevation: 13, width: 15, height: 20 },
      {
        socketCells: { socket_a: cell(12, 13), socket_b: cell(18, 13) },
        platformCells: horizontalCells(9, 20, 23),
        ladderCells: verticalCells(8, 13, 24),
      }
    ),
    reservoir: room(
      "reservoir",
      { code: "R-03", structure: "room" },
      { column: 22, elevation: 24, width: 27, height: 9 },
      { socketCells: { socket_a: cell(32, 24), socket_b: cell(43, 24) } }
    ),
    gallery: room(
      "gallery",
      { code: "R-04", structure: "room" },
      { column: 22, elevation: 14, width: 12, height: 9 },
      { socketCells: { socket_a: cell(25, 14), socket_b: cell(31, 14) } }
    ),
    lower_intake: room(
      "lower_intake",
      { code: "R-05", structure: "room" },
      { column: 36, elevation: 14, width: 13, height: 9 },
      {
        socketCells: { socket_a: cell(39, 14), socket_b: cell(46, 14) },
        taps: { gas: gasTap({ capacity: 22 }), liquid: liquidTap({ capacity: 24 }) },
      }
    ),
    washlock: room(
      "washlock",
      { code: "R-06", structure: "room" },
      { column: 30, elevation: 4, width: 19, height: 9 },
      {
        socketCells: { socket_a: cell(35, 4), socket_b: cell(45, 4) },
        ladderCells: verticalCells(39, 4, 12),
        hardpoints: [
          { id: "forward", cell: cell(30, 4), facing: "left" },
          { id: "upper", cell: cell(39, 12), facing: "up" },
        ],
        provenance: "hull",
      }
    ),
    core: room(
      "core",
      { code: "CORE", structure: "core", ambientTemperature: 26, socketCount: 0 },
      { column: 51, elevation: 4, width: 18, height: 16 },
      {
        provenance: "hull",
        hardpoints: [],
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

/**
 * Process-line routes are computed shortest-path from the room layout, not hand-drawn.
 * The layout owns the geometry; a line is just its endpoints and parameters, and the
 * router (a pure overlay, so it may cross rooms) draws the direct path both the map and
 * the physics use. Authoring never maintains a route by hand.
 */
const routedConnections = (map: WorldMap): WorldMap["connections"] =>
  Object.fromEntries(
    Object.entries(map.connections).map(([id, connection]) => {
      if (!isProcessLine(connection)) return [id, connection];
      const route = routeConnection(
        map,
        connection.kind,
        connection.direction[0],
        connection.direction[1]
      );
      return [id, { ...connection, route: route ?? connection.route }];
    })
  );

export const WORLD_MAP: WorldMap = {
  ...WORLD_MAP_BASE,
  connections: routedConnections(WORLD_MAP_BASE),
};
