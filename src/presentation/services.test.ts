import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_DEFINITION, deriveGame } from "../game/definition";
import { createGameRuntime } from "../game/runtime";
import { TEST_LOCALE } from "../localization/locales/test";
import { createGamePresentation } from "./services";

describe("bound game presentation", () => {
  it("binds an alternate definition and complete locale without component changes", () => {
    const definition = deriveGame(DEFAULT_GAME_DEFINITION, {
      id: "presentation-fixture",
      packId: "presentation-fixture",
      contentVersion: 2,
      rooms: {
        ...DEFAULT_GAME_DEFINITION.rooms,
        furnace: { ...DEFAULT_GAME_DEFINITION.rooms.furnace, ambientTemperature: 51 },
      },
    });
    const runtime = createGameRuntime(definition);
    const presentation = createGamePresentation(runtime, TEST_LOCALE);
    const game = runtime.createScenario("flash_point");

    expect(presentation.levelCopy.level(runtime.level(game)).name).toBe("⟦Flash Point⟧");
    expect(game.rooms.furnace.temperature).toBe(51);
    expect(presentation.selectors.roomAnalysis(game.rooms.furnace).hazardLabel).toBeDefined();
    expect(presentation.commandCopy(runtime.execute(game, { type: "start_prime" }))).toBe(
      "⟦The current phase keeps this action locked.⟧"
    );
  });
});
