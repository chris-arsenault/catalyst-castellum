import { describe, expect, it } from "vitest";
import { TRANSPORT_RUNS } from "./config";
import { instance } from "./world/instances";
import { createScenarioGame, executeCommand } from "./simulation";
import { gasConduitState, liquidConduitState } from "./world/instances";

const PACK_RUN_IDS = Object.keys(TRANSPORT_RUNS);

describe("conduit command boundary", () => {
  it("has one binary control state per phase and no purpose-specific settings", () => {
    const state = createScenarioGame("flash_point");
    const conduit = gasConduitState(state, "core_furnace");
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
      runId: "core_furnace",
      phase: "gas",
      enabled: true,
    });
    expect(enabled.accepted).toBe(true);
    state = enabled.state;
    expect(gasConduitState(state, "core_furnace").enabled).toBe(true);

    const unavailable = executeCommand(state, {
      type: "set_conduit",
      runId: "core_furnace",
      phase: "liquid",
      enabled: true,
    });
    expect(unavailable.accepted).toBe(false);
  });

  it("keeps every phase route on its owning definition", () => {
    const state = createScenarioGame("commissioning_exam");
    for (const runId of PACK_RUN_IDS) {
      const definition = instance(TRANSPORT_RUNS, runId, "transport run");
      if (definition.gas) {
        expect(gasConduitState(state, runId).route).toEqual(definition.gas.blueprint);
      }
      if (definition.liquid) {
        expect(liquidConduitState(state, runId).route).toEqual(definition.liquid.blueprint);
      }
    }
  });
});
