import { describe, expect, it } from "vitest";
import { LEVEL_DEFINITIONS } from "./config";
import { LEVEL_PLAYTEST_PORTFOLIOS } from "./content/playtestPortfolios";
import { TOWER_CHASSIS_IDS } from "./identifiers";
import { evaluateLevel } from "./playtest/runner";
import { createScenarioGame } from "./simulation";
import { processLineIds } from "./world/instances";

describe("Morrow Pocket open-defense authoring", () => {
  it("starts with two routes, a clear floor plan, and the complete tower roster", () => {
    const game = createScenarioGame("morrow_pocket");
    const installedEquipment = Object.values(game.rooms).flatMap((room) =>
      Object.values(room.equipment).filter((equipment) => equipment !== null)
    );

    expect(installedEquipment).toEqual([]);
    expect(processLineIds(game, "gas_line")).toEqual([]);
    expect(processLineIds(game, "liquid_line")).toEqual([]);
    expect(Object.keys(game.map.routeGraph.routes).sort()).toEqual(["upper_cut", "west_claim"]);
    expect(LEVEL_DEFINITIONS.morrow_pocket.rounds[0]?.availability.towers).toEqual(
      TOWER_CHASSIS_IDS
    );
  });

  it("makes every reference defense place and develop its own tower layout", () => {
    const builds = LEVEL_PLAYTEST_PORTFOLIOS.morrow_pocket.referenceBuilds;
    for (const build of builds) {
      const commands = build.rounds.flatMap(({ commands: roundCommands }) => roundCommands);
      expect(
        commands.filter(({ type }) => type === "place_tower").length,
        `${build.id} placements`
      ).toBeGreaterThanOrEqual(6);
      expect(
        commands.some(({ type }) => type === "upgrade_tower"),
        `${build.id} development`
      ).toBe(true);
    }
  });
});

describe("Morrow Pocket defense diversity acceptance", () => {
  it("clears with five tower strategies while an undefended Core falls", () => {
    const evaluation = evaluateLevel({ levelId: "morrow_pocket", runs: 0, seed: 23_004 });

    expect(evaluation.doNothing.success).toBe(false);
    expect(evaluation.diversity).toMatchObject({
      satisfied: true,
      passingBuilds: 5,
      minimumPassingBuilds: 5,
      minimumPassingArchetypes: 5,
      distinctPassingSignatures: 5,
      minimumDistinctSignatures: 5,
    });
    expect(new Set(evaluation.references.map(({ buildSignature }) => buildSignature)).size).toBe(5);
    for (const reference of evaluation.references) {
      expect(reference.success, reference.planName).toBe(true);
      expect(reference.coreIntegrity, reference.planName).toBeGreaterThanOrEqual(40);
      expect(
        reference.buildProfile.towers.length,
        `${reference.planName} tower count`
      ).toBeGreaterThanOrEqual(6);
    }

    const precise = evaluation.references.find(({ archetype }) => archetype === "precise")!;
    const rapid = evaluation.references.find(({ archetype }) => archetype === "rapid")!;
    const area = evaluation.references.find(({ archetype }) => archetype === "area")!;
    const control = evaluation.references.find(({ archetype }) => archetype === "control")!;
    const support = evaluation.references.find(({ archetype }) => archetype === "support")!;
    expect(precise.damageBySource.tower_bolt).toBeGreaterThan(0);
    expect(rapid.damageBySource.tower_repeater).toBeGreaterThan(0);
    expect(area.damageBySource.tower_projector + area.damageBySource.tower_mortar).toBeGreaterThan(
      area.damageBySource.tower_bolt
    );
    expect(control.damageBySource.tower_snare).toBeGreaterThan(0);
    expect(control.damageBySource.tower_repeater).toBeGreaterThan(0);
    expect(support.damageBySource.tower_relay).toBeGreaterThan(0);
    expect(support.buildProfile.activeDamageSources.length).toBeGreaterThanOrEqual(3);
  }, 480_000);
});
