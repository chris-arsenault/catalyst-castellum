import { describe, expect, it } from "vitest";
import { ROOM_ORDER, SPECIES_DEFINITIONS, roomVolume } from "./config";
import { DEFAULT_GAME_DEFINITION, deriveGame } from "./definition";
import { createGameRuntime } from "./runtime";
import {
  createScenarioGame,
  executeCommand,
  liquidMovementMultiplier,
  pressureMovementMultiplier,
  roomStaticPressure,
  simulateNetworks,
  stepGame,
} from "./simulation";
import {
  GAS_BUFFER_IDS,
  GAS_SOURCE_IDS,
  GAS_TYPES,
  LIQUID_BUFFER_IDS,
  LIQUID_SOURCE_IDS,
  LIQUID_TYPES,
  TRANSPORT_RUN_IDS,
  type ElementalComposition,
  type GameCommand,
  type GameState,
  type SpeciesId,
} from "./types";

const command = (source: GameState, value: GameCommand): GameState => {
  const result = executeCommand(source, value);
  expect(result.accepted, result.code ?? undefined).toBe(true);
  return result.state;
};

const addSpecies = (totals: ElementalComposition, species: SpeciesId, amount: number): void => {
  for (const [element, count] of Object.entries(SPECIES_DEFINITIONS[species].elements)) {
    totals[element] = (totals[element] ?? 0) + amount * count;
  }
};

const elementalLedger = (state: GameState): ElementalComposition => {
  const totals: ElementalComposition = {};
  const addGas = (gas: Record<(typeof GAS_TYPES)[number], number>) => {
    for (const species of GAS_TYPES) addSpecies(totals, species, gas[species]);
  };
  const addLiquid = (liquid: Record<(typeof LIQUID_TYPES)[number], number>) => {
    for (const species of LIQUID_TYPES) addSpecies(totals, species, liquid[species]);
  };
  for (const roomId of ROOM_ORDER) {
    addGas(state.rooms[roomId].gas.lower);
    addGas(state.rooms[roomId].gas.upper);
    addLiquid(state.rooms[roomId].liquid);
    addGas(state.gasJunctions[roomId].gas);
    addLiquid(state.liquidJunctions[roomId].liquid);
  }
  for (const id of GAS_SOURCE_IDS) addGas(state.gasSources[id].gas);
  for (const id of LIQUID_SOURCE_IDS) addLiquid(state.liquidSources[id].liquid);
  for (const id of GAS_BUFFER_IDS) addGas(state.gasBuffers[id].gas);
  for (const id of LIQUID_BUFFER_IDS) addLiquid(state.liquidBuffers[id].liquid);
  for (const id of TRANSPORT_RUN_IDS) {
    addGas(state.gasConduits[id].gas);
    addLiquid(state.liquidConduits[id].liquid);
  }
  addGas(state.gasVent);
  addLiquid(state.liquidDrain);
  return totals;
};

const advance = (source: GameState, seconds: number): GameState => {
  let state = source;
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.1) state = stepGame(state, 0.1);
  return state;
};

describe("finite-volume spatial rooms", () => {
  it("initializes gas against each visible room volume", () => {
    const state = createScenarioGame("flash_point");
    for (const roomId of ROOM_ORDER) {
      expect(roomVolume(roomId)).toBeGreaterThan(0);
      expect(roomStaticPressure(state.rooms[roomId])).toBeCloseTo(101.3, 1);
    }
  });

  it("keeps liquid and static pressure slowdown independent", () => {
    const state = createScenarioGame("flash_point");
    const room = state.rooms.furnace;
    room.liquid.water = roomVolume("furnace") * 0.45;
    expect(liquidMovementMultiplier(room, false)).toBeLessThan(1);
    expect(liquidMovementMultiplier(room, true)).toBe(1);
    room.gas.lower.nitrogen += 45;
    room.gas.upper.nitrogen += 45;
    expect(pressureMovementMultiplier(room)).toBeLessThan(1);
  });

  it("uses equipment-displaced usable volume for liquid pickup submergence", () => {
    const state = createScenarioGame("stored_chlorine");
    state.rooms.lower_intake.liquid.water = roomVolume("lower_intake") * 0.125;
    simulateNetworks(state, 0.5);
    expect(
      state.liquidJunctions.lower_intake.liquid.water +
        state.liquidConduits.cell_absorber.liquid.water
    ).toBeGreaterThan(0);
  });
});

/**
 * Infinite sources are open boundaries by design, so conservation is asserted
 * against a derived pack whose starter header is a sealed finite stock.
 */
const finiteRuntime = createGameRuntime(
  deriveGame(DEFAULT_GAME_DEFINITION, {
    gasSources: {
      starter_gas_header: {
        ...DEFAULT_GAME_DEFINITION.gasSources.starter_gas_header,
        infinite: false,
      },
    },
    levels: {
      ...DEFAULT_GAME_DEFINITION.levels,
      flash_point: {
        ...DEFAULT_GAME_DEFINITION.levels.flash_point,
        loadout: {
          ...DEFAULT_GAME_DEFINITION.levels.flash_point.loadout,
          gasSourceGas: { starter_gas_header: { hydrogen: 100, oxygen: 50 } },
        },
      },
    },
  })
);

describe("complete-state conservation", () => {
  it("conserves elements across junction fill, transport, combustion, and phase changes", () => {
    const run = (source: GameState, value: GameCommand): GameState => {
      const result = finiteRuntime.execute(source, value);
      expect(result.accepted, result.code ?? undefined).toBe(true);
      return result.state;
    };
    let state = run(finiteRuntime.createScenario("flash_point"), { type: "begin_level" });
    state = run(state, {
      type: "install_equipment",
      roomId: "furnace",
      socketId: "socket_a",
      equipmentId: "gas_agitator",
    });
    state = run(state, {
      type: "set_conduit",
      runId: "core_furnace",
      phase: "gas",
      enabled: true,
    });
    const before = elementalLedger(state);
    state = run(state, { type: "start_prime" });
    for (let elapsed = 0; elapsed < 23; elapsed += 0.1) state = finiteRuntime.step(state, 0.1);
    const after = elementalLedger(state);

    for (const element of Object.keys(before)) {
      expect(after[element], element).toBeCloseTo(before[element] ?? 0, 5);
    }
    expect(state.rooms.furnace.combustionCount).toBeGreaterThan(0);
  });

  it("keeps every membrane-cell co-product in state", () => {
    let state = command(createScenarioGame("make_the_reagent"), { type: "begin_level" });
    state = command(state, {
      type: "install_equipment",
      roomId: "lower_intake",
      socketId: "socket_a",
      equipmentId: "membrane_cell",
    });
    state = command(state, {
      type: "set_conduit",
      runId: "core_cell",
      phase: "liquid",
      enabled: true,
    });
    state = command(state, { type: "start_prime" });
    state = advance(state, 12);

    const chlorine =
      state.gasBuffers.anode_header.gas.chlorine +
      state.gasJunctions.lower_intake.gas.chlorine +
      state.gasConduits.cell_absorber.gas.chlorine;
    const hydrogen =
      state.gasBuffers.cathode_header.gas.hydrogen +
      state.gasJunctions.lower_intake.gas.hydrogen +
      state.gasConduits.cell_absorber.gas.hydrogen;
    const caustic =
      state.liquidBuffers.cell_liquor.liquid.sodium_hydroxide +
      state.liquidJunctions.lower_intake.liquid.sodium_hydroxide;
    expect(chlorine).toBeGreaterThan(0);
    expect(hydrogen).toBeGreaterThan(0);
    expect(caustic).toBeGreaterThan(0);
  });
});
