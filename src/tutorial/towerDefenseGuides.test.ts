import { describe, expect, it } from "vitest";
import { createScenarioGame, executeCommand } from "../game/simulation";
import type { GameCommand, GameState } from "../game/types";
import { guideDefinitionFor, guidedPhaseActionReason } from "./guideModel";

const command = (game: GameState, value: GameCommand): GameState => {
  const result = executeCommand(game, value);
  expect(result.accepted, result.code ?? undefined).toBe(true);
  return result.state;
};

describe("chemical defense guidance", () => {
  it("offers Twelve-Cask neutralization guidance without gating the assault", () => {
    let game = command(createScenarioGame("twelve_cask"), { type: "begin_level" });
    game.matter = 500;
    const guide = guideDefinitionFor(game);
    expect(guide?.id).toBe("twelve_cask:neutralization:v1");
    expect(guide?.gatesPhaseActions).toBe(false);
    expect(guidedPhaseActionReason(game, "start_assault", [])).toBeNull();

    game = command(game, {
      type: "place_tower",
      chassisId: "caustic_jet",
      anchor: { column: 6, elevation: 8 },
      mountFace: "left_wall",
      orientation: "right",
    });
    game = command(game, {
      type: "place_tower",
      chassisId: "acid_pot",
      anchor: { column: 10, elevation: 13 },
      mountFace: "floor",
      orientation: "right",
    });

    expect(guide?.mission.tasks.map((task) => task.completed(game))).toEqual([
      true,
      true,
      false,
      false,
    ]);
    game.stats.damageBySource.tower_neutralization = 18;
    expect(guide?.mission.tasks[2]?.completed(game)).toBe(true);
  });
});
