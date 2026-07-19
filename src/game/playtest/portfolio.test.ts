import { describe, expect, it } from "vitest";
import { LEVEL_DEFINITIONS } from "../config";
import { LEVEL_PLAYTEST_PORTFOLIOS } from "../content/playtestPortfolios";
import { DAMAGE_SOURCE_IDS, type DamageSourceId } from "../types";
import { evaluateDiversity } from "./runner";
import type { BuildArchetypeId, PlaytestResult } from "./types";

const sourceTotals = (): Record<DamageSourceId, number> =>
  Object.fromEntries(DAMAGE_SOURCE_IDS.map((sourceId) => [sourceId, 0])) as Record<
    DamageSourceId,
    number
  >;

const result = (
  planName: string,
  archetype: BuildArchetypeId,
  buildSignature: string
): PlaytestResult => ({
  levelId: "morrow_pocket",
  planName,
  archetype,
  success: true,
  terminalPhase: "level_complete",
  coreIntegrity: 100,
  roundsCleared: 5,
  killed: 1,
  breached: 0,
  coreDamage: 0,
  fieldDamageAbsorbed: 0,
  fieldDamageAbsorbedBySource: sourceTotals(),
  damageBySource: sourceTotals(),
  killsBySource: sourceTotals(),
  damageByChannel: { atmosphere: 0, corrosion: 0, heat: 0, pressure: 0, radiation: 0 },
  pulseDamage: 0,
  continuousDamage: 0,
  matterSpent: 10,
  buildProfile: {
    equipment: [],
    enabledGasLines: [],
    enabledLiquidLines: [],
    activeDamageSources: [],
  },
  buildSignature,
  plannedActions: 1,
  acceptedActions: 1,
  rejectedActions: 0,
  simulatedSeconds: 10,
  stable: true,
  reports: [],
});

describe("reference-build portfolios", () => {
  it("covers every mechanical level with valid round-aware plans", () => {
    expect(Object.keys(LEVEL_PLAYTEST_PORTFOLIOS)).toEqual(Object.keys(LEVEL_DEFINITIONS));
    for (const [levelId, portfolio] of Object.entries(LEVEL_PLAYTEST_PORTFOLIOS)) {
      expect(portfolio.levelId).toBe(levelId);
      expect(portfolio.referenceBuilds.length, levelId).toBeGreaterThanOrEqual(
        portfolio.requirements.minimumPassingBuilds
      );
      expect(new Set(portfolio.referenceBuilds.map(({ id }) => id)).size, levelId).toBe(
        portfolio.referenceBuilds.length
      );
      for (const build of portfolio.referenceBuilds) {
        expect(build.rounds.length, `${levelId}.${build.id}`).toBeLessThanOrEqual(
          LEVEL_DEFINITIONS[portfolio.levelId].rounds.length
        );
        for (const round of build.rounds) {
          expect(round.primeFraction).toBeGreaterThan(0);
          expect(round.primeFraction).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it("makes Morrow Pocket the first five-strategy diversity target", () => {
    const portfolio = LEVEL_PLAYTEST_PORTFOLIOS.morrow_pocket;
    expect(portfolio.requirements).toEqual({
      minimumPassingBuilds: 5,
      minimumPassingArchetypes: 5,
      minimumDistinctSignatures: 5,
    });
    expect(new Set(portfolio.referenceBuilds.map(({ archetype }) => archetype)).size).toBe(5);
    expect(
      portfolio.referenceBuilds.some(({ rounds }) =>
        rounds.slice(1).some((round) => round.commands.length > 0)
      )
    ).toBe(true);
  });
});

describe("diversity evaluation", () => {
  const requirements = {
    minimumPassingBuilds: 2,
    minimumPassingArchetypes: 2,
    minimumDistinctSignatures: 2,
  };

  it("rejects authored labels that resolve to the same physical build", () => {
    const evaluation = evaluateDiversity(requirements, [
      result("flash", "burst", "same-physical-build"),
      result("acid", "continuous", "same-physical-build"),
    ]);
    expect(evaluation.passingBuilds).toBe(2);
    expect(evaluation.passingArchetypes).toEqual(["burst", "continuous"]);
    expect(evaluation.distinctPassingSignatures).toBe(1);
    expect(evaluation.satisfied).toBe(false);
  });

  it("accepts stable passing builds with distinct physical signatures", () => {
    const evaluation = evaluateDiversity(requirements, [
      result("flash", "burst", "flash-network"),
      result("acid", "continuous", "acid-network"),
    ]);
    expect(evaluation.satisfied).toBe(true);
    expect(evaluation.issues).toEqual([]);
  });
});
