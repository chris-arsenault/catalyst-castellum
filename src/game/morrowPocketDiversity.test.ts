import { describe, expect, it } from "vitest";
import { LEVEL_DEFINITIONS } from "./config";
import { LEVEL_PLAYTEST_PORTFOLIOS } from "./content/playtestPortfolios";
import { evaluateLevel } from "./playtest/runner";
import { createScenarioGame } from "./simulation";
import { processLineIds } from "./world/instances";

describe("Morrow Pocket open-defense authoring", () => {
  it("starts from an open plant using only mechanisms established in Act I", () => {
    const game = createScenarioGame("morrow_pocket");
    const installedEquipment = Object.values(game.rooms).flatMap((room) =>
      Object.values(room.equipment).filter((equipment) => equipment !== null)
    );

    expect(installedEquipment).toEqual([]);
    expect(processLineIds(game, "gas_line")).toEqual([]);
    expect(processLineIds(game, "liquid_line")).toEqual([]);
    expect(LEVEL_DEFINITIONS.morrow_pocket.rounds[0]?.availability).toEqual(
      LEVEL_DEFINITIONS.stored_chlorine.rounds.at(-1)?.availability
    );
    expect(LEVEL_DEFINITIONS.morrow_pocket.rounds[0]?.availability.equipment).not.toContain(
      "fluorine_cell"
    );
  });

  it("makes every reference defense construct its own machinery and transport topology", () => {
    const builds = LEVEL_PLAYTEST_PORTFOLIOS.morrow_pocket.referenceBuilds;
    for (const build of builds) {
      const commands = build.rounds.flatMap(({ commands: roundCommands }) => roundCommands);
      expect(
        commands.some(({ type }) => type === "install_equipment"),
        `${build.id} machinery`
      ).toBe(true);
      expect(
        commands.some(({ type }) => type === "build_connection"),
        `${build.id} topology`
      ).toBe(true);
    }
  });
});

describe("Morrow Pocket defense diversity acceptance", () => {
  it("clears with five physical strategies while an undefended Core falls", () => {
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
      const equipmentRooms = new Set(
        reference.buildProfile.equipment.map((entry) => entry.split(":")[0])
      );
      const enabledLines =
        reference.buildProfile.enabledGasLines.length +
        reference.buildProfile.enabledLiquidLines.length;
      expect(reference.success, reference.planName).toBe(true);
      expect(reference.coreIntegrity, reference.planName).toBeGreaterThanOrEqual(40);
      expect(equipmentRooms.size, `${reference.planName} combat rooms`).toBeGreaterThanOrEqual(2);
      expect(enabledLines, `${reference.planName} transport lines`).toBeGreaterThanOrEqual(3);
      expect(
        reference.buildProfile.activeDamageSources.length,
        `${reference.planName} damage contributions`
      ).toBeGreaterThanOrEqual(2);
    }

    const burst = evaluation.references.find(({ archetype }) => archetype === "burst")!;
    const continuous = evaluation.references.find(({ archetype }) => archetype === "continuous")!;
    const control = evaluation.references.find(({ archetype }) => archetype === "control")!;
    const hybrid = evaluation.references.find(({ archetype }) => archetype === "hybrid")!;
    expect(burst.buildProfile.enabledLiquidLines).toEqual([]);
    expect(burst.pulseDamage).toBeGreaterThan(0);
    expect(continuous.continuousDamage).toBeGreaterThan(continuous.pulseDamage * 5);
    expect(control.pulseDamage).toBe(0);
    expect(control.buildProfile.enabledLiquidLines.length).toBeGreaterThanOrEqual(3);
    expect(hybrid.pulseDamage).toBeGreaterThan(0);
    expect(hybrid.continuousDamage).toBeGreaterThan(0);
  }, 480_000);
});
