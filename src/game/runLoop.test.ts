import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_DEFINITION, deriveGame, WORLD_MAP } from "./config";
import { createScenarioGame } from "./engine/scenarioState";
import { executeCommand } from "./engine/commands";
import { graftedRoomId } from "./world/graft";
import type { Hardpoint, WorldMap } from "./world/map";
import { roomState } from "./world/instances";
import type { GameState } from "./types";

const HARDPOINT: Hardpoint = {
  id: "west_wall",
  cell: { column: 6, elevation: 22 },
  facing: "left",
};

/** A seed hull: the furnace is the player's chamber with an open hardpoint. */
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

const graftedId = graftedRoomId("furnace", "west_wall");

const buildWithGraft = (): GameState => {
  const state = createScenarioGame("flash_point", [], definition);
  state.phase = "build";
  state.matter = 100;
  state.campaign.levelIndex = 1;
  const grafted = executeCommand(
    state,
    {
      type: "graft_module",
      hostRoomId: "furnace",
      hardpointId: "west_wall",
      moduleId: "process_chamber",
    },
    definition
  );
  expect(grafted.accepted).toBe(true);
  return grafted.state;
};

describe("the run loop carries a graft across a dock", () => {
  it("travels and docks, embedding the grafted room on the next site", () => {
    const site = buildWithGraft();
    roomState(site, graftedId).gas.lower.hydrogen = 5;
    // Reach the between-sites decision, then drive the real loop commands.
    site.phase = "level_complete";

    const traveling = executeCommand(site, { type: "start_next_level" }, definition);
    expect(traveling.accepted).toBe(true);
    expect(traveling.state.phase).toBe("travel");

    const docked = executeCommand(traveling.state, { type: "dock_at_site" }, definition);
    expect(docked.accepted).toBe(true);
    const next = docked.state;

    expect(next.campaign.levelId).toBe("make_the_reagent");
    expect(next.map.rooms[graftedId]?.provenance).toBe("hull");
    expect(next.map.connections["joint:furnace:west_wall"]).toBeDefined();
    expect(next.world.rooms).toContain(graftedId);
    expect(roomState(next, graftedId).gas.lower.hydrogen).toBe(5);
    expect(next.map.rooms.furnace?.provenance).toBe("hull");
  });

  it("stamps the run outcome and refuses graft edits outside the build phase", () => {
    const site = buildWithGraft();
    site.phase = "assault";
    const rejected = executeCommand(
      site,
      { type: "dismantle_module", roomId: graftedId },
      definition
    );
    expect(rejected.accepted).toBe(false);
    expect(rejected.code).toBe("invalid_phase");
  });
});
