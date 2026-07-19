import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_DEFINITION, deriveGame } from "../game/definition";
import { DEFAULT_GAME_RUNTIME, createGameRuntime } from "../game/runtime";
import { DEFAULT_GAME_PRESENTATION, createGamePresentation } from "./services";
import { EN_LOCALE } from "../localization/locales/en";

describe("wave forecast presentation", () => {
  it("groups enemy composition and resolves authored level offsets", () => {
    const game = DEFAULT_GAME_RUNTIME.createScenario("flash_point");
    const forecast = DEFAULT_GAME_PRESENTATION.waveForecast(game);

    expect(forecast.total).toBe(10);
    expect(forecast.cadence).toBe("tight");
    expect(forecast.cohortCount).toBe(1);
    expect(forecast.firstArrivalSeconds).toBe(0.5);
    expect(forecast.durationSeconds).toBeCloseTo(19.8);
    expect(forecast.approachLabel).toBe("West Breach → Catalyst Core");
    expect(forecast.composition).toMatchObject([
      {
        type: "deckmouth",
        count: 10,
        minimumLevel: 20,
        maximumLevel: 20,
        countLabel: "10 × Deckmouth",
        levelLabel: "Level 20",
      },
    ]);
  });

  it("reports the full mechanical trait mix in a late defense wave", () => {
    const game = DEFAULT_GAME_RUNTIME.createScenario("morrow_pocket");
    game.campaign.roundIndex = 4;
    const forecast = DEFAULT_GAME_PRESENTATION.waveForecast(game);

    expect(forecast.total).toBe(20);
    expect(forecast.traits).toEqual([
      "flying",
      "armored",
      "climber",
      "shared_field",
      "reagent_emitter",
    ]);
    expect(forecast.traitLabels).toEqual([
      "Flying",
      "Molting armor",
      "Ladder runner",
      "Shared field",
      "Reagent emitter",
    ]);
  });

  it("builds a physical-route forecast for every authored round", () => {
    for (const levelId of DEFAULT_GAME_DEFINITION.levelOrder) {
      const game = DEFAULT_GAME_RUNTIME.createScenario(levelId);
      const rounds = DEFAULT_GAME_DEFINITION.levels[levelId].rounds;
      for (const [roundIndex, round] of rounds.entries()) {
        game.campaign.roundIndex = roundIndex;
        const forecast = DEFAULT_GAME_PRESENTATION.waveForecast(game);
        expect(forecast.total).toBe(round.wave.length);
        expect(forecast.entryRoomId).not.toBe(forecast.coreRoomId);
        expect(forecast.approachLabel).toContain("→");
      }
    }
  });

  it("presents delayed contact as a timing band while retaining the authored seconds", () => {
    const game = DEFAULT_GAME_RUNTIME.createScenario("make_the_reagent");
    const forecast = DEFAULT_GAME_PRESENTATION.waveForecast(game);

    expect(forecast.firstArrivalSeconds).toBe(10.5);
    expect(forecast.arrivalLabel).toBe("Contact begins after a deliberate delay.");
  });
});

describe("authored wave formations", () => {
  it("separates arrivals when their authored timing leaves a meaningful gap", () => {
    const flashPoint = DEFAULT_GAME_DEFINITION.levels.flash_point;
    const firstRound = flashPoint.rounds[0]!;
    const definition = deriveGame(DEFAULT_GAME_DEFINITION, {
      id: "wave-forecast-fixture",
      packId: "wave-forecast-fixture",
      levels: {
        ...DEFAULT_GAME_DEFINITION.levels,
        flash_point: {
          ...flashPoint,
          rounds: [
            {
              ...firstRound,
              wave: [
                { at: 0.5, type: "deckmouth", routeId: "entry_to_core", levelOffset: 0 },
                { at: 1.5, type: "deckmouth", routeId: "entry_to_core", levelOffset: 0 },
                { at: 8, type: "flintjack", routeId: "entry_to_core", levelOffset: 1 },
                { at: 9, type: "flintjack", routeId: "entry_to_core", levelOffset: 1 },
              ],
            },
            ...flashPoint.rounds.slice(1),
          ],
        },
      },
    });
    const runtime = createGameRuntime(definition);
    const presentation = createGamePresentation(runtime, EN_LOCALE);
    const forecast = presentation.waveForecast(runtime.createScenario("flash_point"));

    expect(forecast.cohortCount).toBe(2);
    expect(forecast.cadence).toBe("surge");
    expect(forecast.arrivalLabel).toBe("Contact begins as assault starts.");
    expect(forecast.timingLabel).toBe("2 formations enter with clear gaps.");
    expect(forecast.composition[1]).toMatchObject({
      type: "flintjack",
      minimumLevel: 21,
      maximumLevel: 21,
    });
  });
});
