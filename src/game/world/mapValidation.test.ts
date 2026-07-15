import { describe, expect, it } from "vitest";
import type { MapRoom, ProcessLineConnection, WorldMap } from "./map";
import { processLineId } from "./map";
import { validateWorldMap } from "./mapValidation";

const room = (id: string, column: number, elevation: number): MapRoom => ({
  id,
  bounds: { column, elevation, width: 4, height: 4 },
  socketCells: {},
  platformCells: [],
  ladderCells: [],
  taps: {
    gas: { capacity: 18, includeRoomInventory: true, roomPortHeight: 0.72, sourceIds: [] },
    liquid: { capacity: 18, includeRoomInventory: true, roomPortHeight: 0.12, sourceIds: [] },
  },
  provenance: "site",
});

const gasLine = (
  a: string,
  b: string,
  route: ProcessLineConnection["route"]
): ProcessLineConnection => ({
  id: processLineId("gas_line", a, b),
  kind: "gas_line",
  rooms: [a, b],
  direction: [a, b],
  destinationKind: "room",
  actuator: "fan",
  actuatorHead: 2,
  maxFlow: 2,
  volumePerCell: 0.2,
  buildCost: 10,
  route,
});

const mapWith = (connections: readonly ProcessLineConnection[]): WorldMap => ({
  width: 20,
  height: 12,
  cellSize: 16,
  coreAnchor: { column: 10, elevation: 2 },
  ringRadii: { inner: 4, middle: 8 },
  entryCell: { column: 0, elevation: 0 },
  coreBreachCell: { column: 9, elevation: 0 },
  rooms: { alpha: room("alpha", 0, 0), beta: room("beta", 8, 0) },
  connections: Object.fromEntries(connections.map((connection) => [connection.id, connection])),
  utilityNodes: {},
});

const straightRoute = [
  { column: 2, elevation: 2 },
  { column: 3, elevation: 2 },
  { column: 4, elevation: 2 },
  { column: 5, elevation: 2 },
  { column: 6, elevation: 2 },
  { column: 7, elevation: 2 },
  { column: 8, elevation: 2 },
  { column: 9, elevation: 2 },
];

describe("validateWorldMap", () => {
  it("accepts a well-formed map", () => {
    expect(validateWorldMap(mapWith([gasLine("alpha", "beta", straightRoute)]))).toEqual([]);
  });

  it("rejects diagonal route steps", () => {
    const issues = validateWorldMap(
      mapWith([
        gasLine("alpha", "beta", [
          { column: 2, elevation: 2 },
          { column: 3, elevation: 3 },
          { column: 9, elevation: 2 },
        ]),
      ])
    );
    expect(issues.some(({ message }) => message.includes("orthogonally adjacent"))).toBe(true);
  });

  it("rejects a route that ends outside its destination room", () => {
    const issues = validateWorldMap(mapWith([gasLine("alpha", "beta", straightRoute.slice(0, 5))]));
    expect(issues.some(({ message }) => message.includes("destination room"))).toBe(true);
  });

  it("rejects a second gas line on the same pair regardless of direction", () => {
    const reversed: ProcessLineConnection = {
      ...gasLine("beta", "alpha", [...straightRoute].reverse()),
      id: "gas:duplicate",
    };
    const issues = validateWorldMap(mapWith([gasLine("alpha", "beta", straightRoute), reversed]));
    expect(issues.some(({ message }) => message.includes("at most one gas_line"))).toBe(true);
  });

  it("rejects record key and declared id mismatches", () => {
    const map = mapWith([gasLine("alpha", "beta", straightRoute)]);
    map.rooms.alpha = { ...map.rooms.alpha, id: "gamma" } as MapRoom;
    const issues = validateWorldMap(map);
    expect(issues.some(({ path }) => path === "rooms.alpha.id")).toBe(true);
  });

  it("rejects connections and utility nodes referencing unknown rooms", () => {
    const map = mapWith([gasLine("alpha", "beta", straightRoute)]);
    map.utilityNodes = {
      gas_vent: { cell: { column: 1, elevation: 1 }, hostRoomId: "nowhere" },
    };
    const issues = validateWorldMap(map);
    expect(issues.some(({ message }) => message.includes("Unknown host room"))).toBe(true);
  });
});
