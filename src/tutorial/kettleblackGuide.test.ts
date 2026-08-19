import { describe, expect, it } from "vitest";
import { createScenarioGame, executeCommand } from "../game/simulation";
import type { GameCommand, GameState } from "../game/types";
import { guideDefinitionFor, guidedPhaseActionReason } from "./guideModel";

const command = (source: GameState, value: GameCommand): GameState => {
  const result = executeCommand(source, value);
  expect(result.accepted, result.code ?? undefined).toBe(true);
  return result.state;
};

describe("Kettleblack persistent-hull guidance", () => {
  it("opens the assault after one upgraded hull-mounted tower", () => {
    let game = command(createScenarioGame("kettleblack"), { type: "begin_level" });
    expect(guideDefinitionFor(game)?.id).toBe("kettleblack:persistent_hull:v2");
    expect(guidedPhaseActionReason(game, "start_assault", [])).toBe(
      "tutorial.kettleblack.reason.feed"
    );

    game = command(game, {
      type: "place_tower",
      chassisId: "flash_chamber",
      anchor: { column: 102, elevation: 8 },
      mountFace: "left_wall",
      orientation: "right",
    });
    expect(Object.values(game.towers)[0]?.provenance).toBe("hull");
    expect(guidedPhaseActionReason(game, "start_assault", [])).toBe(
      "tutorial.kettleblack.reason.coil"
    );

    game = command(game, {
      type: "upgrade_tower",
      towerId: "tower:kettleblack:1",
      upgradeId: "flash_calibration",
    });
    expect(guidedPhaseActionReason(game, "start_assault", [])).toBeNull();
  });

  it("registers no guided lesson after Kettleblack", () => {
    for (const levelId of ["cordon_41", "junction_l6", "pell_cut"] as const) {
      expect(guideDefinitionFor(createScenarioGame(levelId))).toBeNull();
    }
  });
});
