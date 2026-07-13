import { describe, expect, it } from "vitest";
import { TRANSPORT_RUNS } from "./config";
import {
  conduitCapacity,
  conduitCrestElevation,
  conduitEndpoint,
  createScenarioGame,
  executeCommand,
  simulateNetworks,
  stepGame,
  transportRunChannels,
} from "./simulation";
import { TRANSPORT_RUN_IDS, type GameCommand, type GameState } from "./types";

const command = (source: GameState, value: GameCommand): GameState => {
  const result = executeCommand(source, value);
  expect(result.accepted, result.reason ?? undefined).toBe(true);
  return result.state;
};

const enter = (level: "flash_point" | "make_the_reagent" | "acid_line") =>
  command(createScenarioGame(level), { type: "begin_level" });

const advance = (source: GameState, seconds: number): GameState => {
  let state = source;
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.1) state = stepGame(state, 0.1);
  return state;
};

describe("one physical conduit per room pair and phase", () => {
  it("authors no duplicate phase conduit for an unordered room pair", () => {
    for (const phase of ["gas", "liquid"] as const) {
      const keys = TRANSPORT_RUN_IDS.flatMap((runId) => {
        const definition = TRANSPORT_RUNS[runId];
        if (!definition[phase]) return [];
        return [[...definition.rooms].sort().join("|")];
      });
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("exposes exactly one telemetry channel for each authored phase", () => {
    const state = createScenarioGame("commissioning_exam");
    for (const runId of TRANSPORT_RUN_IDS) {
      const channels = transportRunChannels(state, runId);
      expect(channels.filter((channel) => channel.phase === "gas")).toHaveLength(
        TRANSPORT_RUNS[runId].gas ? 1 : 0
      );
      expect(channels.filter((channel) => channel.phase === "liquid")).toHaveLength(
        TRANSPORT_RUNS[runId].liquid ? 1 : 0
      );
    }
  });
});

describe("shared conserved mixture transport", () => {
  it("moves H2 and O2 through one actuator and one retained inventory", () => {
    let state = enter("flash_point");
    expect(state.gasBuffers.cathode_header.gas.hydrogen).toBe(0);
    expect(state.gasJunctions.lower_intake.gas.hydrogen).toBe(0);
    state = command(state, {
      type: "set_conduit",
      runId: "core_furnace",
      phase: "gas",
      enabled: true,
    });
    state = command(state, { type: "start_prime" });
    state = advance(state, 6);

    const conduit = state.gasConduits.core_furnace;
    expect(conduit.enabled).toBe(true);
    expect(conduit.gas.hydrogen).toBeGreaterThan(0);
    expect(conduit.gas.oxygen).toBeGreaterThan(0);
    expect(conduit.gas.hydrogen / conduit.gas.oxygen).toBeCloseTo(2, 3);
    expect(transportRunChannels(state, "core_furnace")).toHaveLength(1);
  });

  it("uses route capacity as real hold-up before material reaches the room", () => {
    let state = enter("flash_point");
    state = command(state, {
      type: "set_conduit",
      runId: "core_furnace",
      phase: "gas",
      enabled: true,
    });
    state = command(state, { type: "start_prime" });
    const initialHydrogen =
      state.rooms.furnace.gas.lower.hydrogen + state.rooms.furnace.gas.upper.hydrogen;
    state = advance(state, 2);
    expect(
      state.rooms.furnace.gas.lower.hydrogen + state.rooms.furnace.gas.upper.hydrogen
    ).toBeCloseTo(initialHydrogen, 5);
    expect(state.gasConduits.core_furnace.flowCause).toBe("priming");
    state = advance(state, 10);
    expect(
      state.rooms.furnace.gas.lower.hydrogen + state.rooms.furnace.gas.upper.hydrogen
    ).toBeGreaterThan(initialHydrogen);
  });

  it("allocates a shared junction to branches without starving the later run ID", () => {
    const state = enter("acid_line");
    state.gasConduits.cell_furnace.enabled = true;
    state.gasConduits.cell_absorber.installed = true;
    state.gasConduits.cell_absorber.enabled = true;
    state.gasJunctions.lower_intake.gas.hydrogen = 8;
    state.gasJunctions.lower_intake.gas.chlorine = 8;
    simulateNetworks(state, 0.5);

    expect(state.gasConduits.cell_furnace.gas.hydrogen).toBeGreaterThan(0);
    expect(state.gasConduits.cell_absorber.gas.hydrogen).toBeGreaterThan(0);
    expect(state.gasConduits.cell_furnace.gas.chlorine).toBeGreaterThan(0);
    expect(state.gasConduits.cell_absorber.gas.chlorine).toBeGreaterThan(0);
    expect(state.gasJunctions.lower_intake.gas.hydrogen).toBeGreaterThanOrEqual(0);
  });
});

describe("backpressure capacity", () => {
  it("never admits replacement inventory for discharge blocked at the destination", () => {
    const gasState = enter("flash_point");
    gasState.gasConduits.core_furnace.enabled = true;
    const gasCapacity = conduitCapacity(gasState, "core_furnace", "gas");
    gasState.gasConduits.core_furnace.gas.hydrogen = gasCapacity;
    gasState.rooms.furnace.gas.lower.nitrogen = 500;
    gasState.rooms.furnace.gas.upper.nitrogen = 500;
    simulateNetworks(gasState, 0.5);
    const retainedGas = Object.values(gasState.gasConduits.core_furnace.gas).reduce(
      (total, amount) => total + amount,
      0
    );
    expect(retainedGas).toBeLessThanOrEqual(gasCapacity + 1e-8);

    const liquidState = enter("make_the_reagent");
    liquidState.liquidConduits.core_cell.enabled = true;
    const liquidCapacity = conduitCapacity(liquidState, "core_cell", "liquid");
    liquidState.liquidConduits.core_cell.liquid.water = liquidCapacity;
    liquidState.rooms.lower_intake.liquid.water = 90;
    simulateNetworks(liquidState, 0.5);
    const retainedLiquid = Object.values(liquidState.liquidConduits.core_cell.liquid).reduce(
      (total, amount) => total + amount,
      0
    );
    expect(retainedLiquid).toBeLessThanOrEqual(liquidCapacity + 1e-8);
  });
});

describe("liquid lift and physical route geometry", () => {
  it("pumps the complete water/brine mixture over the authored crest", () => {
    let state = enter("make_the_reagent");
    state = command(state, {
      type: "set_conduit",
      runId: "core_cell",
      phase: "liquid",
      enabled: true,
    });
    state = command(state, { type: "start_prime" });
    const source = conduitEndpoint(state, "core_cell", "liquid", "from");
    const crest = conduitCrestElevation(state, "core_cell", "liquid");
    expect(crest).toBeGreaterThanOrEqual(source.elevation);
    state = advance(state, 14);

    const retained = state.liquidConduits.core_cell.liquid;
    const delivered = state.rooms.lower_intake.liquid;
    expect(retained.water + delivered.water).toBeGreaterThan(0);
    expect(retained.sodium_chloride + delivered.sodium_chloride).toBeGreaterThan(0);
    expect(
      (retained.water + delivered.water) / (retained.sodium_chloride + delivered.sodium_chloride)
    ).toBeCloseTo(1, 2);
  });

  it("derives capacity from each live serializable route", () => {
    const state = createScenarioGame("commissioning_exam");
    const original = conduitCapacity(state, "core_furnace", "gas");
    state.gasConduits.core_furnace.route = state.gasConduits.core_furnace.route.slice(0, -8);
    expect(conduitCapacity(state, "core_furnace", "gas")).toBeLessThan(original);
  });
});
