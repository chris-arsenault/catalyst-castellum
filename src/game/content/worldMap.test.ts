import { describe, expect, it } from "vitest";
import { FACILITY_MAP } from "./facilityLayout";
import { CONDUIT_BLUEPRINTS } from "./facilityGeometry";
import { TRANSPORT_RUNS } from "./transportRuns";
import { GAS_JUNCTIONS, LIQUID_JUNCTIONS } from "./networkNodes";
import { isArchitectural, isProcessLine, processLineId } from "../world/map";
import { validateWorldMap } from "../world/mapValidation";
import { WORLD_MAP } from "./worldMap";

const connections = Object.values(WORLD_MAP.connections);
const architectural = connections.filter(isArchitectural);
const lines = connections.filter(isProcessLine);

describe("the authored world map reproduces the legacy structures exactly", () => {
  it("passes shared map validation", () => {
    expect(validateWorldMap(WORLD_MAP)).toEqual([]);
  });

  it("keeps the grid header", () => {
    expect(WORLD_MAP.width).toBe(FACILITY_MAP.width);
    expect(WORLD_MAP.height).toBe(FACILITY_MAP.height);
    expect(WORLD_MAP.cellSize).toBe(FACILITY_MAP.cellSize);
    expect(WORLD_MAP.coreAnchor).toEqual(FACILITY_MAP.coreAnchor);
    expect(WORLD_MAP.ringRadii).toEqual(FACILITY_MAP.ringRadii);
    expect(WORLD_MAP.entryCell).toEqual(FACILITY_MAP.entryCell);
    expect(WORLD_MAP.coreBreachCell).toEqual(FACILITY_MAP.coreBreachCell);
    expect(WORLD_MAP.utilityNodes).toEqual(FACILITY_MAP.utilityNodes);
  });

  it("reproduces every room's geometry and taps", () => {
    expect(Object.keys(WORLD_MAP.rooms).sort()).toEqual(Object.keys(FACILITY_MAP.rooms).sort());
    for (const [roomId, geometry] of Object.entries(FACILITY_MAP.rooms)) {
      const room = WORLD_MAP.rooms[roomId];
      expect(room, roomId).toBeDefined();
      if (!room) continue;
      expect(room.id).toBe(roomId);
      expect(room.bounds).toEqual(geometry.bounds);
      expect(room.socketCells).toEqual(geometry.socketCells);
      expect(room.platformCells).toEqual(geometry.platformCells);
      expect(room.ladderCells).toEqual(geometry.ladderCells);
      expect(room.taps.gas, roomId).toEqual(GAS_JUNCTIONS[roomId]);
      expect(room.taps.liquid, roomId).toEqual(LIQUID_JUNCTIONS[roomId]);
      expect(room.provenance).toBe("site");
    }
  });

  it("reproduces every portal as an architectural connection, in authored order", () => {
    expect(architectural.map(({ id }) => id)).toEqual(FACILITY_MAP.portals.map(({ id }) => id));
    for (const portal of FACILITY_MAP.portals) {
      const connection = WORLD_MAP.connections[portal.id];
      expect(connection, portal.id).toBeDefined();
      if (!connection || isProcessLine(connection)) throw new Error(`${portal.id} is not a portal`);
      expect(connection).toEqual({ ...portal, id: portal.id, kind: portal.kind });
    }
  });
});

describe("the authored world map reproduces the legacy process lines exactly", () => {
  it("reproduces every transport-run phase as a process line with today's route", () => {
    const expectedLineIds: string[] = [];
    for (const run of Object.values(TRANSPORT_RUNS)) {
      for (const [phase, kind] of [
        ["gas", "gas_line"],
        ["liquid", "liquid_line"],
      ] as const) {
        const legacy = run[phase];
        if (!legacy) continue;
        const id = processLineId(kind, run.rooms[0], run.rooms[1]);
        expectedLineIds.push(id);
        const connection = WORLD_MAP.connections[id];
        expect(connection, id).toBeDefined();
        if (!connection || !isProcessLine(connection)) throw new Error(`${id} is not a line`);
        expect(connection.kind).toBe(kind);
        expect([...connection.rooms].sort()).toEqual([...run.rooms].sort());
        expect(connection.direction).toEqual(legacy.direction);
        expect(connection.destinationKind).toBe(legacy.destinationKind);
        expect(connection.actuator).toBe(legacy.actuator);
        expect(connection.actuatorHead).toBe(legacy.actuatorHead);
        expect(connection.maxFlow).toBe(legacy.maxFlow);
        expect(connection.volumePerCell).toBe(legacy.volumePerCell);
        expect(connection.buildCost).toBe(legacy.buildCost);
        expect(connection.route, id).toEqual(CONDUIT_BLUEPRINTS[run.id]?.[phase]);
      }
    }
    expect(lines).toHaveLength(expectedLineIds.length);
  });

  it("orders kind-filtered lines exactly as the legacy per-phase iteration", () => {
    const legacyOrder = (phase: "gas" | "liquid"): string[] =>
      Object.values(TRANSPORT_RUNS)
        .filter((run) => run[phase])
        .map((run) =>
          processLineId(phase === "gas" ? "gas_line" : "liquid_line", run.rooms[0], run.rooms[1])
        );
    expect(lines.filter(({ kind }) => kind === "gas_line").map(({ id }) => id)).toEqual(
      legacyOrder("gas")
    );
    expect(lines.filter(({ kind }) => kind === "liquid_line").map(({ id }) => id)).toEqual(
      legacyOrder("liquid")
    );
  });
});
