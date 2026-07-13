import { describe, expect, it } from "vitest";
import { FACILITY_MAP, ROOM_ORDER } from "./config";
import {
  simulateArchitecturalGas,
  simulateArchitecturalLiquid,
  verticalPortalOrder,
} from "./engine/architecturalFlow";
import { createScenarioGame } from "./simulation";
import { GAS_TYPES, LIQUID_TYPES, type GameState } from "./types";

const gasLedger = (state: GameState) =>
  Object.fromEntries(
    GAS_TYPES.map((species) => [
      species,
      ROOM_ORDER.reduce(
        (total, roomId) =>
          total + state.rooms[roomId].gas.lower[species] + state.rooms[roomId].gas.upper[species],
        0
      ),
    ])
  );

const liquidLedger = (state: GameState) =>
  Object.fromEntries(
    LIQUID_TYPES.map((species) => [
      species,
      ROOM_ORDER.reduce((total, roomId) => total + state.rooms[roomId].liquid[species], 0),
    ])
  );

const gasThermalLedger = (state: GameState): number =>
  ROOM_ORDER.reduce((facilityTotal, roomId) => {
    const room = state.rooms[roomId];
    const lowerAmount = GAS_TYPES.reduce((total, species) => total + room.gas.lower[species], 0);
    const upperAmount = GAS_TYPES.reduce((total, species) => total + room.gas.upper[species], 0);
    return (
      facilityTotal +
      lowerAmount * (room.gasTemperature.lower + 273.15) +
      upperAmount * (room.gasTemperature.upper + 273.15)
    );
  }, 0);

describe("architectural gas exchange", () => {
  it("moves a buoyant/pressurized whole mixture upward through the authored ladder shaft", () => {
    const state = createScenarioGame("flash_point");
    state.rooms.switchyard.gas.upper.hydrogen += 18;
    state.rooms.switchyard.gas.upper.oxygen += 9;
    state.rooms.switchyard.gasTemperature.upper = 118;
    state.rooms.furnace.gasTemperature.lower = 4;
    const before = gasLedger(state);
    const thermalBefore = gasThermalLedger(state);
    const destinationHydrogen = state.rooms.furnace.gas.lower.hydrogen;

    simulateArchitecturalGas(state, 1);

    expect(state.rooms.furnace.gas.lower.hydrogen).toBeGreaterThan(destinationHydrogen);
    expect(state.rooms.furnace.gas.lower.oxygen).toBeGreaterThan(0);
    expect(state.rooms.furnace.gasTemperature.lower).toBeGreaterThan(4);
    expect(state.portalStates.switchyard_to_furnace_shaft!.lastGasFlow).toBeGreaterThan(0);
    const after = gasLedger(state);
    for (const species of GAS_TYPES) expect(after[species]!).toBeCloseTo(before[species]!, 8);
    expect(gasThermalLedger(state)).toBeCloseTo(thermalBefore, 6);
  });

  it("transfers nothing through the same shaft when its seal is active", () => {
    const state = createScenarioGame("flash_point");
    state.rooms.switchyard.gas.upper.hydrogen += 18;
    state.portalStates.switchyard_to_furnace_shaft!.sealed = true;
    const before = state.rooms.furnace.gas.lower.hydrogen;

    simulateArchitecturalGas(state, 1);

    expect(state.rooms.furnace.gas.lower.hydrogen).toBe(before);
    expect(state.portalStates.switchyard_to_furnace_shaft!.lastGasFlow).toBe(0);
  });

  it("never exchanges atmosphere through the closed, sealed Core boundary", () => {
    const state = createScenarioGame("flash_point");
    state.rooms.washlock.gas.lower.hydrogen += 30;
    const coreHydrogenBefore =
      state.rooms.core.gas.lower.hydrogen + state.rooms.core.gas.upper.hydrogen;

    simulateArchitecturalGas(state, 2);

    expect(state.rooms.core.gas.lower.hydrogen + state.rooms.core.gas.upper.hydrogen).toBe(
      coreHydrogenBefore
    );
    expect(state.portalStates.washlock_to_core_door).toMatchObject({
      open: false,
      sealed: true,
      lastGasFlow: 0,
    });
  });
});

describe("architectural liquid exchange", () => {
  it("derives gravity direction from portal endpoints even when room centers imply the opposite", () => {
    const trapdoor = FACILITY_MAP.portals.find(({ id }) => id === "reservoir_to_gallery_trapdoor")!;
    expect(
      verticalPortalOrder({
        ...trapdoor,
        endpoints: [
          { ...trapdoor.endpoints[0], elevation: 5 },
          { ...trapdoor.endpoints[1], elevation: 9 },
        ],
      })
    ).toEqual([1, 0]);
  });

  it("drains a conserved whole liquid mixture through an open trapdoor", () => {
    const state = createScenarioGame("flash_point");
    state.rooms.reservoir.liquid.water = 22;
    state.rooms.reservoir.liquid.sodium_chloride = 5;
    const before = liquidLedger(state);

    simulateArchitecturalLiquid(state, 1);

    expect(state.rooms.gallery.liquid.water).toBeGreaterThan(0);
    expect(state.rooms.gallery.liquid.sodium_chloride).toBeGreaterThan(0);
    expect(state.portalStates.reservoir_to_gallery_trapdoor!.lastLiquidFlow).toBeGreaterThan(0);
    const after = liquidLedger(state);
    for (const species of LIQUID_TYPES) expect(after[species]!).toBeCloseTo(before[species]!, 8);
  });

  it("blocks trapdoor drainage when closed", () => {
    const state = createScenarioGame("flash_point");
    state.rooms.reservoir.liquid.water = 22;
    state.portalStates.reservoir_to_gallery_trapdoor!.open = false;

    simulateArchitecturalLiquid(state, 1);

    expect(state.rooms.gallery.liquid.water).toBe(0);
    expect(state.portalStates.reservoir_to_gallery_trapdoor!.lastLiquidFlow).toBe(0);
  });

  it("requires a side-passage liquid surface to rise above its sill", () => {
    const belowSill = createScenarioGame("flash_point");
    belowSill.rooms.furnace.liquid.water = 20;
    simulateArchitecturalLiquid(belowSill, 1);
    expect(belowSill.rooms.reservoir.liquid.water).toBe(0);

    const aboveSill = createScenarioGame("flash_point");
    aboveSill.rooms.furnace.liquid.water = 190;
    simulateArchitecturalLiquid(aboveSill, 1);
    expect(aboveSill.rooms.reservoir.liquid.water).toBeGreaterThan(0);
  });
});
