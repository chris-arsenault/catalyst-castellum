import { describe, expect, it } from "vitest";
import { TRANSPORT_RUNS } from "./config";
import { instance } from "./world/instances";
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
import { type GameCommand, type GameState } from "./types";
import {
  gasConduitState,
  gasJunctionState,
  liquidConduitState,
  liquidJunctionState,
  roomState,
} from "./world/instances";

const PACK_RUN_IDS = Object.keys(TRANSPORT_RUNS);

const command = (source: GameState, value: GameCommand): GameState => {
  const result = executeCommand(source, value);
  expect(result.accepted, result.code ?? undefined).toBe(true);
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
      const keys = PACK_RUN_IDS.flatMap((runId) => {
        const definition = instance(TRANSPORT_RUNS, runId, "transport run");
        if (!definition[phase]) return [];
        return [[...definition.rooms].sort().join("|")];
      });
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("exposes exactly one telemetry channel for each authored phase", () => {
    const state = createScenarioGame("commissioning_exam");
    for (const runId of PACK_RUN_IDS) {
      const channels = transportRunChannels(state, runId);
      expect(channels.filter((channel) => channel.phase === "gas")).toHaveLength(
        instance(TRANSPORT_RUNS, runId, "transport run").gas ? 1 : 0
      );
      expect(channels.filter((channel) => channel.phase === "liquid")).toHaveLength(
        instance(TRANSPORT_RUNS, runId, "transport run").liquid ? 1 : 0
      );
    }
  });
});

describe("shared conserved mixture transport", () => {
  it("moves H2 and O2 through one actuator and one retained inventory", () => {
    let state = enter("flash_point");
    expect(state.gasBuffers.cathode_header.gas.hydrogen).toBe(0);
    expect(gasJunctionState(state, "lower_intake").gas.hydrogen).toBe(0);
    state = command(state, {
      type: "set_conduit",
      runId: "core_furnace",
      phase: "gas",
      enabled: true,
    });
    state = command(state, { type: "start_prime" });
    state = advance(state, 6);

    const conduit = gasConduitState(state, "core_furnace");
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
      roomState(state, "furnace").gas.lower.hydrogen +
      roomState(state, "furnace").gas.upper.hydrogen;
    state = advance(state, 2);
    expect(
      roomState(state, "furnace").gas.lower.hydrogen +
        roomState(state, "furnace").gas.upper.hydrogen
    ).toBeCloseTo(initialHydrogen, 5);
    expect(gasConduitState(state, "core_furnace").flowCause).toBe("priming");
    state = advance(state, 10);
    expect(
      roomState(state, "furnace").gas.lower.hydrogen +
        roomState(state, "furnace").gas.upper.hydrogen
    ).toBeGreaterThan(initialHydrogen);
  });

  it("allocates a shared junction to branches without starving the later run ID", () => {
    const state = enter("acid_line");
    gasConduitState(state, "cell_furnace").enabled = true;
    gasConduitState(state, "cell_absorber").installed = true;
    gasConduitState(state, "cell_absorber").enabled = true;
    gasJunctionState(state, "lower_intake").gas.hydrogen = 8;
    gasJunctionState(state, "lower_intake").gas.chlorine = 8;
    simulateNetworks(state, 0.5);

    expect(gasConduitState(state, "cell_furnace").gas.hydrogen).toBeGreaterThan(0);
    expect(gasConduitState(state, "cell_absorber").gas.hydrogen).toBeGreaterThan(0);
    expect(gasConduitState(state, "cell_furnace").gas.chlorine).toBeGreaterThan(0);
    expect(gasConduitState(state, "cell_absorber").gas.chlorine).toBeGreaterThan(0);
    expect(gasJunctionState(state, "lower_intake").gas.hydrogen).toBeGreaterThanOrEqual(0);
  });
});

describe("equipment-owned process buffers", () => {
  it("connects membrane-cell buffers to the installed room junction", () => {
    const state = command(createScenarioGame("commissioning_exam"), { type: "begin_level" });
    for (const room of Object.values(state.rooms)) {
      room.equipment.socket_a = null;
      room.equipment.socket_b = null;
    }
    roomState(state, "furnace").equipment.socket_a = {
      equipmentId: "membrane_cell",
      level: 1,
      enabled: true,
    };
    state.gasBuffers.anode_header.gas.chlorine = 8;
    gasConduitState(state, "furnace_return").enabled = true;

    simulateNetworks(state, 0.5);

    expect(state.gasBuffers.anode_header.gas.chlorine).toBeLessThan(8);
    expect(
      gasJunctionState(state, "furnace").gas.chlorine +
        gasConduitState(state, "furnace_return").gas.chlorine
    ).toBeGreaterThan(0);
    expect(gasJunctionState(state, "lower_intake").gas.chlorine).toBe(0);
  });

  it("connects the cell-liquor buffer to the installed room liquid junction", () => {
    const state = command(createScenarioGame("commissioning_exam"), { type: "begin_level" });
    for (const room of Object.values(state.rooms)) {
      room.equipment.socket_a = null;
      room.equipment.socket_b = null;
    }
    roomState(state, "reservoir").equipment.socket_a = {
      equipmentId: "membrane_cell",
      level: 1,
      enabled: true,
    };
    state.liquidBuffers.cell_liquor.liquid.sodium_hydroxide = 8;
    liquidConduitState(state, "absorber_final").enabled = true;

    simulateNetworks(state, 0.5);

    expect(state.liquidBuffers.cell_liquor.liquid.sodium_hydroxide).toBeLessThan(8);
    expect(
      liquidJunctionState(state, "reservoir").liquid.sodium_hydroxide +
        liquidConduitState(state, "absorber_final").liquid.sodium_hydroxide
    ).toBeGreaterThan(0);
    expect(liquidJunctionState(state, "lower_intake").liquid.sodium_hydroxide).toBe(0);
  });
});

describe("backpressure capacity", () => {
  it("never admits replacement inventory for discharge blocked at the destination", () => {
    const gasState = enter("flash_point");
    gasConduitState(gasState, "core_furnace").enabled = true;
    const gasCapacity = conduitCapacity(gasState, "core_furnace", "gas");
    gasConduitState(gasState, "core_furnace").gas.hydrogen = gasCapacity;
    roomState(gasState, "furnace").gas.lower.nitrogen = 500;
    roomState(gasState, "furnace").gas.upper.nitrogen = 500;
    simulateNetworks(gasState, 0.5);
    const retainedGas = Object.values(gasConduitState(gasState, "core_furnace").gas).reduce(
      (total, amount) => total + amount,
      0
    );
    expect(retainedGas).toBeLessThanOrEqual(gasCapacity + 1e-8);

    const liquidState = enter("make_the_reagent");
    liquidConduitState(liquidState, "core_cell").enabled = true;
    const liquidCapacity = conduitCapacity(liquidState, "core_cell", "liquid");
    liquidConduitState(liquidState, "core_cell").liquid.water = liquidCapacity;
    roomState(liquidState, "lower_intake").liquid.water = 90;
    simulateNetworks(liquidState, 0.5);
    const retainedLiquid = Object.values(
      liquidConduitState(liquidState, "core_cell").liquid
    ).reduce((total, amount) => total + amount, 0);
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

    const retained = liquidConduitState(state, "core_cell").liquid;
    const delivered = roomState(state, "lower_intake").liquid;
    expect(retained.water + delivered.water).toBeGreaterThan(0);
    expect(retained.sodium_chloride + delivered.sodium_chloride).toBeGreaterThan(0);
    expect(
      (retained.water + delivered.water) / (retained.sodium_chloride + delivered.sodium_chloride)
    ).toBeCloseTo(1, 2);
  });

  it("derives capacity from each live serializable route", () => {
    const state = createScenarioGame("commissioning_exam");
    const original = conduitCapacity(state, "core_furnace", "gas");
    gasConduitState(state, "core_furnace").route = gasConduitState(
      state,
      "core_furnace"
    ).route.slice(0, -8);
    expect(conduitCapacity(state, "core_furnace", "gas")).toBeLessThan(original);
  });
});
