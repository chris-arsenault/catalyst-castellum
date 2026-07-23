import { describe, expect, it } from "vitest";
import { LEVEL_DEFINITIONS } from "./config";
import { narrativeSiteForLevel } from "./content/narrativeCampaign";
import { ACT_THREE_REFERENCE_BUILDS } from "./content/playtestPortfolios/actThree";
import { createScenarioGame } from "./simulation";
import { LEVEL_IDS } from "./types";
import { processLineIds } from "./world/instances";

const ACT_THREE_LEVEL_IDS = ["station_14", "vasker_store", "lane_six", "pell_cordon"] as const;

describe("Act III mechanical sites", () => {
  it("binds the complete final act at its authored enemy levels", () => {
    expect(LEVEL_IDS.slice(8)).toEqual(ACT_THREE_LEVEL_IDS);
    for (const levelId of ACT_THREE_LEVEL_IDS) {
      expect(narrativeSiteForLevel(levelId).levelId).toBe(levelId);
      expect(LEVEL_DEFINITIONS[levelId].enemyLevel).toBe(
        narrativeSiteForLevel(levelId).authoredEnemyLevel
      );
    }
  });

  it("produces four distinct blank plants with cumulative process inventories", () => {
    const games = ACT_THREE_LEVEL_IDS.map((levelId) => createScenarioGame(levelId));
    expect(new Set(games.map(({ run }) => run.seed)).size).toBe(4);
    for (const game of games) {
      const equipment = Object.values(game.rooms).flatMap((room) =>
        Object.values(room.equipment).filter((instance) => instance !== null)
      );
      const stationary = Object.values(game.rooms).reduce(
        (total, room) =>
          total +
          Object.values(room.stationary).reduce((roomTotal, amount) => roomTotal + amount, 0),
        0
      );
      expect(equipment).toEqual([]);
      expect(processLineIds(game, "gas_line")).toEqual([]);
      expect(processLineIds(game, "liquid_line")).toEqual([]);
      expect(stationary).toBeGreaterThan(0);
      const palette = LEVEL_DEFINITIONS[game.campaign.levelId].palette;
      expect(game.availability.equipment.includes("fluorine_cell")).toBe(
        palette.includes("uranium_fluorine")
      );
    }
  });

  it("introduces room-bound uranium at Station 14 and keeps it available on uranium-palette sites", () => {
    for (const levelId of ACT_THREE_LEVEL_IDS) {
      const game = createScenarioGame(levelId);
      const uranium = Object.values(game.rooms).reduce(
        (total, room) => total + room.stationary.uranyl_fluoride,
        0
      );
      if (LEVEL_DEFINITIONS[levelId].palette.includes("uranium_fluorine")) {
        expect(uranium, levelId).toBeGreaterThan(0);
      } else {
        expect(uranium, levelId).toBe(0);
      }
    }
    expect(LEVEL_DEFINITIONS.station_14.featuredReactionIds).toEqual([
      "uranium_hexafluoride_hydrolysis",
      "uranyl_fluoride_recovery",
      "hydrogen_fluoride_electrolysis",
    ]);
  });

  it("keeps specialist HF feed out of the common gas header", () => {
    for (const levelId of ACT_THREE_LEVEL_IDS) {
      const game = createScenarioGame(levelId);
      expect(game.gasSources.gas_reservoir?.gas.hydrogen_fluoride, levelId).toBe(0);
      expect(game.map.rooms.core?.taps.gas.sourceIds, levelId).toEqual(["gas_reservoir"]);
      expect(game.map.rooms.furnace?.taps.gas.sourceIds, levelId).toEqual([]);
      if (LEVEL_DEFINITIONS[levelId].palette.includes("uranium_fluorine")) {
        expect(
          game.gasSources.specialty_gas_reservoir?.gas.hydrogen_fluoride,
          levelId
        ).toBeGreaterThan(0);
        expect(game.map.rooms.reservoir?.taps.gas.sourceIds, levelId).toEqual([
          "specialty_gas_reservoir",
        ]);
        expect(game.map.utilityNodes.specialty_gas_reservoir?.hostRoomId, levelId).toBe(
          "reservoir"
        );
      } else {
        expect(game.gasSources.specialty_gas_reservoir, levelId).toBeUndefined();
      }
    }
  });
});

describe("Act III defense authoring", () => {
  it("authors five physical strategies and preserves established non-uranium defenses", () => {
    for (const levelId of ACT_THREE_LEVEL_IDS) {
      const builds = ACT_THREE_REFERENCE_BUILDS[levelId];
      expect(builds).toHaveLength(5);
      expect(new Set(builds.map(({ archetype }) => archetype)).size).toBe(5);
      const uraniumBuilds = builds.filter(({ id }) => id.includes("uranium"));
      const expectedUranium = LEVEL_DEFINITIONS[levelId].palette.includes("uranium_fluorine")
        ? 1
        : 0;
      expect(uraniumBuilds, levelId).toHaveLength(expectedUranium);
      expect(
        builds.every(({ rounds }) =>
          rounds.some(({ commands }) => commands.some(({ type }) => type === "build_connection"))
        )
      ).toBe(true);
    }
  });

  it("ends every site with a supported all-archetype formation", () => {
    for (const levelId of ACT_THREE_LEVEL_IDS) {
      const finalWave = LEVEL_DEFINITIONS[levelId].rounds.at(-1)?.wave ?? [];
      expect(
        finalWave.some(({ type }) => type === "anchor"),
        levelId
      ).toBe(true);
      expect(new Set(finalWave.map(({ type }) => type)).size, levelId).toBe(8);
      expect(
        finalWave.some(({ levelOffset }) => levelOffset > 0),
        levelId
      ).toBe(true);
    }
  });
});
