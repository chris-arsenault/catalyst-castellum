import type { GridCell } from "../../types";
import type { ArchitecturalConnection, CellRect, MapRoom, WorldMap } from "../../world/map";
import { materializeRouteGraph } from "../../world/routes";
import { facilityModelForMap } from "../../world/derivedModel";

const room = (id: string, code: string, bounds: CellRect, ladder: boolean): MapRoom => ({
  id,
  code,
  bounds,
  structure: id === "core" ? "core" : "room",
  provenance: id === "core" || id === "washlock" ? "hull" : "site",
  ambientTemperature: 22,
  socketCount: 0,
  socketCells: {},
  platformCells: [],
  graftSlots: [],
  ladderCells: ladder
    ? Array.from({ length: bounds.height }, (_, offset) => ({
        column: bounds.column + Math.floor(bounds.width / 2),
        elevation: bounds.elevation + offset,
      }))
    : [],
  taps: {
    gas: { capacity: 18, includeRoomInventory: false, roomPortHeight: 0.72, sourceIds: [] },
    liquid: { capacity: 18, includeRoomInventory: false, roomPortHeight: 0.12, sourceIds: [] },
  },
});

const connection = (
  id: string,
  rooms: readonly [string, string],
  endpoints: readonly [GridCell, GridCell],
  connectorCells: readonly GridCell[],
  vertical = false
): ArchitecturalConnection => ({
  id,
  rooms,
  endpoints,
  connectorCells,
  kind: vertical ? "ladder_shaft" : "passage",
  orientation: vertical ? "vertical" : "horizontal",
  hostRoomId: rooms[0],
  sillElevation: Math.min(...endpoints.map((cell) => cell.elevation)),
  aperture: 1,
  gasConductance: 0,
  liquidConductance: 0,
  liquidMode: "blocked",
  defaultOpen: true,
  defaultSealed: false,
  sealGroupId: null,
});

const createRooms = (): MapRoom[] => [
  {
    ...room("west_intake", "ENTRY", { column: 2, elevation: 4, width: 4, height: 6 }, false),
    structure: "entry" as const,
  },
  room("switchyard", "HB-01", { column: 7, elevation: 4, width: 12, height: 7 }, false),
  room("lower_intake", "HB-02", { column: 20, elevation: 4, width: 10, height: 7 }, true),
  room("reservoir", "HB-03", { column: 20, elevation: 12, width: 10, height: 7 }, true),
  room("furnace", "HB-04", { column: 31, elevation: 12, width: 10, height: 7 }, true),
  room("gallery", "HB-05", { column: 31, elevation: 4, width: 10, height: 7 }, true),
  room("washlock", "R-06", { column: 42, elevation: 4, width: 10, height: 9 }, false),
  room("core", "CORE", { column: 54, elevation: 4, width: 12, height: 16 }, false),
];
const point = (column: number, elevation: number): GridCell => ({ column, elevation });
const createConnections = (): ArchitecturalConnection[] => [
  connection(
    "entry_switchyard",
    ["west_intake", "switchyard"],
    [point(5, 4), point(7, 4)],
    [point(6, 4)]
  ),
  connection(
    "switchyard_intake",
    ["switchyard", "lower_intake"],
    [point(18, 4), point(20, 4)],
    [point(19, 4)]
  ),
  connection(
    "intake_rise",
    ["lower_intake", "reservoir"],
    [point(25, 10), point(25, 12)],
    [point(25, 11)],
    true
  ),
  connection(
    "upper_gallery",
    ["reservoir", "furnace"],
    [point(29, 12), point(31, 12)],
    [point(30, 12)]
  ),
  connection(
    "gallery_drop",
    ["furnace", "gallery"],
    [point(36, 12), point(36, 10)],
    [point(36, 11)],
    true
  ),
  connection(
    "gallery_washlock",
    ["gallery", "washlock"],
    [point(40, 4), point(42, 4)],
    [point(41, 4)]
  ),
  {
    ...connection(
      "washlock_to_core_door",
      ["washlock", "core"],
      [point(51, 4), point(54, 4)],
      [point(52, 4), point(53, 4)]
    ),
    kind: "core_door" as const,
    defaultOpen: false,
    defaultSealed: true,
  },
];
/** Harker's paired elevations and two ladder turns, compressed around the playable route. */
export const createHarkerExerciseMap = (): WorldMap => {
  const map: WorldMap = {
    width: 70,
    height: 24,
    cellSize: 16,
    ringRadii: { inner: 14, middle: 28 },
    coreAnchor: point(60, 12),
    coreBreachCell: point(52, 4),
    entryCell: point(2, 4),
    rooms: Object.fromEntries(createRooms().map((value) => [value.id, value])),
    connections: Object.fromEntries(createConnections().map((value) => [value.id, value])),
    utilityNodes: {},
    routeGraph: { coreNodeId: "core", nodes: {}, edges: {}, routes: {} },
  };
  map.routeGraph = materializeRouteGraph(
    map,
    [
      {
        id: "lower",
        roomId: "west_intake",
        offset: point(0, 0),
        movementCost: 1,
        eligibility: "all",
      },
      {
        id: "upper",
        roomId: "reservoir",
        offset: point(0, 0),
        movementCost: 1,
        eligibility: "all",
      },
    ],
    facilityModelForMap(map).initialPortalStates()
  );
  return map;
};
