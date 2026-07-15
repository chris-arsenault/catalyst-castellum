import { describe, expect, it } from "vitest";
import { WORLD_MAP } from "./config";
import { isProcessLine } from "./world/map";
import { createScenarioGame, executeCommand } from "./simulation";
import { gasConduitState, liquidConduitState } from "./world/instances";

const PACK_LINES = Object.values(WORLD_MAP.connections).filter(isProcessLine);
const PACK_LINE_IDS = PACK_LINES.map(({ id }) => id);

describe("conduit command boundary", () => {
  it("has one binary control state per phase and no purpose-specific settings", () => {
    const state = createScenarioGame("flash_point");
    const conduit = gasConduitState(state, "gas:core__furnace");
    expect(conduit).toMatchObject({ installed: true, enabled: false });
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
    const state = createScenarioGame("commissioning_exam");
    for (const line of PACK_LINES) {
      if (line.kind === "gas_line") {
        expect(gasConduitState(state, line.id).route).toEqual(line.route);
      } else {
        expect(liquidConduitState(state, line.id).route).toEqual(line.route);
      }
    }
  });
});
