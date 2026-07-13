import { describe, expect, it } from "vitest";
import {
  CONDUIT_BLUEPRINTS,
  FACILITY_MAP,
  GAS_BUFFERS,
  GAS_SOURCES,
  LIQUID_BUFFERS,
  LIQUID_SOURCES,
  ROOM_VOLUME_PER_CELL,
  TRANSPORT_RUNS,
  facilityCellDefinition,
  facilityCellHasSupport,
  facilityCells,
  facilityRingForRoom,
  gridCellToWorldPoint,
  inFacilityBounds,
  initialPortalStates,
  roomAtmosphericCells,
  roomAtWorldPoint,
  roomCenterWorld,
  roomContainsWorldPoint,
  roomLiquidSurfaceElevation,
  roomPortHeight,
  roomVolume,
} from "./config";
import {
  GAS_BUFFER_IDS,
  GAS_SOURCE_IDS,
  LIQUID_BUFFER_IDS,
  LIQUID_SOURCE_IDS,
  TRANSPORT_RUN_IDS,
  type CellRect,
  type GridCell,
  type RoomId,
  type TransportPhase,
} from "./types";
import { findEnemyPath, findEnemyPathBetween, pathMovementModes } from "./engine/navigation";
import {
  clientToWorldPoint,
  initialCamera,
  mapToWorldPoint,
  worldToClientPoint,
  worldToMapPoint,
} from "../components/gameMap/mapGeometry";

const overlaps = (left: CellRect, right: CellRect): boolean =>
  left.column < right.column + right.width &&
  left.column + left.width > right.column &&
  left.elevation < right.elevation + right.height &&
  left.elevation + left.height > right.elevation;

const isAdjacent = (left: GridCell, right: GridCell): boolean =>
  Math.abs(left.column - right.column) + Math.abs(left.elevation - right.elevation) === 1;

const ROOM_IDS = Object.keys(FACILITY_MAP.rooms) as RoomId[];

describe("canonical tile-addressable facility", () => {
  it("authors varied, non-overlapping room dimensions", () => {
    for (let left = 0; left < ROOM_IDS.length; left += 1) {
      for (let right = left + 1; right < ROOM_IDS.length; right += 1) {
        expect(
          overlaps(
            FACILITY_MAP.rooms[ROOM_IDS[left] as RoomId].bounds,
            FACILITY_MAP.rooms[ROOM_IDS[right] as RoomId].bounds
          )
        ).toBe(false);
      }
    }

    const dimensions = new Set(
      ROOM_IDS.map((roomId) => {
        const bounds = FACILITY_MAP.rooms[roomId].bounds;
        return `${bounds.width}x${bounds.height}`;
      })
    );
    expect(dimensions.size).toBeGreaterThanOrEqual(6);
    expect(FACILITY_MAP.rooms.furnace.bounds.height).toBeGreaterThan(
      FACILITY_MAP.rooms.furnace.bounds.width
    );
    expect(FACILITY_MAP.rooms.reservoir.bounds.width).toBeGreaterThan(
      FACILITY_MAP.rooms.reservoir.bounds.height * 2
    );
  });

  it("uses room atmosphere for most of the compact playable envelope", () => {
    const minColumn = Math.min(...ROOM_IDS.map((id) => FACILITY_MAP.rooms[id].bounds.column));
    const maxColumn = Math.max(
      ...ROOM_IDS.map((id) => {
        const bounds = FACILITY_MAP.rooms[id].bounds;
        return bounds.column + bounds.width;
      })
    );
    const minElevation = Math.min(...ROOM_IDS.map((id) => FACILITY_MAP.rooms[id].bounds.elevation));
    const maxElevation = Math.max(
      ...ROOM_IDS.map((id) => {
        const bounds = FACILITY_MAP.rooms[id].bounds;
        return bounds.elevation + bounds.height;
      })
    );
    const envelopeArea = (maxColumn - minColumn) * (maxElevation - minElevation);
    const atmosphericArea = ROOM_IDS.reduce(
      (total, roomId) => total + roomAtmosphericCells(roomId).length,
      0
    );
    expect(atmosphericArea / envelopeArea).toBeGreaterThan(0.65);
  });
});

describe("cell ownership and room-derived physics", () => {
  it("classifies every cell and gives every atmospheric cell one room owner", () => {
    const cells = facilityCells();
    expect(cells).toHaveLength(FACILITY_MAP.width * FACILITY_MAP.height);
    expect(new Set(cells.map(({ cell }) => `${cell.column}:${cell.elevation}`)).size).toBe(
      cells.length
    );
    for (const definition of cells) {
      expect(inFacilityBounds(definition.cell)).toBe(true);
      if (
        definition.terrain !== "solid" &&
        definition.terrain !== "platform" &&
        definition.terrain !== "core_shell"
      ) {
        expect(definition.roomId).not.toBeNull();
      }
    }
    expect(cells.filter(({ terrain }) => terrain === "core_shell").length).toBeGreaterThan(0);
  });

  it("includes every host-owned portal cell in canonical room atmosphere and volume", () => {
    for (const roomId of ROOM_IDS) {
      const expected = facilityCells().filter(
        (definition) =>
          definition.roomId === roomId &&
          definition.terrain !== "platform" &&
          definition.terrain !== "core_shell"
      );
      expect(roomAtmosphericCells(roomId)).toHaveLength(expected.length);
    }
    expect(roomAtmosphericCells("washlock")).toEqual(
      expect.arrayContaining([
        { column: 42, elevation: 13 },
        { column: 49, elevation: 4 },
        { column: 50, elevation: 4 },
      ])
    );
  });
});

describe("room-derived physical capacity", () => {
  it("derives room volume, ownership, utilities, and rings from spatial cells", () => {
    for (const roomId of ROOM_IDS) {
      expect(roomVolume(roomId)).toBeCloseTo(
        roomAtmosphericCells(roomId).length * ROOM_VOLUME_PER_CELL
      );
      expect(roomAtWorldPoint(roomCenterWorld(roomId))).toBe(roomId);
    }
    expect(roomVolume("furnace")).toBeGreaterThan(roomVolume("gallery"));
    expect(roomPortHeight("furnace", 13)).toBe(0);
    expect(roomPortHeight("furnace", 33)).toBe(1);
    expect(facilityRingForRoom("core")).toBe("core");
    expect(facilityRingForRoom("lower_intake")).toBe("inner");
    expect(facilityRingForRoom("washlock")).toBe("inner");
    expect(facilityRingForRoom("reservoir")).toBe("middle");
    expect(facilityRingForRoom("gallery")).toBe("middle");
    expect(facilityRingForRoom("switchyard")).toBe("outer");
    expect(facilityRingForRoom("furnace")).toBe("outer");

    for (const node of Object.values(FACILITY_MAP.utilityNodes)) {
      expect(inFacilityBounds(node.cell)).toBe(true);
      expect(roomContainsWorldPoint(node.hostRoomId, gridCellToWorldPoint(node.cell))).toBe(true);
    }
    for (const sourceId of GAS_SOURCE_IDS)
      expect(FACILITY_MAP.utilityNodes[sourceId].hostRoomId).toBe(GAS_SOURCES[sourceId].hostRoomId);
    for (const sourceId of LIQUID_SOURCE_IDS)
      expect(FACILITY_MAP.utilityNodes[sourceId].hostRoomId).toBe(
        LIQUID_SOURCES[sourceId].hostRoomId
      );
    for (const bufferId of GAS_BUFFER_IDS)
      expect(FACILITY_MAP.utilityNodes[bufferId].hostRoomId).toBe(GAS_BUFFERS[bufferId].hostRoomId);
    for (const bufferId of LIQUID_BUFFER_IDS)
      expect(FACILITY_MAP.utilityNodes[bufferId].hostRoomId).toBe(
        LIQUID_BUFFERS[bufferId].hostRoomId
      );
  });

  it("fills liquid upward through canonical row capacities rather than a room rectangle", () => {
    const atmosphericCells = roomAtmosphericCells("furnace");
    const lowerVolume =
      atmosphericCells.filter(({ elevation }) => elevation < 23).length * ROOM_VOLUME_PER_CELL;
    const platformRowCells = atmosphericCells.filter(({ elevation }) => elevation === 23).length;
    const ordinaryRowCells = atmosphericCells.filter(({ elevation }) => elevation === 22).length;
    expect(platformRowCells).toBeLessThan(ordinaryRowCells);

    const halfPlatformRow = platformRowCells * ROOM_VOLUME_PER_CELL * 0.5;
    expect(roomLiquidSurfaceElevation("furnace", lowerVolume + halfPlatformRow)).toBeCloseTo(23.5);
  });
});

describe("architectural portals and cell navigation", () => {
  it("derives every room transition from unique, contiguous portal cells", () => {
    expect(new Set(FACILITY_MAP.portals.map(({ id }) => id)).size).toBe(
      FACILITY_MAP.portals.length
    );
    for (const portal of FACILITY_MAP.portals) {
      const completeCrossing = [portal.endpoints[0], ...portal.connectorCells, portal.endpoints[1]];
      expect(completeCrossing.every(inFacilityBounds)).toBe(true);
      for (let index = 1; index < completeCrossing.length; index += 1) {
        expect(isAdjacent(completeCrossing[index - 1]!, completeCrossing[index]!)).toBe(true);
      }
      expect(facilityCellDefinition(portal.endpoints[0]).roomId).toBe(portal.rooms[0]);
      expect(facilityCellDefinition(portal.endpoints[1]).roomId).toBe(portal.rooms[1]);
      for (const connector of portal.connectorCells) {
        expect(facilityCellDefinition(connector).portalId).toBe(portal.id);
      }
    }
  });

  it("finds a real platform route containing walk, climb, fall, and door actions", () => {
    const path = findEnemyPath({ flying: false, portalStates: initialPortalStates() });
    expect(path[0]?.cell).toEqual(FACILITY_MAP.entryCell);
    expect(path.at(-1)?.cell).toEqual(FACILITY_MAP.coreBreachCell);
    const modes = pathMovementModes(path);
    expect(modes).toContain("walking");
    expect(modes).toContain("climbing");
    expect(modes).toContain("falling");
    expect(modes).toContain("door");
    expect(modes.indexOf("climbing")).toBeLessThan(modes.indexOf("falling"));
    expect(modes.indexOf("falling")).toBeLessThan(modes.indexOf("door"));

    for (let index = 1; index < path.length; index += 1) {
      const previous = path[index - 1]!;
      const current = path[index]!;
      expect(isAdjacent(previous.cell, current.cell)).toBe(true);
      if (current.mode === "climbing") {
        expect(facilityCellDefinition(current.cell).terrain).toBe("ladder");
      }
      if (current.mode === "falling") {
        const verticalDescent =
          current.cell.column === previous.cell.column &&
          current.cell.elevation === previous.cell.elevation - 1;
        const enteredUnsupportedHole =
          current.cell.elevation === previous.cell.elevation &&
          !facilityCellHasSupport(current.cell, initialPortalStates());
        expect(verticalDescent || enteredUnsupportedHole).toBe(true);
      }
      if (current.mode === "walking") {
        expect(facilityCellHasSupport(current.cell, initialPortalStates())).toBe(true);
      }
    }
  });
});

describe("portal state navigation policy", () => {
  it("cannot route through a removed ladder or closed intermediate opening", () => {
    const ladderClosed = initialPortalStates();
    ladderClosed.switchyard_to_furnace_shaft!.open = false;
    expect(findEnemyPath({ flying: false, portalStates: ladderClosed })).toEqual([]);

    const passageClosed = initialPortalStates();
    passageClosed.gallery_to_lower_intake!.open = false;
    expect(findEnemyPath({ flying: false, portalStates: passageClosed })).toEqual([]);
  });

  it("ends at the closed, sealed Core threshold without entering its atmosphere", () => {
    const portalStates = initialPortalStates();
    const path = findEnemyPath({ flying: false, portalStates });
    expect(portalStates.washlock_to_core_door).toMatchObject({ open: false, sealed: true });
    expect(path.at(-1)).toMatchObject({
      cell: FACILITY_MAP.coreBreachCell,
      mode: "door",
      portalId: "washlock_to_core_door",
    });
    expect(facilityCellDefinition(path.at(-1)!.cell).roomId).toBe("washlock");
    expect(facilityCellDefinition(path.at(-1)!.cell).terrain).toBe("door");
  });

  it("uses the authored Core door cells for opening policy instead of a synthetic action tag", () => {
    const portal = FACILITY_MAP.portals.find(({ id }) => id === "washlock_to_core_door")!;
    const closed = initialPortalStates();
    expect(
      findEnemyPathBetween({
        flying: false,
        portalStates: closed,
        start: portal.endpoints[0],
        goal: portal.endpoints[1],
      })
    ).toEqual([]);

    const open = initialPortalStates();
    open.washlock_to_core_door!.open = true;
    const crossing = findEnemyPathBetween({
      flying: false,
      portalStates: open,
      start: portal.endpoints[0],
      goal: portal.endpoints[1],
    });
    expect(crossing.map(({ cell }) => cell)).toEqual([
      portal.endpoints[0],
      ...portal.connectorCells,
      portal.endpoints[1],
    ]);
  });

  it("allows a reagent-only room seal without inventing a movement wall", () => {
    const portalStates = initialPortalStates();
    portalStates.switchyard_to_furnace_shaft!.sealed = true;
    expect(findEnemyPath({ flying: false, portalStates }).length).toBeGreaterThan(1);
  });
});

describe("dedicated routes and transforms", () => {
  it("gives every physical conduit a valid endpoint-owned route independent of portals", () => {
    expect(Object.keys(CONDUIT_BLUEPRINTS).sort()).toEqual([...TRANSPORT_RUN_IDS].sort());
    for (const runId of TRANSPORT_RUN_IDS) {
      for (const phase of ["gas", "liquid"] as const satisfies readonly TransportPhase[]) {
        const path = CONDUIT_BLUEPRINTS[runId][phase];
        if (!path) continue;
        expect(path.length).toBeGreaterThan(1);
        expect(path.every(inFacilityBounds)).toBe(true);
        for (let index = 1; index < path.length; index += 1)
          expect(isAdjacent(path[index - 1]!, path[index]!)).toBe(true);
        const definition = TRANSPORT_RUNS[runId][phase];
        expect(definition).not.toBeNull();
        const [fromRoom, toRoom] = definition!.direction;
        expect(roomAtWorldPoint(gridCellToWorldPoint(path[0]!))).toBe(fromRoom);
        expect(roomAtWorldPoint(gridCellToWorldPoint(path.at(-1)!))).toBe(toRoom);
      }
    }
  });

  it("round-trips world, map, camera, and client coordinates", () => {
    const world = roomCenterWorld("lower_intake");
    const map = worldToMapPoint(world);
    expect(mapToWorldPoint(map)).toEqual(world);
    const bounds = { x: 13, y: 327, width: 1012, height: 506 };
    const client = worldToClientPoint(world, initialCamera(), bounds);
    const restored = clientToWorldPoint(client, initialCamera(), bounds);
    expect(restored.x).toBeCloseTo(world.x);
    expect(restored.elevation).toBeCloseTo(world.elevation);
  });
});
