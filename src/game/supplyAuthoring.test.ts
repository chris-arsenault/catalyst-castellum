import { describe, expect, it } from "vitest";
import { createGamePresentation } from "../presentation/services";
import { EN_LOCALE } from "../localization/locales/en";
import { DEFAULT_GAME_DEFINITION, deriveGame } from "./definition";
import { createGameRuntime } from "./runtime";
import { cell } from "./spatial";

const withNitrogenOffer = () => {
  const core = DEFAULT_GAME_DEFINITION.map.rooms.core!;
  const flashPoint = DEFAULT_GAME_DEFINITION.levels.flash_point;
  return deriveGame(DEFAULT_GAME_DEFINITION, {
    id: "site-supply-fixture",
    map: {
      ...DEFAULT_GAME_DEFINITION.map,
      rooms: {
        ...DEFAULT_GAME_DEFINITION.map.rooms,
        core: {
          ...core,
          taps: {
            ...core.taps,
            gas: {
              ...core.taps.gas,
              sourceIds: [...core.taps.gas.sourceIds, "nitrogen_reservoir"],
            },
          },
        },
      },
      utilityNodes: {
        ...DEFAULT_GAME_DEFINITION.map.utilityNodes,
        nitrogen_reservoir: { cell: cell(60, 16), hostRoomId: "core" },
      },
    },
    levels: {
      ...DEFAULT_GAME_DEFINITION.levels,
      flash_point: {
        ...flashPoint,
        supplies: [
          ...flashPoint.supplies,
          {
            id: "nitrogen_reservoir",
            code: "N-1",
            phase: "gas",
            capacity: 100,
            initial: {},
            availableFromRound: "stored_momentum",
            replenishment: { kind: "matter", contents: { nitrogen: 25 }, cost: 6 },
            accent: "#7db7c7",
          },
        ],
      },
    },
  });
};

describe("site-authored supply economy", () => {
  it("adds a new feedstock and unlock round without reaction or engine changes", () => {
    const definition = withNitrogenOffer();
    const runtime = createGameRuntime(definition);
    const presentation = createGamePresentation(runtime, EN_LOCALE);
    const game = runtime.execute(runtime.createScenario("flash_point"), {
      type: "begin_level",
    }).state;

    expect(runtime.queries.supplyAvailable(game, "nitrogen_reservoir")).toBe(false);
    expect(game.gasSources.nitrogen_reservoir?.gas.nitrogen).toBe(0);
    game.campaign.roundIndex = 1;
    expect(runtime.queries.supplyAvailable(game, "nitrogen_reservoir")).toBe(true);
    expect(presentation.supplies(game).find(({ id }) => id === "nitrogen_reservoir")).toMatchObject(
      {
        name: "N-1 gas reservoir",
        formula: "N₂",
        chargeAmount: 25,
        chargeCost: 6,
        available: true,
      }
    );

    const charged = runtime.execute(game, {
      type: "charge_gas_source",
      sourceId: "nitrogen_reservoir",
    });
    expect(charged.accepted).toBe(true);
    expect(charged.state.gasSources.nitrogen_reservoir?.gas.nitrogen).toBe(25);
    expect(charged.state.matter).toBe(game.matter - 6);
    expect(definition.reactions).toBe(DEFAULT_GAME_DEFINITION.reactions);
  });
});

describe("site supply validation", () => {
  it("rejects a supply packet containing the wrong material phase", () => {
    const level = DEFAULT_GAME_DEFINITION.levels.flash_point;
    const gas = level.supplies[0]!;
    expect(() =>
      deriveGame(DEFAULT_GAME_DEFINITION, {
        levels: {
          ...DEFAULT_GAME_DEFINITION.levels,
          flash_point: {
            ...level,
            supplies: [{ ...gas, initial: { water: 1 } } as never],
          },
        },
      })
    ).toThrow(/water is not a gas species/);
  });

  it("rejects a supply without a physical reservoir connection", () => {
    const level = DEFAULT_GAME_DEFINITION.levels.flash_point;
    expect(() =>
      deriveGame(DEFAULT_GAME_DEFINITION, {
        levels: {
          ...DEFAULT_GAME_DEFINITION.levels,
          flash_point: {
            ...level,
            supplies: [
              ...level.supplies,
              {
                id: "detached_feed",
                code: "D-1",
                phase: "gas",
                capacity: 20,
                initial: {},
                availableFromRound: "first_spark",
                replenishment: { kind: "matter", contents: { nitrogen: 10 }, cost: 2 },
                accent: "#778899",
              },
            ],
          },
        },
      })
    ).toThrow(/has no physical utility node/);
  });

  it("rejects a reservoir drawn outside its declared host room", () => {
    const definition = withNitrogenOffer();
    expect(() =>
      deriveGame(definition, {
        map: {
          ...definition.map,
          utilityNodes: {
            ...definition.map.utilityNodes,
            nitrogen_reservoir: { cell: cell(0, 0), hostRoomId: "core" },
          },
        },
      })
    ).toThrow(/Utility node cell is outside its host room/);
  });
});

describe("site supply availability and economy validation", () => {
  it("rejects unknown availability rounds and invalid Matter prices", () => {
    const level = DEFAULT_GAME_DEFINITION.levels.morrow_pocket;
    const gas = level.supplies[0]!;
    if (gas.phase !== "gas") throw new Error("Morrow Pocket gas supply fixture changed phase.");
    expect(() =>
      deriveGame(DEFAULT_GAME_DEFINITION, {
        levels: {
          ...DEFAULT_GAME_DEFINITION.levels,
          morrow_pocket: {
            ...level,
            supplies: [{ ...gas, availableFromRound: "missing_round" }, ...level.supplies.slice(1)],
          },
        },
      })
    ).toThrow(/Unknown round missing_round/);
    expect(() =>
      deriveGame(DEFAULT_GAME_DEFINITION, {
        levels: {
          ...DEFAULT_GAME_DEFINITION.levels,
          morrow_pocket: {
            ...level,
            supplies: [
              {
                ...gas,
                replenishment: { ...gas.replenishment, kind: "matter", cost: -1 },
              },
              ...level.supplies.slice(1),
            ],
          },
        },
      })
    ).toThrow(/Matter cost must be a nonnegative integer/);
  });
});
