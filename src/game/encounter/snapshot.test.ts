import { describe, expect, it } from "vitest";
import { createEncounter } from "./create";
import { createEncounterRuntime } from "./runtime";
import { corridorCombat, corridorEncounter } from "./__fixtures__/corridor";
import type { EncounterState } from "./types";

const runtime = createEncounterRuntime({
  combat: corridorCombat,
  definition: corridorEncounter,
  process: null,
});
const initial = createEncounter(corridorCombat, corridorEncounter);
const placed = runtime.execute(initial, {
  tick: 0,
  sequence: 0,
  command: {
    type: "place_tower",
    chassisId: "flash_chamber",
    anchor: { column: 1, elevation: 1 },
    mountFace: "left_wall",
    orientation: "right",
  },
}).state;
const saved = runtime.save(placed);
type Mutation = (state: EncounterState) => void;

const mutations: [string, Mutation][] = [
  [
    "world catalog",
    (state) => {
      state.world.rooms = [];
    },
  ],
  [
    "portal identity",
    (state) => {
      state.portalStates.ghost = { open: true, sealed: false, lastGasFlow: 0, lastLiquidFlow: 0 };
    },
  ],
  [
    "tower firing origin",
    (state) => {
      state.towers["tower:isolated:1"]!.placement.firingOrigin.x += 2;
    },
  ],
  [
    "tower purchase value",
    (state) => {
      state.towers["tower:isolated:1"]!.totalMatterSpent = 1000;
    },
  ],
  [
    "duplicate upgrade",
    (state) => {
      state.towers["tower:isolated:1"]!.upgrades = ["flash_calibration", "flash_calibration"];
    },
  ],
  [
    "route endpoint",
    (state) => {
      state.map.coreBreachCell.column = 19;
    },
  ],
  [
    "command cursor",
    (state) => {
      state.commandCursor.tick = state.tick + 1;
    },
  ],
];

describe("encounter snapshot semantics", () => {
  it("reserves authored tower identities after their removal", () => {
    const definition = { ...corridorEncounter, initialTowers: placed.towers };
    const authoredRuntime = createEncounterRuntime({
      combat: corridorCombat,
      definition,
      process: null,
    });
    const authored = createEncounter(corridorCombat, definition);
    const removed = authoredRuntime.execute(authored, {
      tick: 0,
      sequence: 0,
      command: { type: "dismantle_tower", towerId: "tower:isolated:1" },
    });
    expect(removed.decision.allowed).toBe(true);
    const replacement = authoredRuntime.execute(removed.state, {
      tick: 0,
      sequence: 1,
      command: {
        type: "place_tower",
        chassisId: "flash_chamber",
        anchor: { column: 1, elevation: 1 },
        mountFace: "left_wall",
        orientation: "right",
      },
    });
    expect(replacement.decision.allowed).toBe(true);
    expect(Object.keys(replacement.state.towers)).toEqual(["tower:isolated:2"]);
  });

  it.each(mutations)("rejects a structurally valid forged %s", (_name, mutate) => {
    const value = JSON.parse(saved) as { version: number; encounter: EncounterState };
    mutate(value.encounter);
    expect(runtime.load(JSON.stringify(value))).toBeNull();
  });

  it("round-trips valid mechanics and continues the same command sequence", () => {
    const restored = runtime.load(saved);
    expect(restored).toEqual(placed);
    const command = { tick: 0, sequence: 1, command: { type: "start_assault" as const } };
    expect(runtime.execute(restored!, command)).toEqual(runtime.execute(placed, command));
  });

  it("rejects authored initial towers that would create an unsavable encounter", () => {
    const towers = structuredClone(placed.towers);
    towers["tower:isolated:1"]!.placement.firingOrigin.x += 2;
    expect(() =>
      createEncounter(corridorCombat, { ...corridorEncounter, initialTowers: towers })
    ).toThrow("placement cache");
  });
});
