import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_DEFINITION } from "./config";
import { createScenarioGame } from "./engine/scenarioState";
import { executeCommand } from "./engine/commands";
import { gasConduitState, roomState } from "./world/instances";
import type { GameState } from "./types";

/**
 * The walking-castellum's reason for being: crossing from one site to the next must
 * NOT wipe the player's built defenses. The hull (Core + furnace, and everything the
 * player built in them — equipment and hull-internal pipes) travels; only the site
 * changes. This is the concrete fix for the jarring OX-1 → NaCl transition.
 */
const armedFurnace = (): GameState => {
  const state = createScenarioGame("flash_point", [], DEFAULT_GAME_DEFINITION);
  state.phase = "build";
  state.matter = 200;
  // Build an OX-1: an agitator in the furnace and the core→furnace gas feed installed.
  const withAgitator = executeCommand(
    state,
    {
      type: "install_equipment",
      roomId: "furnace",
      socketId: "socket_a",
      equipmentId: "gas_agitator",
    },
    DEFAULT_GAME_DEFINITION
  ).state;
  gasConduitState(withAgitator, "gas:core__furnace").installed = true;
  gasConduitState(withAgitator, "gas:core__furnace").enabled = true;
  gasConduitState(withAgitator, "gas:core__furnace").gas.hydrogen = 6;
  return withAgitator;
};

describe("the hull's built defenses persist across a site transition", () => {
  it("carries the furnace agitator and its core→furnace feed to the next site", () => {
    const site1 = armedFurnace();
    site1.phase = "level_complete";

    const traveling = executeCommand(site1, { type: "start_next_level" }, DEFAULT_GAME_DEFINITION);
    const site2 = executeCommand(
      traveling.state,
      { type: "dock_at_site" },
      DEFAULT_GAME_DEFINITION
    ).state;

    expect(site2.campaign.levelId).toBe("make_the_reagent");
    // The furnace is hull, so its built agitator survives the dock.
    expect(roomState(site2, "furnace").equipment.socket_a?.equipmentId).toBe("gas_agitator");
    // The core→furnace feed is a hull-internal pipe (both ends hull) — it survives too.
    expect(gasConduitState(site2, "gas:core__furnace").installed).toBe(true);
    expect(gasConduitState(site2, "gas:core__furnace").enabled).toBe(true);
    // The Core itself carried.
    expect(site2.map.rooms.core?.provenance).toBe("hull");
    expect(site2.map.rooms.furnace?.provenance).toBe("hull");
  });
});
