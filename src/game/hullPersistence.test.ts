import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_DEFINITION } from "./config";
import { createScenarioGame } from "./engine/scenarioState";
import { executeCommand } from "./engine/commands";
import { roomState } from "./world/instances";
import type { GameState } from "./types";

/**
 * The walking-castellum's contract: only the player-owned hull travels between sites.
 * The hull starts small — Core + R-06 washlock — so a defense built in a SITE room
 * (the furnace's OX-1) is temporary and does not carry, while a machine placed in an
 * OWNED room does. This is the deliberate progression: sites are disposable, the hull
 * is what you grow (by grafting) and keep.
 */
const dockedAtSite2 = (prepareSite1: (state: GameState) => void): GameState => {
  const site1 = createScenarioGame("flash_point", [], DEFAULT_GAME_DEFINITION);
  site1.phase = "build";
  prepareSite1(site1);
  site1.phase = "level_complete";
  const traveling = executeCommand(site1, { type: "start_next_level" }, DEFAULT_GAME_DEFINITION);
  return executeCommand(traveling.state, { type: "dock_at_site" }, DEFAULT_GAME_DEFINITION).state;
};

describe("only the owned hull travels between sites", () => {
  it("leaves a machine built in a site room (the furnace) behind at the dock", () => {
    const site2 = dockedAtSite2((state) => {
      state.rooms.furnace!.equipment.socket_a = {
        equipmentId: "gas_agitator",
        level: 1,
        enabled: true,
      };
    });
    expect(site2.campaign.levelId).toBe("make_the_reagent");
    expect(site2.map.rooms.furnace?.provenance).toBe("site");
    // The furnace is site structure, so its agitator did not travel — the site's own
    // authored loadout supplies the furnace afresh.
    expect(roomState(site2, "furnace").equipment.socket_a?.equipmentId).not.toBe("gas_agitator");
  });

  it("carries a machine placed in an owned hull room (washlock) to the next site", () => {
    const site2 = dockedAtSite2((state) => {
      state.rooms.washlock!.equipment.socket_a = {
        equipmentId: "gas_agitator",
        level: 2,
        enabled: true,
      };
    });
    expect(site2.map.rooms.washlock?.provenance).toBe("hull");
    expect(site2.map.rooms.core?.provenance).toBe("hull");
    expect(roomState(site2, "washlock").equipment.socket_a).toEqual({
      equipmentId: "gas_agitator",
      level: 2,
      enabled: true,
    });
  });
});
