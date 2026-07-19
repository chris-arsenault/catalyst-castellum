import { describe, expect, it } from "vitest";
import { LEVEL_DEFINITIONS } from "./config";
import { ACT_TWO_REFERENCE_BUILDS } from "./content/playtestPortfolios/actTwo";
import { narrativeSiteForLevel } from "./content/narrativeCampaign";
import { createScenarioGame } from "./simulation";
import { LEVEL_IDS } from "./types";
import { processLineIds } from "./world/instances";

const ACT_TWO_LEVEL_IDS = ["kettleblack", "cordon_41", "junction_l6", "pell_cut"] as const;

describe("Act II mechanical sites", () => {
  it("binds the complete narrative act at its authored enemy levels", () => {
    expect(LEVEL_IDS.slice(4, 8)).toEqual(ACT_TWO_LEVEL_IDS);
    for (const levelId of ACT_TWO_LEVEL_IDS) {
      expect(narrativeSiteForLevel(levelId).levelId).toBe(levelId);
      expect(LEVEL_DEFINITIONS[levelId].enemyLevel).toBe(
        narrativeSiteForLevel(levelId).authoredEnemyLevel
      );
    }
  });

  it("produces four distinct open plants with stationary process opportunities", () => {
    const games = ACT_TWO_LEVEL_IDS.map((levelId) => createScenarioGame(levelId));
    expect(new Set(games.map(({ run }) => run.seed)).size).toBe(4);
    for (const game of games) {
      const siteCodes = Object.values(game.map.rooms)
        .filter(({ provenance }) => provenance === "site")
        .map(({ code }) => code);
      const equipment = Object.values(game.rooms).flatMap((room) =>
        Object.values(room.equipment).filter((instance) => instance !== null)
      );
      const stationary = Object.values(game.rooms).reduce(
        (total, room) =>
          total +
          Object.values(room.stationary).reduce((roomTotal, amount) => roomTotal + amount, 0),
        0
      );
      expect(new Set(siteCodes).size).toBe(siteCodes.length);
      expect(equipment).toEqual([]);
      expect(processLineIds(game, "gas_line")).toEqual([]);
      expect(processLineIds(game, "liquid_line")).toEqual([]);
      expect(stationary).toBeGreaterThan(0);
    }
  });

  it("keeps specialist equipment cumulative and introduces the Fluorine Cell at Pell Cut", () => {
    for (const levelId of ACT_TWO_LEVEL_IDS.slice(0, 3)) {
      expect(LEVEL_DEFINITIONS[levelId].rounds[0]?.availability.equipment).not.toContain(
        "fluorine_cell"
      );
    }
    expect(LEVEL_DEFINITIONS.pell_cut.rounds[0]?.availability.equipment).toContain("fluorine_cell");
    const pellCut = createScenarioGame("pell_cut");
    expect(pellCut.gasSources.gas_reservoir?.gas.hydrogen_fluoride).toBe(0);
    expect(pellCut.gasSources.specialty_gas_reservoir?.gas.hydrogen_fluoride).toBeGreaterThan(0);
    expect(pellCut.map.rooms.reservoir?.taps.gas.sourceIds).toEqual(["specialty_gas_reservoir"]);
    expect(pellCut.map.rooms.furnace?.taps.gas.sourceIds).toEqual([]);
  });
});

describe("Act II defense authoring", () => {
  it("authors five physical strategy portfolios for every open site", () => {
    for (const levelId of ACT_TWO_LEVEL_IDS) {
      const builds = ACT_TWO_REFERENCE_BUILDS[levelId];
      expect(builds).toHaveLength(5);
      expect(new Set(builds.map(({ archetype }) => archetype)).size).toBe(5);
      expect(
        builds.filter(({ rounds }) =>
          rounds.some(({ commands }) => commands.some(({ type }) => type === "install_equipment"))
        )
      ).toHaveLength(5);
      expect(
        builds.filter(({ rounds }) =>
          rounds.some(({ commands }) => commands.some(({ type }) => type === "build_connection"))
        )
      ).toHaveLength(5);
    }
  });

  it("makes each final wave a supported mixed-trait formation", () => {
    for (const levelId of ACT_TWO_LEVEL_IDS) {
      const finalWave = LEVEL_DEFINITIONS[levelId].rounds.at(-1)?.wave ?? [];
      expect(
        finalWave.some(({ type }) => type === "anchor"),
        levelId
      ).toBe(true);
      expect(new Set(finalWave.map(({ type }) => type)).size, levelId).toBeGreaterThanOrEqual(5);
      expect(
        finalWave.some(({ levelOffset }) => levelOffset > 0),
        levelId
      ).toBe(true);
    }
  });
});
