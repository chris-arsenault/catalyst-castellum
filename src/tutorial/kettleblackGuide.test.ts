import { describe, expect, it } from "vitest";
import { createScenarioGame, executeCommand, stepGame } from "../game/simulation";
import type { GameCommand, GameState } from "../game/types";
import { roomState } from "../game/world/instances";
import { guideDefinitionFor, guidedPhaseActionReason } from "./guideModel";

const command = (source: GameState, value: GameCommand): GameState => {
  const result = executeCommand(source, value);
  expect(result.accepted, result.code ?? undefined).toBe(true);
  return result.state;
};

describe("Kettleblack stationary-media guidance", () => {
  it("ends guided process instruction after a real reverse reaction during Prime", () => {
    let game = command(createScenarioGame("kettleblack"), { type: "begin_level" });
    expect(guideDefinitionFor(game)?.id).toBe("kettleblack:grain_markers:v1");
    expect(guidedPhaseActionReason(game, "start_prime", [])).toBe(
      "tutorial.kettleblack.reason.feed"
    );

    game = command(game, {
      type: "build_connection",
      kind: "gas_line",
      fromRoomId: "core",
      toRoomId: "furnace",
    });
    game = command(game, {
      type: "set_conduit",
      connectionId: "gas:core__furnace",
      enabled: true,
    });
    game = command(game, {
      type: "install_equipment",
      roomId: "furnace",
      socketId: "socket_a",
      equipmentId: "thermal_coil",
    });
    game = command(game, {
      type: "install_equipment",
      roomId: "furnace",
      socketId: "socket_b",
      equipmentId: "packed_bed",
    });
    game = command(game, {
      type: "load_vessel_medium",
      roomId: "furnace",
      socketId: "socket_b",
      medium: "solid_carbon",
    });
    expect(guidedPhaseActionReason(game, "start_prime", [])).toBeNull();

    game = command(game, { type: "start_prime" });
    for (
      let index = 0;
      index < 720 && guidedPhaseActionReason(game, "start_assault", []);
      index += 1
    ) {
      game = stepGame(game, 0.1);
    }

    expect(roomState(game, "furnace").reactions.water_gas_reaction).toMatchObject({
      direction: "reverse",
    });
    expect(roomState(game, "furnace").reactions.water_gas_reaction.lastRate).toBeGreaterThan(0.001);
    expect(guidedPhaseActionReason(game, "start_assault", [])).toBeNull();
  }, 30_000);

  it("registers no guided process lesson after Kettleblack", () => {
    for (const levelId of ["cordon_41", "junction_l6", "pell_cut"] as const) {
      expect(guideDefinitionFor(createScenarioGame(levelId))).toBeNull();
    }
  });
});
