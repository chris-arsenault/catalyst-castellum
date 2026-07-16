import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_DEFINITION, deriveGame, WORLD_MAP } from "./config";
import { createScenarioGame } from "./engine/scenarioState";
import { executeCommand } from "./engine/commands";
import { graftedRoomId } from "./world/graft";
import type { Hardpoint, WorldMap } from "./world/map";
import { roomState } from "./world/instances";
import type { GameState } from "./types";

/**
 * Hull test content: the furnace is the player's chamber, with a hardpoint on its
 * left wall facing the open rock west of the room (columns 0-5 are unoccupied below
 * the switchyard band... the furnace spans columns 6-20, elevations 13-32; facing
 * "left" grafts into columns < 5, clear of every authored room).
 */
const HARDPOINT: Hardpoint = {
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
      hardpoints: [HARDPOINT],
    },
  },
});

const definition = deriveGame(DEFAULT_GAME_DEFINITION, { map: hullMap });

const buildPhase = (): GameState => {
  const state = createScenarioGame("flash_point", [], definition);
  state.phase = "build";
  state.matter = 100;
  state.campaign.levelIndex = 1; // grafting happens at a dock after the first site
  return state;
};

const graft = (state: GameState, moduleId = "utility_pod") =>
  executeCommand(
    state,
    { type: "graft_module", hostRoomId: "furnace", hardpointId: "west_wall", moduleId },
    definition
  );

describe("grafting modules onto hull hardpoints", () => {
  it("grafts a module as a validated map edit with live records", () => {
    const state = buildPhase();
    const result = graft(state);
    expect(result.accepted).toBe(true);
    const next = result.state;
    const roomId = graftedRoomId("furnace", "west_wall");
    expect(next.map.rooms[roomId]?.provenance).toBe("hull");
    expect(next.map.rooms[roomId]?.code).toBe("POD-1");
    expect(next.map.connections[`joint:furnace:west_wall`]).toBeDefined();
    expect(next.world.rooms).toContain(roomId);
    expect(roomState(next, roomId).id).toBe(roomId);
    expect(next.gasJunctions[roomId]).toBeDefined();
    expect(next.portalStates["joint:furnace:west_wall"]?.open).toBe(true);
    expect(next.matter).toBe(100 - definition.modules.utility_pod!.graftCost);
    expect(next.mapRevision).toBe(state.mapRevision + 1);
  });

  it("is deterministic and rejects a second graft on the occupied hardpoint", () => {
    const first = graft(buildPhase()).state;
    const second = graft(buildPhase()).state;
    expect(second.map.rooms[graftedRoomId("furnace", "west_wall")]).toEqual(
      first.map.rooms[graftedRoomId("furnace", "west_wall")]
    );
    const duplicate = graft(first);
    expect(duplicate.accepted).toBe(false);
    expect(duplicate.code).toBe("placement");
  });

  it("rejects grafts from non-hull rooms and unknown hardpoints", () => {
    const state = buildPhase();
    const siteHost = executeCommand(
      state,
      {
        type: "graft_module",
        hostRoomId: "gallery",
        hardpointId: "west_wall",
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
        hardpointId: "east_wall",
        moduleId: "utility_pod",
      },
      definition
    );
    expect(missing.accepted).toBe(false);
  });
});

describe("dismantling and carrying grafted modules", () => {
  it("dismantles a clear grafted module for a refund and removes its records", () => {
    const grafted = graft(buildPhase()).state;
    const roomId = graftedRoomId("furnace", "west_wall");
    const matterBefore = grafted.matter;
    const result = executeCommand(grafted, { type: "dismantle_module", roomId }, definition);
    expect(result.accepted).toBe(true);
    expect(result.state.map.rooms[roomId]).toBeUndefined();
    expect(result.state.rooms[roomId]).toBeUndefined();
    expect(result.state.world.rooms).not.toContain(roomId);
    expect(result.state.matter).toBe(
      matterBefore + Math.floor(definition.modules.utility_pod!.graftCost * 0.75)
    );
  });

  it("refuses to dismantle a grafted room holding equipment", () => {
    const grafted = graft(buildPhase(), "process_chamber").state;
    const roomId = graftedRoomId("furnace", "west_wall");
    roomState(grafted, roomId).equipment.socket_a = {
      equipmentId: "gas_agitator",
      level: 1,
      enabled: false,
    };
    const result = executeCommand(grafted, { type: "dismantle_module", roomId }, definition);
    expect(result.accepted).toBe(false);
  });

  it("carries a grafted room across sites inside the hull fragment", async () => {
    const { extractHullFragment } = await import("./world/hullFragment");
    const grafted = graft(buildPhase(), "process_chamber").state;
    const roomId = graftedRoomId("furnace", "west_wall");
    roomState(grafted, roomId).gas.lower.hydrogen = 3;
    const fragment = extractHullFragment(grafted);
    expect(Object.keys(fragment.rooms).sort()).toEqual(
      [roomId, "core", "furnace", "washlock"].sort()
    );
    expect(Object.keys(fragment.connections)).toContain("joint:furnace:west_wall");
    expect(fragment.roomStates[roomId]?.gas.lower.hydrogen).toBe(3);
  });
});
