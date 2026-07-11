import { describe, expect, it } from "vitest";
import { WAVES } from "./config";
import {
  analyzeRoom,
  createInitialGame,
  executeCommand,
  gasPercent,
  previewDevice,
  roomPressure,
  stepGame,
} from "./simulation";
import type { DeviceKey, GameState, RoomId } from "./types";

const prime = (state = createInitialGame()): GameState => {
  const result = executeCommand(state, { type: "start_prime" });
  expect(result.accepted).toBe(true);
  return result.state;
};

const activate = (state: GameState, roomId: RoomId, device: DeviceKey): GameState => {
  const result = executeCommand(state, { type: "activate_device", roomId, device });
  expect(result.accepted, result.reason).toBe(true);
  return result.state;
};

describe("room commands", () => {
  it("injects toxic gas by displacing the unsealed atmosphere", () => {
    const state = prime();
    const before = state.rooms.switchyard;
    const result = activate(state, "switchyard", "gas_toxic");
    const after = result.rooms.switchyard;

    expect(gasPercent(after, "toxic_gas")).toBeGreaterThan(0.35);
    expect(gasPercent(after, "oxygen")).toBeLessThan(gasPercent(before, "oxygen"));
    expect(roomPressure(after)).toBeCloseTo(101, 0);
  });

  it("raises pressure when a chamber is sealed before injection", () => {
    let state = prime();
    state = activate(state, "switchyard", "door");
    state = activate(state, "switchyard", "gas_toxic");

    expect(state.rooms.switchyard.sealTimer).toBe(10);
    expect(roomPressure(state.rooms.switchyard)).toBeGreaterThan(130);
  });

  it("uses the real command path for previews without mutating the source", () => {
    const state = prime();
    const before = JSON.stringify(state);
    const preview = previewDevice(state, "switchyard", "gas_toxic");

    expect(preview.accepted).toBe(true);
    expect(preview.changes.some((change) => change.startsWith("Toxic"))).toBe(true);
    expect(JSON.stringify(state)).toBe(before);
  });

  it("burns a viable fuel mixture into heat and CO2", () => {
    let state = prime();
    state = activate(state, "furnace", "gas_fuel");
    const fuelBefore = state.rooms.furnace.gas.fuel_gas;
    state = activate(state, "furnace", "igniter");

    expect(state.rooms.furnace.gas.fuel_gas).toBeLessThan(fuelBefore);
    expect(state.rooms.furnace.temperature).toBeGreaterThan(80);
    expect(state.rooms.furnace.flashTimer).toBeGreaterThan(1);
    expect(state.events[0]?.title).toBe("Combustion front");
  });

  it("reports CO2-suppressed ignition instead of inventing a flame", () => {
    let state = prime();
    const room = state.rooms.furnace;
    room.gas = { oxygen: 20, co2: 70, toxic_gas: 0, fuel_gas: 10, steam: 0 };
    const temperature = room.temperature;
    state = activate(state, "furnace", "igniter");

    expect(state.rooms.furnace.temperature).toBe(temperature);
    expect(state.rooms.furnace.flashTimer).toBe(0);
    expect(state.events[0]?.title).toBe("Ignition failed");
  });
});

describe("passive chemistry and enemy disruption", () => {
  it("neutralizes acid and caustic deterministically and produces heat", () => {
    let state = prime();
    state.rooms.reservoir.liquid.acid = 20;
    state.rooms.reservoir.liquid.caustic = 20;
    state = stepGame(state, 1);

    expect(state.rooms.reservoir.liquid.acid).toBeCloseTo(9, 4);
    expect(state.rooms.reservoir.liquid.caustic).toBeCloseTo(9, 4);
    expect(state.rooms.reservoir.liquid.neutral_liquid).toBeCloseTo(20.35, 4);
    expect(state.rooms.reservoir.temperature).toBeGreaterThan(34);
  });

  it("lets Bellows consume toxic gas and emit CO2 without damaging equipment", () => {
    let state = prime();
    state.phase = "assault";
    state.cycle = 1;
    state.phaseTime = 0;
    state.rooms.switchyard.gas = {
      oxygen: 45,
      co2: 10,
      toxic_gas: 45,
      fuel_gas: 0,
      steam: 0,
    };
    state.enemies = [
      {
        id: 999,
        type: "bellows",
        health: 128,
        maxHealth: 128,
        route: ["switchyard", "furnace", "gallery", "washlock", "core"],
        segment: 0,
        progress: 0,
        spawnAge: 0,
        damageTaken: 0,
        disrupted: false,
      },
    ];
    const installed = [...state.rooms.switchyard.devices];
    state = stepGame(state, 0.5);

    expect(state.rooms.switchyard.gas.toxic_gas).toBeLessThan(45);
    expect(state.rooms.switchyard.gas.co2).toBeGreaterThan(10);
    expect(state.rooms.switchyard.devices).toEqual(installed);
    expect(state.events.some((entry) => entry.title === "Bellows disrupting atmosphere")).toBe(
      true
    );
  });
});

describe("persistent cycle lifecycle", () => {
  it("carries room contents into the next build phase", () => {
    let state = prime();
    state.phase = "settle";
    state.phaseTime = 5.9;
    state.rooms.switchyard.gas = {
      oxygen: 46,
      co2: 12,
      toxic_gas: 42,
      fuel_gas: 0,
      steam: 0,
    };
    const buildPoints = state.buildPoints;
    state = stepGame(state, 0.2);

    expect(state.phase).toBe("build");
    expect(state.cycle).toBe(2);
    expect(state.rooms.switchyard.gas.toxic_gas).toBeGreaterThan(35);
    expect(state.buildPoints).toBe(buildPoints + 2);
  });

  it("enters settle as soon as the final wave has no survivors", () => {
    let state = prime();
    state.phase = "assault";
    state.spawnCursor = WAVES[1]?.length ?? 0;
    state.enemies = [];
    state = stepGame(state, 0.1);

    expect(state.phase).toBe("settle");
    expect(state.lastReport?.headline).toBe("Containment held");
  });

  it("rates a concentrated acid room as hostile", () => {
    const state = createInitialGame();
    state.rooms.reservoir.liquid.acid = 40;
    const analysis = analyzeRoom(state.rooms.reservoir);

    expect(analysis.hazard).toBeGreaterThan(25);
    expect(analysis.effects).toContain("Ground armor dissolving");
  });

  it("makes water tactically dilute an existing acid pool", () => {
    let state = prime();
    state.rooms.reservoir.liquid.acid = 34;
    const before = analyzeRoom(state.rooms.reservoir);
    state = activate(state, "reservoir", "liquid_water");
    const after = analyzeRoom(state.rooms.reservoir);

    expect(after.liquidTotal).toBeGreaterThan(before.liquidTotal);
    expect(after.hazard).toBeLessThan(before.hazard);
  });
});
