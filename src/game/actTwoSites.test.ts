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

  it("produces four distinct open sites with empty authored construction layers", () => {
    const games = ACT_TWO_LEVEL_IDS.map((levelId) => createScenarioGame(levelId));
    expect(new Set(games.map(({ map }) => JSON.stringify(map.rooms))).size).toBe(4);
    for (const game of games) {
      const siteCodes = Object.values(game.map.rooms)
        .filter(({ provenance }) => provenance === "site")
        .map(({ code }) => code);
      const equipment = Object.values(game.rooms).flatMap((room) =>
        Object.values(room.equipment).filter((instance) => instance !== null)
      );
      expect(new Set(siteCodes).size).toBe(siteCodes.length);
      expect(equipment).toEqual([]);
      expect(processLineIds(game, "gas_line")).toEqual([]);
      expect(processLineIds(game, "liquid_line")).toEqual([]);
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
  it("authors five tower-defense portfolios and introduces process assistance after Cordon 41", () => {
    for (const levelId of ACT_TWO_LEVEL_IDS) {
      const builds = ACT_TWO_REFERENCE_BUILDS[levelId];
      expect(builds).toHaveLength(5);
      expect(new Set(builds.map(({ archetype }) => archetype)).size).toBe(5);
      expect(
        builds.filter(({ rounds }) =>
          rounds.some(({ commands }) => commands.some(({ type }) => type === "place_tower"))
        )
      ).toHaveLength(5);
      const processBuilds = builds.filter(({ rounds }) =>
        rounds.some(({ commands }) => commands.some(({ type }) => type === "build_connection"))
      );
      expect(processBuilds, levelId).toHaveLength(
        levelId === "junction_l6" || levelId === "pell_cut" ? 1 : 0
      );
    }
  });

  it("keeps five-wave escalation and adds multi-route supported formations after Kettleblack", () => {
    for (const levelId of ACT_TWO_LEVEL_IDS) {
      expect(LEVEL_DEFINITIONS[levelId].rounds).toHaveLength(5);
      const finalWave = LEVEL_DEFINITIONS[levelId].rounds.at(-1)?.wave ?? [];
      expect(new Set(finalWave.map(({ type }) => type)).size, levelId).toBeGreaterThanOrEqual(4);
      if (levelId === "kettleblack") continue;
      expect(
        finalWave.some(({ type }) => type === "anchor"),
        levelId
      ).toBe(true);
      expect(new Set(finalWave.map(({ routeId }) => routeId)).size, levelId).toBeGreaterThan(1);
    }
  });
});
