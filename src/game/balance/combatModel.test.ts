import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_DEFINITION } from "../definition";
import { DAMAGE_SOURCE_IDS, TOWER_CHASSIS_IDS } from "../identifiers";
import { idealThroughputProfile, routeProfile, stoichiometryModel } from "./combatModel";
import { solveLinearSystem, solveMinimumCoverage } from "./linearAlgebra";

describe("combat balance linear algebra", () => {
  it("solves a pivoted dense system", () => {
    expect(
      solveLinearSystem(
        [
          [0, 2],
          [3, 4],
        ],
        [6, 18]
      )
    ).toEqual([2, 3]);
  });

  it("treats damage targets as minimum coverage rather than penalizing useful overkill", () => {
    const solved = solveMinimumCoverage(
      [
        [10, 0],
        [0, 1],
      ],
      [1, 1],
      { prior: [1, 1], ridge: 0.001, minimum: 0, maximum: 4 }
    );
    expect(solved.solution[0]).toBeCloseTo(1, 3);
    expect(solved.solution[1]).toBeCloseTo(1, 3);
    expect(solved.predicted[0]).toBeGreaterThan(1);
    expect(solved.residualNorm).toBeLessThan(0.01);
  });
});

describe("tower-defense balance source of truth", () => {
  it("derives route residence from authored vertical geometry and locomotion", () => {
    const deckmouth = routeProfile("morrow_pocket", "deckmouth", DEFAULT_GAME_DEFINITION);
    const shearJelly = routeProfile("morrow_pocket", "shear_jelly", DEFAULT_GAME_DEFINITION);

    expect(deckmouth.pathCells).toBeGreaterThan(20);
    expect(deckmouth.roomsVisited).toBeGreaterThan(2);
    expect(deckmouth.pressureSeconds).toBeGreaterThan(deckmouth.drySeconds);
    expect(deckmouth.floodedSeconds).toBeGreaterThan(deckmouth.drySeconds);
    expect(shearJelly.floodedSeconds).toBeCloseTo(shearJelly.drySeconds, 8);
  });

  it("authors a distinct ordinary damage source for every tower chassis", () => {
    expect(Object.keys(DEFAULT_GAME_DEFINITION.towers)).toEqual(TOWER_CHASSIS_IDS);
    const towerSources = Object.values(DEFAULT_GAME_DEFINITION.towers).flatMap((tower) =>
      tower.attack.packets.map((packet) => packet.sourceId)
    );
    expect(new Set(towerSources).size).toBe(TOWER_CHASSIS_IDS.length);
    expect(towerSources.every((source) => DAMAGE_SOURCE_IDS.includes(source))).toBe(true);
    for (const tower of Object.values(DEFAULT_GAME_DEFINITION.towers)) {
      expect(tower.buildCost).toBeGreaterThan(0);
      expect(tower.cadence).toBeGreaterThan(0);
      expect(tower.range).toBeGreaterThan(0);
      expect(tower.upgrades.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("keeps chemistry balanced as a finite support economy", () => {
    const model = stoichiometryModel(DEFAULT_GAME_DEFINITION);
    const oxygen = model.species.indexOf("oxygen");
    const hydrogen = model.species.indexOf("hydrogen");
    const steam = model.species.indexOf("steam");
    const ox1 = model.reactions.indexOf("hydrogen_oxygen_combustion");

    expect(model.matrix[oxygen]?.[ox1]).toBe(-1);
    expect(model.matrix[hydrogen]?.[ox1]).toBe(-2);
    expect(model.matrix[steam]?.[ox1]).toBe(2);

    const throughput = idealThroughputProfile("cordon_41", DEFAULT_GAME_DEFINITION);
    expect(throughput.chlorAlkaliExtentPerSecond).toBeGreaterThan(0);
    expect(throughput.supplies.every(({ portRate }) => portRate > 0)).toBe(true);
    expect(throughput.reactions).toHaveLength(30);
  });
});
