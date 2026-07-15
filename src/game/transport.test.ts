import { describe, expect, it } from "vitest";
import { WORLD_MAP } from "./config";
import { isProcessLine } from "./world/map";
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

const PACK_LINES = Object.values(WORLD_MAP.connections).filter(isProcessLine);
const PACK_LINE_IDS = PACK_LINES.map(({ id }) => id);

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
    for (const kind of ["gas_line", "liquid_line"] as const) {
      const keys = PACK_LINES.filter((line) => line.kind === kind).map((line) =>
        [...line.rooms].sort().join("|")
      );
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("exposes exactly one telemetry channel for each authored phase", () => {
    const state = createScenarioGame("commissioning_exam");
    for (const line of PACK_LINES) {
      const channels = transportRunChannels(state, line.id);
      expect(channels.filter((channel) => channel.phase === "gas")).toHaveLength(
        line.kind === "gas_line" ? 1 : 0
      );
      expect(channels.filter((channel) => channel.phase === "liquid")).toHaveLength(
        line.kind === "liquid_line" ? 1 : 0
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
      connectionId: "gas:core__furnace",
      enabled: true,
    });
    state = command(state, { type: "start_prime" });
    state = advance(state, 6);

    const conduit = gasConduitState(state, "gas:core__furnace");
    expect(conduit.enabled).toBe(true);
    expect(conduit.gas.hydrogen).toBeGreaterThan(0);
    expect(conduit.gas.oxygen).toBeGreaterThan(0);
    expect(conduit.gas.hydrogen / conduit.gas.oxygen).toBeCloseTo(2, 3);
    expect(transportRunChannels(state, "gas:core__furnace")).toHaveLength(1);
  });

  it("uses route capacity as real hold-up before material reaches the room", () => {
    let state = enter("flash_point");
    state = command(state, {
      type: "set_conduit",
      connectionId: "gas:core__furnace",
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
    expect(gasConduitState(state, "gas:core__furnace").flowCause).toBe("priming");
    state = advance(state, 10);
    expect(
      roomState(state, "furnace").gas.lower.hydrogen +
        roomState(state, "furnace").gas.upper.hydrogen
    ).toBeGreaterThan(initialHydrogen);
  });

  it("allocates a shared junction to branches without starving the later run ID", () => {
    const state = enter("acid_line");
    gasConduitState(state, "gas:furnace__lower_intake").enabled = true;
    gasConduitState(state, "gas:lower_intake__reservoir").installed = true;
    gasConduitState(state, "gas:lower_intake__reservoir").enabled = true;
    gasJunctionState(state, "lower_intake").gas.hydrogen = 8;
    gasJunctionState(state, "lower_intake").gas.chlorine = 8;
    simulateNetworks(state, 0.5);

    expect(gasConduitState(state, "gas:furnace__lower_intake").gas.hydrogen).toBeGreaterThan(0);
    expect(gasConduitState(state, "gas:lower_intake__reservoir").gas.hydrogen).toBeGreaterThan(0);
    expect(gasConduitState(state, "gas:furnace__lower_intake").gas.chlorine).toBeGreaterThan(0);
    expect(gasConduitState(state, "gas:lower_intake__reservoir").gas.chlorine).toBeGreaterThan(0);
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
    gasConduitState(state, "gas:furnace__gallery").enabled = true;

    simulateNetworks(state, 0.5);

    expect(state.gasBuffers.anode_header.gas.chlorine).toBeLessThan(8);
    expect(
      gasJunctionState(state, "furnace").gas.chlorine +
        gasConduitState(state, "gas:furnace__gallery").gas.chlorine
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
    liquidConduitState(state, "liquid:reservoir__washlock").enabled = true;

    simulateNetworks(state, 0.5);

    expect(state.liquidBuffers.cell_liquor.liquid.sodium_hydroxide).toBeLessThan(8);
    expect(
      liquidJunctionState(state, "reservoir").liquid.sodium_hydroxide +
        liquidConduitState(state, "liquid:reservoir__washlock").liquid.sodium_hydroxide
    ).toBeGreaterThan(0);
    expect(liquidJunctionState(state, "lower_intake").liquid.sodium_hydroxide).toBe(0);
  });
});

describe("backpressure capacity", () => {
  it("never admits replacement inventory for discharge blocked at the destination", () => {
    const gasState = enter("flash_point");
    gasConduitState(gasState, "gas:core__furnace").enabled = true;
    const gasCapacity = conduitCapacity(gasState, "gas:core__furnace", "gas");
    gasConduitState(gasState, "gas:core__furnace").gas.hydrogen = gasCapacity;
    roomState(gasState, "furnace").gas.lower.nitrogen = 500;
    roomState(gasState, "furnace").gas.upper.nitrogen = 500;
    simulateNetworks(gasState, 0.5);
    const retainedGas = Object.values(gasConduitState(gasState, "gas:core__furnace").gas).reduce(
      (total, amount) => total + amount,
      0
    );
    expect(retainedGas).toBeLessThanOrEqual(gasCapacity + 1e-8);

    const liquidState = enter("make_the_reagent");
    liquidConduitState(liquidState, "liquid:core__lower_intake").enabled = true;
    const liquidCapacity = conduitCapacity(liquidState, "liquid:core__lower_intake", "liquid");
    liquidConduitState(liquidState, "liquid:core__lower_intake").liquid.water = liquidCapacity;
    roomState(liquidState, "lower_intake").liquid.water = 90;
    simulateNetworks(liquidState, 0.5);
    const retainedLiquid = Object.values(
      liquidConduitState(liquidState, "liquid:core__lower_intake").liquid
    ).reduce((total, amount) => total + amount, 0);
    expect(retainedLiquid).toBeLessThanOrEqual(liquidCapacity + 1e-8);
  });
});

describe("liquid lift and physical route geometry", () => {
  it("pumps the complete water/brine mixture over the authored crest", () => {
    let state = enter("make_the_reagent");
    state = command(state, {
      type: "set_conduit",
      connectionId: "liquid:core__lower_intake",
      enabled: true,
    });
    state = command(state, { type: "start_prime" });
    const source = conduitEndpoint(state, "liquid:core__lower_intake", "liquid", "from");
    const crest = conduitCrestElevation(state, "liquid:core__lower_intake", "liquid");
    expect(crest).toBeGreaterThanOrEqual(source.elevation);
    state = advance(state, 14);

    const retained = liquidConduitState(state, "liquid:core__lower_intake").liquid;
    const delivered = roomState(state, "lower_intake").liquid;
    expect(retained.water + delivered.water).toBeGreaterThan(0);
    expect(retained.sodium_chloride + delivered.sodium_chloride).toBeGreaterThan(0);
    expect(
      (retained.water + delivered.water) / (retained.sodium_chloride + delivered.sodium_chloride)
    ).toBeCloseTo(1, 2);
  });

  it("derives capacity from each live serializable route", () => {
    const state = createScenarioGame("commissioning_exam");
    const original = conduitCapacity(state, "gas:core__furnace", "gas");
    gasConduitState(state, "gas:core__furnace").route = gasConduitState(
      state,
      "gas:core__furnace"
    ).route.slice(0, -8);
    expect(conduitCapacity(state, "gas:core__furnace", "gas")).toBeLessThan(original);
  });
});
