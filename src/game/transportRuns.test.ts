import { describe, expect, it } from "vitest";
import { WORLD_LINE_BLUEPRINTS } from "./content/worldMap";
import { createScenarioGame, executeCommand } from "./simulation";
import { gasConduitState, liquidConduitState } from "./world/instances";

const PACK_LINES = Object.values(WORLD_LINE_BLUEPRINTS);

describe("conduit command boundary", () => {
  it("has one binary control state per phase and no purpose-specific settings", () => {
    const state = createScenarioGame("flash_point");
    const conduit = gasConduitState(state, "gas:core__furnace");
    expect(conduit).toMatchObject({ enabled: false });
    expect(Object.keys(conduit)).not.toContain("setting");
    expect(Object.keys(state)).not.toContain("gasLines");
    expect(Object.keys(state)).not.toContain("liquidLines");
    expect(Object.keys(state)).not.toContain("routingPriorities");
  });

  it("toggles a run+phase and rejects unavailable phases", () => {
    let state = executeCommand(createScenarioGame("flash_point"), { type: "begin_level" }).state;
    const enabled = executeCommand(state, {
      type: "set_conduit",
      connectionId: "gas:core__furnace",
      enabled: true,
    });
    expect(enabled.accepted).toBe(true);
    state = enabled.state;
    expect(gasConduitState(state, "gas:core__furnace").enabled).toBe(true);

    const unavailable = executeCommand(state, {
      type: "set_conduit",
      connectionId: "liquid:core__furnace",
      enabled: true,
    });
    expect(unavailable.accepted).toBe(false);
  });

  it("keeps every phase route on its owning definition", () => {
    let state = executeCommand(createScenarioGame("morrow_pocket"), { type: "begin_level" }).state;
    state.matter = 10_000;
    for (const line of PACK_LINES) {
      const result = executeCommand(state, {
        type: "build_connection",
        kind: line.kind,
        fromRoomId: line.direction[0],
        toRoomId: line.direction[1],
      });
      expect(result.accepted, `${line.id}: ${result.code}`).toBe(true);
      state = result.state;
    }
    for (const line of PACK_LINES) {
      if (line.kind === "gas_line") {
        expect(gasConduitState(state, line.id).route).toEqual(line.route);
      } else {
        expect(liquidConduitState(state, line.id).route).toEqual(line.route);
      }
    }
  });
});
