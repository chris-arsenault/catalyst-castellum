import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_DEFINITION, deriveGame } from "../game/definition";
import { DEFAULT_GAME_RUNTIME, createGameRuntime } from "../game/runtime";
import { DEFAULT_GAME_PRESENTATION, createGamePresentation } from "./services";
import { EN_LOCALE } from "../localization/locales/en";

// eslint-disable-next-line max-lines-per-function -- The suite verifies the complete forecast projection contract.
describe("wave forecast presentation", () => {
  it("groups enemy composition and resolves authored level offsets", () => {
    const game = DEFAULT_GAME_RUNTIME.createScenario("claim_8_delta");
    const forecast = DEFAULT_GAME_PRESENTATION.waveForecast(game);

    expect(forecast.total).toBe(5);
    expect(forecast.cadence).toBe("steady");
    expect(forecast.cohortCount).toBe(1);
    expect(forecast.firstArrivalSeconds).toBe(0.5);
    expect(forecast.durationSeconds).toBeCloseTo(15.2);
    expect(forecast.approachLabel).toBe("West Breach → Catalyst Core");
    expect(forecast.composition).toMatchObject([
      {
        type: "deckmouth",
        count: 5,
        minimumLevel: 12,
        maximumLevel: 12,
        countLabel: "5 × Deckmouth",
        levelLabel: "Level 12",
      },
    ]);
  });

  it("reports the full mechanical trait mix in a late defense wave", () => {
    const game = DEFAULT_GAME_RUNTIME.createScenario("morrow_pocket");
    game.campaign.roundIndex = 4;
    const forecast = DEFAULT_GAME_PRESENTATION.waveForecast(game);

    expect(forecast.total).toBe(24);
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
    const level = DEFAULT_GAME_DEFINITION.levels.harkers_brace;
    const definition = deriveGame(DEFAULT_GAME_DEFINITION, {
      id: "delayed-wave-fixture",
      levels: {
        ...DEFAULT_GAME_DEFINITION.levels,
        harkers_brace: {
          ...level,
          rounds: level.rounds.map((round, index) =>
            index === 0
              ? { ...round, wave: round.wave.map((entry) => ({ ...entry, at: entry.at + 10 })) }
              : round
          ),
        },
      },
    });
    const runtime = createGameRuntime(definition);
    const forecast = createGamePresentation(runtime, EN_LOCALE).waveForecast(
      runtime.createScenario("harkers_brace")
    );

    expect(forecast.firstArrivalSeconds).toBe(10.5);
    expect(forecast.arrivalLabel).toBe("Contact begins after a deliberate delay.");
  });
});

describe("authored wave formations", () => {
  it("separates arrivals when their authored timing leaves a meaningful gap", () => {
    const flashPoint = DEFAULT_GAME_DEFINITION.levels.claim_8_delta;
    const firstRound = flashPoint.rounds[0]!;
    const definition = deriveGame(DEFAULT_GAME_DEFINITION, {
      id: "wave-forecast-fixture",
      packId: "wave-forecast-fixture",
      levels: {
        ...DEFAULT_GAME_DEFINITION.levels,
        claim_8_delta: {
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
    const forecast = presentation.waveForecast(runtime.createScenario("claim_8_delta"));

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
