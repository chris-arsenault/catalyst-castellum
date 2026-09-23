import { describe, expect, it } from "vitest";
import { corridorCombat, corridorEncounter } from "./__fixtures__/corridor";
import { createEncounter } from "./create";
import { createEncounterRuntime } from "./runtime";
import type { EncounterDefinition } from "./types";

const doorwayEncounter: EncounterDefinition = {
  ...corridorEncounter,
  map: {
    ...corridorEncounter.map,
    connections: {
      doorway: {
        id: "doorway",
        kind: "door",
        rooms: ["core", "core"],
        connectorCells: Array.from({ length: 4 }, (_, index) => ({
          column: 10,
          elevation: index + 1,
        })),
        endpoints: [
          { column: 9, elevation: 1 },
          { column: 11, elevation: 1 },
        ],
        orientation: "horizontal",
        sillElevation: 1,
        aperture: 1,
        gasConductance: 1,
        liquidConductance: 1,
        liquidMode: "spill",
        defaultOpen: true,
        defaultSealed: false,
        sealGroupId: null,
        hostRoomId: "core",
      },
    },
  },
  initialPortalStates: {
    doorway: { open: true, sealed: false, lastGasFlow: 0, lastLiquidFlow: 0 },
  },
};

describe("process-free encounter portals", () => {
  it("executes architectural commands and refuses a closure that disconnects a scheduled route", () => {
    const runtime = createEncounterRuntime({
      combat: corridorCombat,
      definition: doorwayEncounter,
      process: null,
    });
    const state = createEncounter(corridorCombat, doorwayEncounter);
    const opened = runtime.execute(state, {
      tick: 0,
      sequence: 0,
      command: { type: "set_portal", connectionId: "doorway", open: true },
    });
    expect(opened.decision.allowed).toBe(true);
    expect(opened.state.process).toBeNull();
    expect(runtime.load(runtime.save(opened.state))).toEqual(opened.state);
    const closed = runtime.execute(opened.state, {
      tick: 0,
      sequence: 1,
      command: { type: "set_portal", connectionId: "doorway", open: false },
    });
    expect(closed.decision.code).toBe("route_unavailable");
    expect(closed.state.portalStates.doorway?.open).toBe(true);
  });
});
