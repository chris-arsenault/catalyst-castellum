import { describe, expect, it } from "vitest";
import { WORLD_MAP } from "../content/worldMap";
import { processLineId, type ProcessLineConnection } from "./map";
import { validateWorldMap } from "./mapValidation";
import { lineEndpointCell, routeConnection } from "./autoRouter";

const appended = (route: readonly { column: number; elevation: number }[]) => {
  const connection: ProcessLineConnection = {
    id: processLineId("gas_line", "reservoir", "washlock"),
    kind: "gas_line",
    rooms: ["reservoir", "washlock"],
    direction: ["reservoir", "washlock"],
    destinationKind: "room",
    actuator: "fan",
    actuatorHead: 1.5,
    maxFlow: 1.1,
    volumePerCell: 0.22,
    buildCost: 8,
    route,
  };
  return {
    ...WORLD_MAP,
    connections: { ...WORLD_MAP.connections, [connection.id]: connection },
  };
};

describe("deterministic orthogonal auto-router", () => {
  it("returns the identical route for identical requests", () => {
    const first = routeConnection(WORLD_MAP, "gas_line", "reservoir", "washlock");
    const second = routeConnection(WORLD_MAP, "gas_line", "reservoir", "washlock");
    expect(first).not.toBeNull();
    expect(second).toEqual(first);
  });

  it("routes between endpoint rooms with in-room endpoints and orthogonal steps", () => {
    const route = routeConnection(WORLD_MAP, "gas_line", "reservoir", "washlock");
    expect(route).not.toBeNull();
    if (!route) return;
    expect(route.length).toBeGreaterThan(1);
    expect(route[0]).toEqual(lineEndpointCell(WORLD_MAP, "reservoir", "gas_line"));
    expect(route.at(-1)).toEqual(lineEndpointCell(WORLD_MAP, "washlock", "gas_line"));
    for (let index = 1; index < route.length; index += 1) {
      const previous = route[index - 1]!;
      const step = route[index]!;
      expect(
        Math.abs(step.column - previous.column) + Math.abs(step.elevation - previous.elevation)
      ).toBe(1);
    }
    expect(validateWorldMap(appended(route))).toEqual([]);
  });

  it("puts gas endpoints high in a room and liquid endpoints low", () => {
    const gas = lineEndpointCell(WORLD_MAP, "furnace", "gas_line");
    const liquid = lineEndpointCell(WORLD_MAP, "furnace", "liquid_line");
    expect(gas.elevation).toBeGreaterThan(liquid.elevation);
  });

  it("takes the shortest orthogonal path (Manhattan length between endpoints)", () => {
    const route = routeConnection(WORLD_MAP, "gas_line", "reservoir", "washlock");
    expect(route).not.toBeNull();
    if (!route) return;
    const from = lineEndpointCell(WORLD_MAP, "reservoir", "gas_line");
    const to = lineEndpointCell(WORLD_MAP, "washlock", "gas_line");
    const manhattan = Math.abs(from.column - to.column) + Math.abs(from.elevation - to.elevation);
    // route includes both endpoints, so cell count = manhattan distance + 1.
    expect(route).toHaveLength(manhattan + 1);
  });

  it("rejects a self-pair and unknown rooms", () => {
    expect(routeConnection(WORLD_MAP, "gas_line", "furnace", "furnace")).toBeNull();
    expect(routeConnection(WORLD_MAP, "gas_line", "furnace", "nowhere")).toBeNull();
  });
});
