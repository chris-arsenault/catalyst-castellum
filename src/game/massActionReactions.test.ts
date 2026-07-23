import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_GAME_DEFINITION } from "./definition";
import { simulateMassActionNetwork } from "./engine/massActionReactions";
import { simulateEquipmentOperations } from "./engine/equipmentOperations";
import { createEquipmentInstance } from "./engine/equipment";
import { createScenarioGame } from "./simulation";
import { GAS_TYPES, type GameState, type RoomState } from "./types";
import { roomState } from "./world/instances";

let state: GameState;
let room: RoomState;

const clearRoom = (target: RoomState): void => {
  for (const zone of ["lower", "upper"] as const) {
    for (const species of GAS_TYPES) target.gas[zone][species] = 0;
    target.gasTemperature[zone] = 120;
  }
  for (const species of Object.keys(target.liquid) as Array<keyof typeof target.liquid>)
    target.liquid[species] = 0;
  for (const species of Object.keys(target.stationary) as Array<keyof typeof target.stationary>)
    target.stationary[species] = 0;
  target.temperature = 120;
};

beforeEach(() => {
  state = createScenarioGame("flash_point");
  room = roomState(state, "furnace");
  clearRoom(room);
});

describe("advanced electrolysis", () => {
  it("executes UF-3 through its authored recovery cell and leaves both gases in the host room", () => {
    const processState = createScenarioGame("flash_point");
    const processRoom = roomState(processState, "furnace");
    clearRoom(processRoom);
    processRoom.equipment.socket_a = createEquipmentInstance(
      { equipmentId: "fluorine_cell", level: 1, enabled: true },
      DEFAULT_GAME_DEFINITION
    );
    processRoom.gas.lower.hydrogen_fluoride = 4;

    simulateEquipmentOperations(processState, 1, DEFAULT_GAME_DEFINITION);

    expect(processRoom.gas.lower.hydrogen_fluoride).toBeCloseTo(3.4, 8);
    expect(processRoom.gas.lower.hydrogen).toBeCloseTo(0.3, 8);
    expect(processRoom.gas.lower.fluorine).toBeCloseTo(0.3, 8);
    expect(processRoom.equipment.socket_a.operation?.totalProcessed).toBeCloseTo(0.3, 8);
  });

  it("executes every installed powered machine with independent feed and telemetry", () => {
    const processState = createScenarioGame("flash_point");
    const furnace = roomState(processState, "furnace");
    const gallery = roomState(processState, "gallery");
    clearRoom(furnace);
    clearRoom(gallery);
    furnace.equipment.socket_a = createEquipmentInstance(
      { equipmentId: "fluorine_cell", level: 1, enabled: true },
      DEFAULT_GAME_DEFINITION
    );
    gallery.equipment.socket_a = createEquipmentInstance(
      { equipmentId: "fluorine_cell", level: 2, enabled: true },
      DEFAULT_GAME_DEFINITION
    );
    furnace.gas.lower.hydrogen_fluoride = 4;
    gallery.gas.lower.hydrogen_fluoride = 4;

    simulateEquipmentOperations(processState, 1, DEFAULT_GAME_DEFINITION);

    expect(furnace.equipment.socket_a.operation?.totalProcessed).toBeCloseTo(0.3, 8);
    expect(gallery.equipment.socket_a.operation?.totalProcessed).toBeCloseTo(0.46, 8);
    expect(furnace.gas.lower.fluorine).toBeCloseTo(0.3, 8);
    expect(gallery.gas.lower.fluorine).toBeCloseTo(0.46, 8);
  });
});

const installVessel = (
  target: RoomState,
  socketId: "socket_a" | "socket_b",
  equipmentId: "packed_bed" | "catalytic_reactor",
  medium: NonNullable<RoomState["equipment"]["socket_a"]>["medium"],
  level: 1 | 2 | 3 = 3
): void => {
  const instance = createEquipmentInstance(
    { equipmentId, level, enabled: true },
    DEFAULT_GAME_DEFINITION
  );
  instance.medium = medium;
  target.equipment[socketId] = instance;
};

describe("vessel-hosted mass-action chemistry", () => {
  it("executes a finite solid-bed reaction and conserves its authored products", () => {
    installVessel(room, "socket_a", "packed_bed", "solid_carbon");
    room.stationary.solid_carbon = 5;
    room.gas.lower.steam = 5;

    simulateEquipmentOperations(state, 1, DEFAULT_GAME_DEFINITION);

    expect(room.equipment.socket_a?.operation?.totalProcessed).toBeGreaterThan(0);
    expect(room.stationary.solid_carbon).toBeLessThan(5);
    expect(room.gas.lower.steam).toBeLessThan(5);
    expect(room.gas.lower.carbon_monoxide).toBeCloseTo(room.gas.lower.hydrogen, 8);
    expect(room.reactions.water_gas_reaction.direction).toBe("forward");
  });

  it("runs a reversible duty backward from its product inventory", () => {
    installVessel(room, "socket_a", "catalytic_reactor", "iron_catalyst");
    room.gasTemperature.lower = 180;
    room.gas.lower.carbon_dioxide = 5;
    room.gas.lower.hydrogen = 5;

    simulateEquipmentOperations(state, 1, DEFAULT_GAME_DEFINITION);

    expect(room.gas.lower.carbon_monoxide).toBeGreaterThan(0);
    expect(room.gas.lower.steam).toBeGreaterThan(0);
    expect(room.reactions.water_gas_shift.direction).toBe("reverse");
  });

  it("consumes a shared hydrogen inventory across competing beds without going negative", () => {
    installVessel(room, "socket_a", "packed_bed", "hematite");
    installVessel(room, "socket_b", "packed_bed", "nickel_oxide");
    room.stationary.hematite = 20;
    room.stationary.nickel_oxide = 8;
    room.gas.lower.hydrogen = 0.08;

    simulateEquipmentOperations(state, 10, DEFAULT_GAME_DEFINITION);

    expect(room.gas.lower.hydrogen).toBeGreaterThanOrEqual(-1e-10);
    expect(room.stationary.magnetite).toBeGreaterThan(0);
    expect(room.stationary.surface_nickel).toBeGreaterThanOrEqual(0);
  });

  it("treats the loaded catalyst charge as a rate enabler while preserving it", () => {
    installVessel(room, "socket_a", "catalytic_reactor", "surface_nickel");
    room.stationary.surface_nickel = 2;
    room.gas.lower.carbon_monoxide = 8;
    room.gas.lower.hydrogen = 24;
    const catalystBefore = room.stationary.surface_nickel;

    simulateEquipmentOperations(state, 1, DEFAULT_GAME_DEFINITION);

    expect(room.gas.lower.methane).toBeGreaterThan(0);
    expect(room.stationary.surface_nickel).toBeCloseTo(catalystBefore, 8);
    expect(room.reactions.nickel_catalyzed_methanation.direction).toBe("forward");
  });
});

describe("authored kinetics response", () => {
  it("applies authored second-order concentration response", () => {
    const productionAt = (nitricOxide: number): number => {
      clearRoom(room);
      room.temperature = 15;
      room.gasTemperature.lower = 15;
      room.gas.lower.nitric_oxide = nitricOxide;
      room.gas.lower.oxygen = 10;
      simulateMassActionNetwork(room, 1, DEFAULT_GAME_DEFINITION);
      return room.gas.lower.nitrogen_dioxide;
    };

    const low = productionAt(0.5);
    const high = productionAt(1);

    expect(low).toBeGreaterThan(0);
    expect(high).toBeGreaterThan(low * 2);
  });

  it("makes water inventory suppress dry uranyl-fluoride recovery", () => {
    const run = (water: number): number => {
      clearRoom(room);
      installVessel(room, "socket_a", "packed_bed", "uranyl_fluoride");
      room.temperature = 145;
      room.gasTemperature.lower = 145;
      room.stationary.uranyl_fluoride = 4;
      room.gas.lower.fluorine = 8;
      room.liquid.water = water;
      simulateEquipmentOperations(state, 1, DEFAULT_GAME_DEFINITION);
      return room.gas.lower.uranium_hexafluoride;
    };

    const dryProduction = run(0);
    const wetProduction = run(4);

    expect(dryProduction).toBeGreaterThan(0);
    expect(wetProduction).toBeLessThan(dryProduction * 0.1);
  });
});
