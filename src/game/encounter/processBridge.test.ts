import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_DEFINITION } from "../definition";
import { facilityModelForMap } from "../world/derivedModel";
import { towerRoomId } from "../engine/towerPlacement";
import { createEncounter } from "./create";
import { createEncounterRuntime } from "./runtime";
import { RETAINED_PROCESS_BRIDGE } from "./processBridge";
import { configuredProcess } from "./processContext";
import { cloneProcessState } from "./processState";
import type { ProcessEncounterContext } from "./processTypes";

const processFixture = () => {
  const base = DEFAULT_GAME_DEFINITION;
  const context: ProcessEncounterContext = {
    combat: {
      id: "process-fixture",
      contentVersion: 1,
      tickSeconds: 0.1,
      mechanics: { kind: "legacy" },
      towers: base.towers,
      enemies: base.enemies,
    },
    definition: {
      id: "finite-room",
      contentVersion: 1,
      instanceNamespace: "fixture",
      map: base.map,
      wave: [],
      maximumTicks: 100,
      startingMatter: 1_000,
      startingCoreIntegrity: 100,
      availability: { towers: ["carbon_burner"], equipment: [], gasLines: [], liquidLines: [] },
      initialTowers: {},
      initialPortalStates: facilityModelForMap(base.map).initialPortalStates(),
      process: {
        species: base.species,
        reactions: base.reactions,
        equipment: base.equipment,
        ambientGas: base.ambientGas,
        environmentHazards: base.environmentHazards,
        lineBlueprints: base.lineBlueprints,
        lineSpecs: base.lineSpecs,
        loadout: {
          equipment: {},
          initialTemperatures: {},
          gasConduits: {},
          liquidConduits: {},
          stationary: {},
        },
        supplies: ["active", "deferred"].map((id) => ({
          id,
          code: id,
          phase: "gas",
          capacity: 20,
          initial: { hydrogen: 5 },
          availableFromRound: id,
          replenishment: { kind: "matter", contents: { hydrogen: 10 }, cost: 20 },
          accent: "#ffffff",
        })),
        availableSupplyIds: ["active"],
      },
    },
    process: RETAINED_PROCESS_BRIDGE,
  };
  const runtime = createEncounterRuntime(context);
  const state = configuredProcess(
    createEncounter(context.combat, context.definition, context.process),
    context
  )!.state;
  return { context, runtime, state };
};

describe("retained process encounter bridge", () => {
  it("keeps deferred reservoirs and clones every process inventory independently", () => {
    const { state, runtime } = processFixture();
    expect(runtime.validate(state)).toEqual([]);
    expect(state.process.gasSources.deferred!.gas.hydrogen).toBe(5);
    const copied = cloneProcessState(state.process);
    copied.gasSources.deferred!.gas.hydrogen = 0;
    const roomId = Object.keys(copied.rooms)[0]!;
    copied.rooms[roomId]!.gas.lower.oxygen = 0;
    expect(state.process.gasSources.deferred!.gas.hydrogen).toBe(5);
    expect(state.process.rooms[roomId]!.gas.lower.oxygen).toBeGreaterThan(0);
    expect(state).not.toHaveProperty("campaign");
    expect(state).not.toHaveProperty("rooms");
  });

  it("applies explicit supply availability and records campaign-free command events", () => {
    const { state, runtime } = processFixture();
    expect(
      runtime.evaluate(state, { type: "charge_gas_source", sourceId: "deferred" })
    ).toMatchObject({ allowed: false, code: "unavailable" });
    const command = { type: "charge_gas_source", sourceId: "active" } as const;
    const result = runtime.execute(state, { tick: 0, sequence: 0, command });
    expect(result.decision).toMatchObject({ allowed: true, cost: 20, amount: 10 });
    expect(result.state.process?.gasSources.active!.gas.hydrogen).toBe(15);
    expect(result.state.matter).toBe(980);
    expect(state.process.gasSources.active!.gas.hydrogen).toBe(5);
    expect(result.events[0]).toMatchObject({
      encounterId: "finite-room",
      code: "gas_source_charged",
      phase: "build",
    });
    expect(result.events[0]).not.toHaveProperty("levelId");
    expect(result.events[0]).not.toHaveProperty("round");
  });

  it("rejects a conduit control whose identity belongs to an architectural portal", () => {
    const { state, runtime } = processFixture();
    const portal = Object.values(state.map.connections).find(
      (connection) => connection.kind !== "gas_line" && connection.kind !== "liquid_line"
    );
    if (!portal) throw new Error("Fixture requires an architectural portal.");
    state.availability.gasLines.push(portal.id);
    const command = { type: "set_conduit", connectionId: portal.id, enabled: true } as const;
    const result = runtime.execute(state, { tick: 0, sequence: 0, command });
    expect(result.decision).toMatchObject({ allowed: false, code: "not_installed" });
    expect(result.state.process).toEqual(state.process);
  });
});

describe("retained process inventory and ticks", () => {
  it("returns every stored species to the owning room before dismantling", () => {
    const { state, runtime } = processFixture();
    const placed = runtime.execute(state, {
      tick: 0,
      sequence: 0,
      command: {
        type: "place_tower",
        chassisId: "carbon_burner",
        anchor: { column: 6, elevation: 8 },
        mountFace: "left_wall",
        orientation: "right",
      },
    });
    expect(placed.decision.allowed).toBe(true);
    const tower = Object.values(placed.state.towers)[0]!;
    const roomId = towerRoomId(placed.state, tower)!;
    const process = placed.state.process!;
    process.towerResources[tower.id] = {
      gas: { hydrogen: 0.5, steam: 0.25 },
      liquid: { water: 0.75 },
    };
    const before = structuredClone(process.rooms[roomId]!);
    const dismantled = runtime.execute(placed.state, {
      tick: 0,
      sequence: 1,
      command: { type: "dismantle_tower", towerId: tower.id },
    });
    expect(dismantled.decision.allowed).toBe(true);
    const room = dismantled.state.process!.rooms[roomId]!;
    expect(room.gas.lower.hydrogen).toBe(before.gas.lower.hydrogen + 0.5);
    expect(room.gas.lower.steam).toBe(before.gas.lower.steam + 0.25);
    expect(room.liquid.water).toBe(before.liquid.water + 0.75);
    expect(dismantled.state.process!.towerResources[tower.id]).toBeUndefined();
    expect(runtime.validate(dismantled.state)).toEqual([]);
    const repeated = runtime.execute(dismantled.state, {
      tick: 0,
      sequence: 2,
      command: { type: "dismantle_tower", towerId: tower.id },
    });
    expect(repeated.decision.allowed).toBe(false);
    expect(repeated.state.process).toEqual(dismantled.state.process);
  });
});

describe("retained process reactions and ticks", () => {
  it("conserves hydrogen and oxygen through finite tower storage and steam exhaust", () => {
    const { state, context, runtime } = processFixture();
    const placed = runtime.execute(state, {
      tick: 0,
      sequence: 0,
      command: {
        type: "place_tower",
        chassisId: "carbon_burner",
        anchor: { column: 6, elevation: 8 },
        mountFace: "left_wall",
        orientation: "right",
      },
    });
    expect(placed.decision.allowed).toBe(true);
    const active = configuredProcess(placed.state, context)!.state;
    const tower = Object.values(active.towers)[0]!;
    const room = active.process.rooms[towerRoomId(active, tower)!]!;
    active.process.towerResources[tower.id] = { gas: { hydrogen: 0.5 }, liquid: {} };
    const elements = () => ({
      hydrogen:
        2 *
        (room.gas.lower.hydrogen +
          room.gas.upper.hydrogen +
          room.gas.lower.steam +
          room.gas.upper.steam +
          (active.process.towerResources[tower.id]!.gas.hydrogen ?? 0)),
      oxygen:
        2 * (room.gas.lower.oxygen + room.gas.upper.oxygen) +
        room.gas.lower.steam +
        room.gas.upper.steam,
    });
    const before = elements();
    const supply = context.process.consumeTowerSupply(active, tower, context);
    expect(supply.damageMultiplier).toBeGreaterThan(1);
    context.process.afterTowerShot(active, tower, supply, context);
    expect(elements().hydrogen).toBeCloseTo(before.hydrogen, 10);
    expect(elements().oxygen).toBeCloseTo(before.oxygen, 10);
    expect(room.gas.upper.steam).toBeGreaterThan(0);
    expect(active.environmentalFields).toContainEqual(
      expect.objectContaining({ id: `tower:${tower.id}:steam-wake` })
    );
    expect(runtime.validate(active)).toEqual([]);
    expect(tower).not.toHaveProperty("localResources");
  });

  it("rejects invalid process inventories and preserves snapshots across exact tick chunks", () => {
    const { state, runtime } = processFixture();
    const together = runtime.advanceTicks(state, 10).state;
    const first = runtime.advanceTicks(state, 4).state;
    const split = runtime.advanceTicks(first, 6).state;
    expect(split).toEqual(together);
    expect(together.elapsed).toBeCloseTo(1, 10);
    expect(state.elapsed).toBe(0);
    state.process.gasSources.active!.gas.hydrogen = -1;
    expect(runtime.validate(state)).toContainEqual(
      expect.stringContaining("finite and nonnegative")
    );
  });
});
