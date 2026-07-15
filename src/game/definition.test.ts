import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_DEFINITION, deriveGame } from "./definition";
import { executeCommand } from "./engine/commands";
import { createScenarioGame } from "./engine/scenarioState";
import { stepGame } from "./engine/step";
import { definitionRoom, roomState } from "./world/instances";

describe("explicit game definitions", () => {
  it("runs two independently scoped definitions in one process", () => {
    const alternate = deriveGame(DEFAULT_GAME_DEFINITION, {
      id: "alternate-test-facility",
      facilityMap: { ...DEFAULT_GAME_DEFINITION.facilityMap, width: 80 },
      rooms: {
        ...DEFAULT_GAME_DEFINITION.rooms,
        furnace: {
          ...definitionRoom(DEFAULT_GAME_DEFINITION, "furnace"),
          ambientTemperature: 60,
        },
      },
    });

    const original = createScenarioGame("flash_point", [], DEFAULT_GAME_DEFINITION);
    const variant = createScenarioGame("flash_point", [], alternate);
    expect(roomState(original, "furnace").temperature).toBe(22);
    expect(roomState(variant, "furnace").temperature).toBe(60);
    expect(DEFAULT_GAME_DEFINITION.facility.map.width).toBe(76);
    expect(alternate.facility.map.width).toBe(80);

    const variantBuild = executeCommand(variant, { type: "begin_level" }, alternate).state;
    const variantPrime = executeCommand(variantBuild, { type: "start_prime" }, alternate).state;
    expect(roomState(stepGame(variantPrime, 0.1, alternate), "furnace").temperature).not.toBe(
      roomState(stepGame(original, 0.1, DEFAULT_GAME_DEFINITION), "furnace").temperature
    );
  });
});
