import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_DEFINITION, deriveGame } from "./definition";
import { executeCommand } from "./engine/commands";
import { createScenarioGame } from "./engine/scenarioState";
import { stepGame } from "./engine/step";
import { roomState } from "./world/instances";

describe("explicit game definitions", () => {
  it("runs two independently scoped definitions in one process", () => {
    const alternate = deriveGame(DEFAULT_GAME_DEFINITION, {
      id: "alternate-test-facility",
      map: {
        ...DEFAULT_GAME_DEFINITION.map,
        width: 80,
        rooms: {
          ...DEFAULT_GAME_DEFINITION.map.rooms,
          furnace: {
            ...DEFAULT_GAME_DEFINITION.map.rooms.furnace!,
            ambientTemperature: 60,
          },
        },
      },
    });

    const original = createScenarioGame("claim_8_delta", [], DEFAULT_GAME_DEFINITION);
    const variant = createScenarioGame("claim_8_delta", [], alternate);
    expect(roomState(original, "furnace").temperature).toBe(22);
    expect(roomState(variant, "furnace").temperature).toBe(60);
    expect(DEFAULT_GAME_DEFINITION.map.width).toBe(76);
    expect(alternate.map.width).toBe(80);

    const variantBuild = executeCommand(variant, { type: "begin_level" }, alternate).state;
    const variantAssault = executeCommand(variantBuild, { type: "start_assault" }, alternate).state;
    expect(roomState(stepGame(variantAssault, 0.1, alternate), "furnace").temperature).not.toBe(
      roomState(stepGame(original, 0.1, DEFAULT_GAME_DEFINITION), "furnace").temperature
    );
  });
});
