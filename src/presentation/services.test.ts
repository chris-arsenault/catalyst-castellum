import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_DEFINITION, deriveGame } from "../game/definition";
import { createGameRuntime } from "../game/runtime";
import { TEST_LOCALE } from "../localization/locales/test";
import { createGamePresentation } from "./services";
import { roomState } from "../game/world/instances";

describe("bound game presentation", () => {
  it("binds an alternate definition and complete locale without component changes", () => {
    const level = DEFAULT_GAME_DEFINITION.levels.cordon_41;
    const site = level.site;
    if (!site) throw new Error("Cordon 41 is missing its fixed site.");
    const definition = deriveGame(DEFAULT_GAME_DEFINITION, {
      id: "presentation-fixture",
      packId: "presentation-fixture",
      contentVersion: 2,
      levels: {
        ...DEFAULT_GAME_DEFINITION.levels,
        cordon_41: {
          ...level,
          site: {
            ...site,
            map: {
              ...site.map,
              rooms: {
                ...site.map.rooms,
                furnace: { ...site.map.rooms.furnace!, ambientTemperature: 51 },
              },
            },
          },
        },
      },
    });
    const runtime = createGameRuntime(definition);
    const presentation = createGamePresentation(runtime, TEST_LOCALE);
    const game = runtime.createScenario("cordon_41");

    expect(presentation.levelCopy.level(runtime.level(game)).name).toBe("⟦Cordon 41⟧");
    expect(roomState(game, "furnace").temperature).toBe(51);
    expect(
      presentation.selectors.roomAnalysis(roomState(game, "furnace")).hazardLabel
    ).toBeDefined();
    expect(presentation.waveForecast(game).composition[0]?.name).toBe("⟦Deckmouth⟧");
    expect(presentation.supplies(game)[0]?.name).toBe("⟦Gas reservoir⟧");
    expect(presentation.commandCopy(runtime.execute(game, { type: "start_assault" }))).toBe(
      "⟦The current phase keeps this action locked.⟧"
    );
  });
});
