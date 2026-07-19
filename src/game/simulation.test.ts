import { describe, expect, it } from "vitest";
import { WORLD_MAP, SPECIES_DEFINITIONS, roomVolume } from "./config";
const ROOM_ORDER = Object.keys(WORLD_MAP.rooms);
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
  GAS_TYPES,
  LIQUID_TYPES,
  STATIONARY_TYPES,
  type ElementalComposition,
  type EquipmentOutputState,
  type GasAmounts,
  type GameCommand,
  type GameState,
  type LiquidAmounts,
  type SpeciesId,
  type StationaryAmounts,
} from "./types";
import {
  gasConduitState,
  gasJunctionState,
  liquidConduitState,
  liquidJunctionState,
  roomState,
} from "./world/instances";
import { isProcessLine } from "./world/map";

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

const addGasToLedger = (totals: ElementalComposition, gas: GasAmounts): void => {
  for (const species of GAS_TYPES) addSpecies(totals, species, gas[species]);
};

const addLiquidToLedger = (totals: ElementalComposition, liquid: LiquidAmounts): void => {
  for (const species of LIQUID_TYPES) addSpecies(totals, species, liquid[species]);
};

const addStationaryToLedger = (
  totals: ElementalComposition,
  stationary: StationaryAmounts
): void => {
  for (const species of STATIONARY_TYPES) addSpecies(totals, species, stationary[species]);
};

const addEquipmentToLedger = (
  totals: ElementalComposition,
  state: GameState,
  roomId: (typeof ROOM_ORDER)[number]
): void => {
  for (const instance of Object.values(roomState(state, roomId).equipment)) {
    for (const output of Object.values(instance?.operation?.outputs ?? {})) {
      if (output?.phase === "gas") addGasToLedger(totals, output.gas);
      else if (output?.phase === "liquid") addLiquidToLedger(totals, output.liquid);
    }
  }
};

const elementalLedger = (state: GameState): ElementalComposition => {
  const totals: ElementalComposition = {};
  for (const roomId of ROOM_ORDER) {
    addGasToLedger(totals, roomState(state, roomId).gas.lower);
    addGasToLedger(totals, roomState(state, roomId).gas.upper);
    addLiquidToLedger(totals, roomState(state, roomId).liquid);
    addStationaryToLedger(totals, roomState(state, roomId).stationary);
    addGasToLedger(totals, gasJunctionState(state, roomId).gas);
    addLiquidToLedger(totals, liquidJunctionState(state, roomId).liquid);
    addEquipmentToLedger(totals, state, roomId);
  }
  for (const source of Object.values(state.gasSources)) addGasToLedger(totals, source.gas);
  for (const source of Object.values(state.liquidSources)) addLiquidToLedger(totals, source.liquid);
  for (const line of Object.values(state.map.connections).filter(isProcessLine)) {
    if (line.kind === "gas_line") addGasToLedger(totals, gasConduitState(state, line.id).gas);
    else addLiquidToLedger(totals, liquidConduitState(state, line.id).liquid);
  }
  addGasToLedger(totals, state.gasVent);
  addLiquidToLedger(totals, state.liquidDrain);
  return totals;
};

const requireOutputPhase = <Phase extends EquipmentOutputState["phase"]>(
  output: EquipmentOutputState | null | undefined,
  phase: Phase,
  label: string
): Extract<EquipmentOutputState, { phase: Phase }> => {
  if (output?.phase !== phase) throw new Error(`Membrane cell ${label} is missing.`);
  return output as Extract<EquipmentOutputState, { phase: Phase }>;
};

const membraneOutputs = (state: GameState) => {
  const operation = roomState(state, "lower_intake").equipment.socket_a?.operation;
  return {
    anode: requireOutputPhase(operation?.outputs.anode_header, "gas", "anode"),
    cathode: requireOutputPhase(operation?.outputs.cathode_header, "gas", "cathode"),
    liquor: requireOutputPhase(operation?.outputs.cell_liquor, "liquid", "liquor outlet"),
  };
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
      expect(roomStaticPressure(roomState(state, roomId))).toBeCloseTo(101.3, 1);
    }
  });

  it("keeps liquid and static pressure slowdown independent", () => {
    const state = createScenarioGame("flash_point");
    const room = roomState(state, "furnace");
    room.liquid.water = roomVolume("furnace") * 0.45;
    expect(liquidMovementMultiplier(room, false)).toBeLessThan(1);
    expect(liquidMovementMultiplier(room, true)).toBe(1);
    room.gas.lower.nitrogen += 45;
    room.gas.upper.nitrogen += 45;
    expect(pressureMovementMultiplier(room)).toBeLessThan(1);
  });

  it("uses equipment-displaced usable volume for liquid pickup submergence", () => {
    const state = createScenarioGame("stored_chlorine");
    roomState(state, "lower_intake").liquid.water = roomVolume("lower_intake") * 0.125;
    simulateNetworks(state, 0.5);
    expect(
      liquidJunctionState(state, "lower_intake").liquid.water +
        liquidConduitState(state, "liquid:lower_intake__reservoir").liquid.water
    ).toBeGreaterThan(0);
  });
});

/**
 * Unlimited supplies are open boundaries by design, so conservation is asserted
 * against a derived pack whose gas reservoir is a sealed finite stock.
 */
const finiteRuntime = createGameRuntime(
  deriveGame(DEFAULT_GAME_DEFINITION, {
    levels: {
      ...DEFAULT_GAME_DEFINITION.levels,
      flash_point: {
        ...DEFAULT_GAME_DEFINITION.levels.flash_point,
        supplies: DEFAULT_GAME_DEFINITION.levels.flash_point.supplies.map((supply) =>
          supply.phase === "gas"
            ? {
                ...supply,
                replenishment: {
                  kind: "matter" as const,
                  contents: supply.replenishment.contents,
                  cost: 8,
                },
              }
            : supply
        ),
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
      connectionId: "gas:core__furnace",
      enabled: true,
    });
    const before = elementalLedger(state);
    state = run(state, { type: "start_prime" });
    for (let elapsed = 0; elapsed < 23; elapsed += 0.1) state = finiteRuntime.step(state, 0.1);
    const after = elementalLedger(state);

    for (const element of Object.keys(before)) {
      expect(after[element], element).toBeCloseTo(before[element] ?? 0, 5);
    }
    expect(roomState(state, "furnace").combustionCount).toBeGreaterThan(0);
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
      connectionId: "liquid:core__lower_intake",
      enabled: true,
    });
    state = command(state, { type: "start_prime" });
    state = advance(state, 12);

    const { anode, cathode, liquor } = membraneOutputs(state);
    const chlorine =
      anode.gas.chlorine +
      gasJunctionState(state, "lower_intake").gas.chlorine +
      gasConduitState(state, "gas:lower_intake__reservoir").gas.chlorine;
    const hydrogen =
      cathode.gas.hydrogen +
      gasJunctionState(state, "lower_intake").gas.hydrogen +
      gasConduitState(state, "gas:lower_intake__reservoir").gas.hydrogen;
    const caustic =
      liquor.liquid.sodium_hydroxide +
      liquidJunctionState(state, "lower_intake").liquid.sodium_hydroxide +
      liquidConduitState(state, "liquid:core__lower_intake").liquid.sodium_hydroxide;
    expect(chlorine).toBeGreaterThan(0);
    expect(hydrogen).toBeGreaterThan(0);
    expect(caustic).toBeGreaterThan(0);
  });
});
