import { describe, expect, it } from "vitest";
import { portalDefinition, WORLD_MAP } from "./config";
const ROOM_ORDER = Object.keys(WORLD_MAP.rooms);
import {
  simulateArchitecturalGas,
  simulateArchitecturalLiquid,
  verticalPortalOrder,
  createScenarioGame,
} from "./simulation";
import { GAS_TYPES, LIQUID_TYPES, type GameState } from "./types";
import { roomState } from "./world/instances";

const gasLedger = (state: GameState) =>
  Object.fromEntries(
    GAS_TYPES.map((species) => [
      species,
      ROOM_ORDER.reduce(
        (total, roomId) =>
          total +
          roomState(state.encounter, roomId).gas.lower[species] +
          roomState(state.encounter, roomId).gas.upper[species],
        0
      ),
    ])
  );

const liquidLedger = (state: GameState) =>
  Object.fromEntries(
    LIQUID_TYPES.map((species) => [
      species,
      ROOM_ORDER.reduce(
        (total, roomId) => total + roomState(state.encounter, roomId).liquid[species],
        0
      ),
    ])
  );

const gasThermalLedger = (state: GameState): number =>
  ROOM_ORDER.reduce((facilityTotal, roomId) => {
    const room = roomState(state.encounter, roomId);
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
    const state = createScenarioGame("claim_8_delta");
    roomState(state.encounter, "switchyard").gas.upper.hydrogen += 18;
    roomState(state.encounter, "switchyard").gas.upper.oxygen += 9;
    roomState(state.encounter, "switchyard").gasTemperature.upper = 118;
    roomState(state.encounter, "furnace").gasTemperature.lower = 4;
    const before = gasLedger(state);
    const thermalBefore = gasThermalLedger(state);
    const destinationHydrogen = roomState(state.encounter, "furnace").gas.lower.hydrogen;

    simulateArchitecturalGas(state.encounter, 1);

    expect(roomState(state.encounter, "furnace").gas.lower.hydrogen).toBeGreaterThan(
      destinationHydrogen
    );
    expect(roomState(state.encounter, "furnace").gas.lower.oxygen).toBeGreaterThan(0);
    expect(roomState(state.encounter, "furnace").gasTemperature.lower).toBeGreaterThan(4);
    expect(state.encounter.portalStates.switchyard_to_furnace_shaft!.lastGasFlow).toBeGreaterThan(
      0
    );
    const after = gasLedger(state);
    for (const species of GAS_TYPES) expect(after[species]!).toBeCloseTo(before[species]!, 8);
    expect(gasThermalLedger(state)).toBeCloseTo(thermalBefore, 6);
  });

  it("transfers nothing through the same shaft when its seal is active", () => {
    const state = createScenarioGame("claim_8_delta");
    roomState(state.encounter, "switchyard").gas.upper.hydrogen += 18;
    state.encounter.portalStates.switchyard_to_furnace_shaft!.sealed = true;
    const before = roomState(state.encounter, "furnace").gas.lower.hydrogen;

    simulateArchitecturalGas(state.encounter, 1);

    expect(roomState(state.encounter, "furnace").gas.lower.hydrogen).toBe(before);
    expect(state.encounter.portalStates.switchyard_to_furnace_shaft!.lastGasFlow).toBe(0);
  });

  it("never exchanges atmosphere through the closed, sealed Core boundary", () => {
    const state = createScenarioGame("claim_8_delta");
    roomState(state.encounter, "washlock").gas.lower.hydrogen += 30;
    const coreHydrogenBefore =
      roomState(state.encounter, "core").gas.lower.hydrogen +
      roomState(state.encounter, "core").gas.upper.hydrogen;

    simulateArchitecturalGas(state.encounter, 2);

    expect(
      roomState(state.encounter, "core").gas.lower.hydrogen +
        roomState(state.encounter, "core").gas.upper.hydrogen
    ).toBe(coreHydrogenBefore);
    expect(state.encounter.portalStates.washlock_to_core_door).toMatchObject({
      open: false,
      sealed: true,
      lastGasFlow: 0,
    });
  });
});

describe("architectural liquid exchange", () => {
  it("derives gravity direction from portal endpoints even when room centers imply the opposite", () => {
    const trapdoor = portalDefinition("reservoir_to_gallery_trapdoor");
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
    const state = createScenarioGame("claim_8_delta");
    roomState(state.encounter, "reservoir").liquid.water = 22;
    roomState(state.encounter, "reservoir").liquid.sodium_chloride = 5;
    const before = liquidLedger(state);

    simulateArchitecturalLiquid(state.encounter, 1);

    expect(roomState(state.encounter, "gallery").liquid.water).toBeGreaterThan(0);
    expect(roomState(state.encounter, "gallery").liquid.sodium_chloride).toBeGreaterThan(0);
    expect(
      state.encounter.portalStates.reservoir_to_gallery_trapdoor!.lastLiquidFlow
    ).toBeGreaterThan(0);
    const after = liquidLedger(state);
    for (const species of LIQUID_TYPES) expect(after[species]!).toBeCloseTo(before[species]!, 8);
  });

  it("blocks trapdoor drainage when closed", () => {
    const state = createScenarioGame("claim_8_delta");
    roomState(state.encounter, "reservoir").liquid.water = 22;
    state.encounter.portalStates.reservoir_to_gallery_trapdoor!.open = false;

    simulateArchitecturalLiquid(state.encounter, 1);

    expect(roomState(state.encounter, "gallery").liquid.water).toBe(0);
    expect(state.encounter.portalStates.reservoir_to_gallery_trapdoor!.lastLiquidFlow).toBe(0);
  });

  it("requires a side-passage liquid surface to rise above its sill", () => {
    const belowSill = createScenarioGame("claim_8_delta");
    roomState(belowSill.encounter, "furnace").liquid.water = 20;
    simulateArchitecturalLiquid(belowSill.encounter, 1);
    expect(roomState(belowSill.encounter, "reservoir").liquid.water).toBe(0);

    const aboveSill = createScenarioGame("claim_8_delta");
    roomState(aboveSill.encounter, "furnace").liquid.water = 190;
    simulateArchitecturalLiquid(aboveSill.encounter, 1);
    expect(roomState(aboveSill.encounter, "reservoir").liquid.water).toBeGreaterThan(0);
  });
});
