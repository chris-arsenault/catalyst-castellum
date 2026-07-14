import { describe, expect, it } from "vitest";
import {
  createScenarioGame,
  executeCommand,
  hydrogenOxygenFlashStatus,
  simulateHydrogenOxygenFlash,
} from "./simulation";
import type { GameCommand, GameState } from "./types";
import { GAS_TYPES } from "./types";

const command = (source: GameState, value: GameCommand): GameState => {
  const result = executeCommand(source, value);
  expect(result.accepted, result.reason ?? undefined).toBe(true);
  return result.state;
};

describe("OX-1 ignition status", () => {
  it("uses the same complete per-layer gate as flash simulation", () => {
    let game = command(createScenarioGame("flash_point"), { type: "begin_level" });
    game = command(game, {
      type: "install_equipment",
      roomId: "furnace",
      socketId: "socket_a",
      equipmentId: "gas_agitator",
    });
    const room = game.rooms.furnace;
    for (const species of GAS_TYPES) room.gas.lower[species] = 0;
    Object.assign(room.gas.lower, { hydrogen: 2, nitrogen: 7, oxygen: 1 });

    const ready = hydrogenOxygenFlashStatus(room, "lower");
    expect(ready).toMatchObject({
      agitationReady: true,
      batchReady: true,
      cooldownReady: true,
      hydrogenReady: true,
      oxygenReady: true,
      ready: true,
      requiredExtent: 1,
    });

    const burst = simulateHydrogenOxygenFlash(game, room, "lower", 0.1);
    expect(burst).not.toBeNull();
    expect(room.flashCooldown.lower).toBeGreaterThan(0);
    expect(hydrogenOxygenFlashStatus(room, "lower").ready).toBe(false);
  });

  it("reports each unmet ignition condition independently", () => {
    const game = createScenarioGame("flash_point");
    const status = hydrogenOxygenFlashStatus(game.rooms.furnace, "upper");

    expect(status.agitationReady).toBe(false);
    expect(status.hydrogenReady).toBe(false);
    expect(status.batchReady).toBe(false);
    expect(status.oxygenReady).toBe(true);
    expect(status.ready).toBe(false);
  });
});
