import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_DEFINITION } from "../definition";
import {
  DAMAGE_FAMILIES,
  DAMAGE_SOURCE_FOR_FAMILY,
  PRIMARY_DAMAGE_FAMILIES,
  deriveBalancedDefinition,
  idealThroughputProfile,
  routeProfile,
  solveEnemyHealth,
  solveFirstOrderDamage,
  stoichiometryModel,
} from "./combatModel";
import { DAMAGE_SOURCE_IDS } from "../types";
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

describe("combat balance source-of-truth model", () => {
  it("derives residence time from route geometry, locomotion, speed, and drag", () => {
    const deckmouth = routeProfile("morrow_pocket", "deckmouth", DEFAULT_GAME_DEFINITION);
    const shearJelly = routeProfile("morrow_pocket", "shear_jelly", DEFAULT_GAME_DEFINITION);

    expect(deckmouth.pathCells).toBe(89);
    expect(deckmouth.roomsVisited).toBe(7);
    expect(deckmouth.rooms.find(({ roomId }) => roomId === "furnace")?.volume).toBeGreaterThan(250);
    expect(deckmouth.pressureSeconds).toBeGreaterThan(deckmouth.drySeconds);
    expect(deckmouth.floodedSeconds).toBeGreaterThan(deckmouth.drySeconds);
    expect(shearJelly.floodedSeconds).toBeCloseTo(shearJelly.drySeconds, 8);
  });

  it("builds the signed species/reaction stoichiometry matrix", () => {
    const model = stoichiometryModel(DEFAULT_GAME_DEFINITION);
    const oxygen = model.species.indexOf("oxygen");
    const hydrogen = model.species.indexOf("hydrogen");
    const steam = model.species.indexOf("steam");
    const ox1 = model.reactions.indexOf("hydrogen_oxygen_combustion");

    expect(model.matrix[oxygen]?.[ox1]).toBe(-1);
    expect(model.matrix[hydrogen]?.[ox1]).toBe(-2);
    expect(model.matrix[steam]?.[ox1]).toBe(2);
  });

  it("keeps every solved damage family independently measurable", () => {
    expect(new Set(Object.values(DAMAGE_SOURCE_FOR_FAMILY)).size).toBe(DAMAGE_FAMILIES.length);
    expect(new Set(Object.values(DAMAGE_SOURCE_FOR_FAMILY))).toEqual(new Set(DAMAGE_SOURCE_IDS));
  });

  it("propagates feed limits through every chlorine-sodium branch and OX-1 cadence", () => {
    const throughput = idealThroughputProfile("morrow_pocket", DEFAULT_GAME_DEFINITION);

    expect(throughput.chlorAlkaliExtentPerSecond).toBeGreaterThan(0);
    expect(throughput.hydrogenChloridePerSecond).toBeCloseTo(
      throughput.chlorAlkaliExtentPerSecond * 2,
      8
    );
    expect(throughput.releasedChlorinePerSecond).toBeCloseTo(
      throughput.chlorAlkaliExtentPerSecond,
      8
    );
    expect(throughput.ox1ExpectedIntervalSeconds).toBeGreaterThan(throughput.ox1CooldownSeconds);
    expect(throughput.reactions).toHaveLength(30);
    expect(
      throughput.reactions.find(({ reactionId }) => reactionId === "hydrogen_fluoride_electrolysis")
        ?.equipmentExtentPerSecondByLevel
    ).toEqual([0.3, 0.46, 0.66]);
    expect(throughput.supplies.every(({ portRate }) => portRate > 0)).toBe(true);
  });
});

describe("combat balance role solves", () => {
  it("solves controlled reference roles before solving durable enemy roles", () => {
    const damage = solveFirstOrderDamage(DEFAULT_GAME_DEFINITION);
    const health = solveEnemyHealth(DEFAULT_GAME_DEFINITION, damage.scales);

    damage.result.predicted.forEach((predicted, index) => {
      expect(predicted).toBeCloseTo(damage.targets[index] ?? 0, 3);
    });
    for (const family of [
      "ox1_flash",
      "chlorine_gas",
      "carbon_monoxide",
      "hydrogen_fluoride",
      "fluorine",
      "uranium_chemistry",
    ] as const) {
      expect(damage.scales[family], family).toBeGreaterThan(0.95);
      expect(damage.scales[family], family).toBeLessThan(1.05);
    }
    for (const family of PRIMARY_DAMAGE_FAMILIES) {
      expect(damage.scales[family], family).toBeGreaterThanOrEqual(0.05);
      expect(damage.scales[family], family).toBeLessThanOrEqual(20);
    }
    expect(health.find(({ enemyType }) => enemyType === "splitback")?.solvedHealth).toBeGreaterThan(
      health.find(({ enemyType }) => enemyType === "deckmouth")?.solvedHealth ?? 0
    );
  });

  it("can isolate every damage family without changing chemistry or transport rates", () => {
    for (const family of DAMAGE_FAMILIES) {
      const isolated = deriveBalancedDefinition(DEFAULT_GAME_DEFINITION, {
        exclusiveFamily: family,
        probe: true,
      });
      expect(isolated.reactions.hydrogen_chlorine_recombination.behavior).toEqual(
        DEFAULT_GAME_DEFINITION.reactions.hydrogen_chlorine_recombination.behavior
      );
      expect(isolated.enemies.deckmouth.health).toBe(1_000_000_000);
      expect(isolated.enemies.deckmouth.coreDamage).toBe(0);
    }
  });
});
