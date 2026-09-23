import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_DEFINITION, deriveGame, WORLD_MAP } from "./config";
import { createScenarioGame } from "./engine/scenarioState";
import { executeCommand } from "./engine/commands";
import { findEnemyPath } from "./engine/navigation";
import { graftedRoomId } from "./world/graft";
import { processLineId, type GraftSlot, type WorldMap } from "./world/map";
import { roomState } from "./world/instances";
import type { GameState } from "./types";
import type { LevelDefinition } from "./definitionTypes";

/**
 * Hull test content: the furnace is the player's chamber, with a graft slot on its
 * left wall facing the open rock west of the room (columns 0-5 are unoccupied below
 * the switchyard band... the furnace spans columns 6-20, elevations 13-32; facing
 * "left" grafts into columns < 5, clear of every authored room).
 */
const GRAFT_SLOT: GraftSlot = {
  id: "west_wall",
  cell: { column: 6, elevation: 22 },
  facing: "left",
};

const hullMap: WorldMap = Object.freeze({
  ...WORLD_MAP,
  rooms: {
    ...WORLD_MAP.rooms,
    furnace: {
      ...WORLD_MAP.rooms.furnace!,
      provenance: "hull" as const,
      graftSlots: [GRAFT_SLOT],
    },
  },
});

const harkersBraceWithoutGeneratedSite: LevelDefinition = {
  ...DEFAULT_GAME_DEFINITION.levels.harkers_brace,
  site: null,
};

const definition = deriveGame(DEFAULT_GAME_DEFINITION, {
  map: hullMap,
  levels: {
    ...DEFAULT_GAME_DEFINITION.levels,
    harkers_brace: harkersBraceWithoutGeneratedSite,
  },
});

const intermissionState = (): GameState => {
  const state = createScenarioGame("claim_8_delta", [], definition);
  state.phase = "level_complete";
  state.encounter.matter = 200;
  return state;
};

const graft = (state: GameState, moduleId = "utility_pod") =>
  executeCommand(
    state,
    { type: "graft_module", hostRoomId: "furnace", graftSlotId: "west_wall", moduleId },
    definition
  );

describe("grafting modules onto hull graft slots", () => {
  it("grafts a module as a validated map edit with live records", () => {
    const state = intermissionState();
    const result = graft(state);
    expect(result.accepted).toBe(true);
    const next = result.state;
    const roomId = graftedRoomId("furnace", "west_wall");
    expect(next.encounter.map.rooms[roomId]?.provenance).toBe("hull");
    expect(next.encounter.map.rooms[roomId]?.code).toBe("POD-1");
    expect(next.encounter.map.connections[`joint:furnace:west_wall`]).toBeDefined();
    expect(next.encounter.world.rooms).toContain(roomId);
    expect(roomState(next.encounter, roomId).id).toBe(roomId);
    expect(next.encounter.process.gasJunctions[roomId]).toBeDefined();
    expect(next.encounter.portalStates["joint:furnace:west_wall"]?.open).toBe(true);
    expect(next.encounter.matter).toBe(200 - definition.modules.utility_pod!.graftCost);
    expect(next.encounter.mapRevision).toBe(state.encounter.mapRevision + 1);
  });

  it("is deterministic and rejects a second graft on the occupied graft slot", () => {
    const first = graft(intermissionState()).state;
    const second = graft(intermissionState()).state;
    expect(second.encounter.map.rooms[graftedRoomId("furnace", "west_wall")]).toEqual(
      first.encounter.map.rooms[graftedRoomId("furnace", "west_wall")]
    );
    const duplicate = graft(first);
    expect(duplicate.accepted).toBe(false);
    expect(duplicate.code).toBe("placement");
  });

  it("rejects grafts from non-hull rooms and unknown graft slots", () => {
    const state = intermissionState();
    const siteHost = executeCommand(
      state,
      {
        type: "graft_module",
        hostRoomId: "gallery",
        graftSlotId: "west_wall",
        moduleId: "utility_pod",
      },
      definition
    );
    expect(siteHost.accepted).toBe(false);
    const missing = executeCommand(
      state,
      {
        type: "graft_module",
        hostRoomId: "furnace",
        graftSlotId: "east_wall",
        moduleId: "utility_pod",
      },
      definition
    );
    expect(missing.accepted).toBe(false);
  });
});

describe("dismantling and carrying grafted modules", () => {
  it("dismantles a clear grafted module for a refund and removes its records", () => {
    const grafted = graft(intermissionState()).state;
    const roomId = graftedRoomId("furnace", "west_wall");
    const matterBefore = grafted.encounter.matter;
    const result = executeCommand(grafted, { type: "dismantle_module", roomId }, definition);
    expect(result.accepted).toBe(true);
    expect(result.state.encounter.map.rooms[roomId]).toBeUndefined();
    expect(result.state.encounter.process.rooms[roomId]).toBeUndefined();
    expect(result.state.encounter.world.rooms).not.toContain(roomId);
    expect(result.state.encounter.matter).toBe(
      matterBefore + Math.floor(definition.modules.utility_pod!.graftCost * 0.75)
    );
  });

  it("refuses to dismantle a grafted room holding equipment", () => {
    const grafted = graft(intermissionState(), "process_chamber").state;
    const roomId = graftedRoomId("furnace", "west_wall");
    roomState(grafted.encounter, roomId).equipment.socket_a = {
      equipmentId: "gas_agitator",
      level: 1,
      enabled: false,
      operation: null,
      medium: null,
    };
    const result = executeCommand(grafted, { type: "dismantle_module", roomId }, definition);
    expect(result.accepted).toBe(false);
  });

  it("carries a grafted room across sites inside the hull fragment", async () => {
    const { extractHullFragment } = await import("./world/hullFragment");
    const grafted = graft(intermissionState(), "process_chamber").state;
    const roomId = graftedRoomId("furnace", "west_wall");
    roomState(grafted.encounter, roomId).gas.lower.hydrogen = 3;
    const fragment = extractHullFragment(grafted);
    expect(Object.keys(fragment.rooms).sort()).toEqual(
      [roomId, "core", "furnace", "washlock"].sort()
    );
    expect(Object.keys(fragment.connections)).toContain("joint:furnace:west_wall");
    expect(fragment.roomStates[roomId]?.gas.lower.hydrogen).toBe(3);
  });
});

const routeVisitsRoom = (state: GameState, roomId: string): boolean => {
  const room = state.encounter.map.rooms[roomId]!;
  const path = findEnemyPath(
    { flying: false, portalStates: state.encounter.portalStates },
    state.encounter.map
  );
  return path.some(
    ({ cell }) =>
      cell.column >= room.bounds.column &&
      cell.column < room.bounds.column + room.bounds.width &&
      cell.elevation >= room.bounds.elevation &&
      cell.elevation < room.bounds.elevation + room.bounds.height
  );
};

const dockAtNextSite = (state: GameState): GameState => {
  state.phase = "level_complete";
  const traveling = executeCommand(state, { type: "start_next_level" }, DEFAULT_GAME_DEFINITION);
  return executeCommand(traveling.state, { type: "dock_at_site" }, DEFAULT_GAME_DEFINITION).state;
};

describe("the persistent hull route", () => {
  it("carries a useful graft, its machine, and its internal pipe through generated and authored sites", () => {
    const source = createScenarioGame("claim_8_delta", [], DEFAULT_GAME_DEFINITION);
    source.phase = "level_complete";
    source.encounter.matter = 200;
    const grafted = executeCommand(
      source,
      {
        type: "graft_module",
        hostRoomId: "washlock",
        graftSlotId: "forward",
        moduleId: "process_chamber",
      },
      DEFAULT_GAME_DEFINITION
    );
    expect(grafted.accepted).toBe(true);
    const roomId = graftedRoomId("washlock", "forward");
    expect(routeVisitsRoom(grafted.state, roomId)).toBe(true);

    grafted.state.phase = "build";
    roomState(grafted.state.encounter, roomId).equipment.socket_a = {
      equipmentId: "gas_agitator",
      level: 2,
      enabled: true,
      operation: null,
      medium: null,
    };
    roomState(grafted.state.encounter, roomId).residue = 8;
    roomState(grafted.state.encounter, roomId).pressurePulse = 12;
    const piped = executeCommand(
      grafted.state,
      { type: "build_connection", kind: "gas_line", fromRoomId: "core", toRoomId: roomId },
      DEFAULT_GAME_DEFINITION
    );
    expect(piped.accepted).toBe(true);
    const generated = dockAtNextSite(piped.state);
    const lineId = processLineId("gas_line", "core", roomId);
    expect(generated.encounter.map.connections[lineId]).toBeDefined();
    expect(generated.encounter.process.gasConduits[lineId]).toBeDefined();
    expect(roomState(generated.encounter, roomId).equipment.socket_a?.level).toBe(2);
    expect(roomState(generated.encounter, roomId).residue).toBe(0);
    expect(roomState(generated.encounter, roomId).pressurePulse).toBe(0);

    const authored = dockAtNextSite(generated);
    expect(routeVisitsRoom(authored, roomId)).toBe(true);
  });
});
