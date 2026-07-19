import type { GameDefinition } from "../definitionTypes";
import { referencePlans } from "../playtest/policies";
import { runPlan } from "../playtest/runner";
import { createGameRuntime } from "../runtime";
import {
  LEVEL_IDS,
  type DamageSourceId,
  type HazardChannels,
  type LevelId,
  type SpeciesId,
} from "../types";
import { DAMAGE_FAMILIES, type DamageFamily } from "./damageModel";
import { solveMinimumCoverage, type LeastSquaresResult, type Matrix } from "./linearAlgebra";
import { enemyStatsAtLevel, resolveEnemyLevel } from "../engine/enemyLevel";
import { deriveBalancedDefinition } from "./balancedDefinition";

const damageTotal = (report: {
  damageBySource: Record<string, number>;
  fieldDamageAbsorbed: number;
}): number =>
  Object.values(report.damageBySource).reduce((total, amount) => total + amount, 0) +
  report.fieldDamageAbsorbed;

export const DAMAGE_SOURCE_FOR_FAMILY: Record<DamageFamily, DamageSourceId> = {
  ox1_flash: "hydrogen_oxygen_combustion",
  chlorine_gas: "chlorine_gas",
  hydrogen_chloride_gas: "hydrogen_chloride_gas",
  liquid_corrosion: "liquid_corrosion",
  carbon_monoxide: "carbon_monoxide",
  nitrogen_chemistry: "nitrogen_chemistry",
  nickel_carbonyl: "nickel_carbonyl",
  hydrogen_fluoride: "hydrogen_fluoride",
  fluorine: "fluorine",
  uranium_chemistry: "uranium_chemistry",
  asphyxiation: "asphyxiation",
  thermal: "thermal_exposure",
  overpressure: "catastrophic_overpressure",
};

export interface TransientProbeRow {
  levelId: LevelId;
  planName: string;
  archetype: string | null;
  round: number;
  familyDamage: Record<DamageFamily, number>;
  effectiveHealth: number;
  targetDamage: number;
}

const MINIMUM_CORE_INTEGRITY: Record<LevelId, number> = Object.fromEntries(
  LEVEL_IDS.map((levelId) => [levelId, levelId === "flash_point" ? 100 : 45])
) as Record<LevelId, number>;

const TRANSIENT_COVERAGE_MARGIN = 1.05;

const waveEffectiveHealth = (
  levelId: LevelId,
  roundIndex: number,
  definition: GameDefinition
): number =>
  (definition.levels[levelId].rounds[roundIndex]?.wave ?? []).reduce((total, entry) => {
    const siteLevel = definition.levels[levelId].enemyLevel;
    const level = resolveEnemyLevel(siteLevel, entry.levelOffset);
    const enemy = definition.enemies[entry.type];
    const health = enemyStatsAtLevel(enemy, level).health;
    const initialField =
      enemy.behavior.kind === "shared_field"
        ? (enemy.behavior.capacity * enemyStatsAtLevel(enemy, level).health) / enemy.health
        : 0;
    return total + health + initialField;
  }, 0);

const wavePotentialCoreDamage = (
  levelId: LevelId,
  roundIndex: number,
  definition: GameDefinition
): number =>
  (definition.levels[levelId].rounds[roundIndex]?.wave ?? []).reduce((total, entry) => {
    const siteLevel = definition.levels[levelId].enemyLevel;
    const level = resolveEnemyLevel(siteLevel, entry.levelOffset);
    return total + enemyStatsAtLevel(definition.enemies[entry.type], level).coreDamage;
  }, 0);

const roundCoverageTarget = (
  levelId: LevelId,
  roundIndex: number,
  definition: GameDefinition
): { effectiveHealth: number; targetDamage: number } => {
  const level = definition.levels[levelId];
  const effectiveHealth = waveEffectiveHealth(levelId, roundIndex, definition);
  const coreLossBudget = Math.max(0, level.startingCoreIntegrity - MINIMUM_CORE_INTEGRITY[levelId]);
  const roundCoreLossBudget = coreLossBudget / level.rounds.length;
  const potentialCoreDamage = wavePotentialCoreDamage(levelId, roundIndex, definition);
  const requiredNeutralizationFraction =
    potentialCoreDamage <= 0 ? 0 : Math.max(0, 1 - roundCoreLossBudget / potentialCoreDamage);
  return {
    effectiveHealth,
    targetDamage: effectiveHealth * requiredNeutralizationFraction * TRANSIENT_COVERAGE_MARGIN,
  };
};

const reportDamageByFamily = (report: {
  damageBySource: Record<DamageSourceId, number>;
  fieldDamageAbsorbedBySource: Record<DamageSourceId, number>;
}): Record<DamageFamily, number> =>
  Object.fromEntries(
    DAMAGE_FAMILIES.map((family) => {
      const sourceId = DAMAGE_SOURCE_FOR_FAMILY[family];
      return [
        family,
        report.damageBySource[sourceId] + report.fieldDamageAbsorbedBySource[sourceId],
      ];
    })
  ) as Record<DamageFamily, number>;

const probeDamageByFamily = (
  definition: GameDefinition
): Array<{
  levelId: LevelId;
  planName: string;
  archetype: string | null;
  rounds: Record<number, Record<DamageFamily, number>>;
}> => {
  const probeDefinition = deriveBalancedDefinition(definition, {
    probe: true,
  });
  const runtime = createGameRuntime(probeDefinition);
  return LEVEL_IDS.flatMap((levelId) =>
    referencePlans(levelId).map((plan) => {
      const result = runPlan(levelId, plan, runtime);
      return {
        levelId,
        planName: plan.name,
        archetype: plan.archetype,
        rounds: Object.fromEntries(
          result.reports.map((report) => [report.round, reportDamageByFamily(report)])
        ) as Record<number, Record<DamageFamily, number>>,
      };
    })
  );
};

export const runTransientProbes = (definition: GameDefinition): TransientProbeRow[] => {
  const portfolioDamage = probeDamageByFamily(definition);
  return portfolioDamage.flatMap(({ levelId, planName, archetype, rounds }) =>
    definition.levels[levelId].rounds.flatMap((_, roundIndex) => {
      const round = roundIndex + 1;
      const coverage = roundCoverageTarget(levelId, roundIndex, definition);
      return coverage.targetDamage <= 1e-8
        ? []
        : [
            {
              levelId,
              planName,
              archetype,
              round,
              familyDamage: Object.fromEntries(
                DAMAGE_FAMILIES.map((family) => [family, rounds[round]?.[family] ?? 0])
              ) as Record<DamageFamily, number>,
              ...coverage,
            },
          ];
    })
  );
};

export interface SecondOrderDamageSolve {
  rows: TransientProbeRow[];
  families: DamageFamily[];
  normalizedCoefficients: Matrix;
  normalizedTargets: number[];
  result: LeastSquaresResult;
  scales: Record<DamageFamily, number>;
  coverage: {
    minimum: number;
    tenthPercentile: number;
    mean: number;
    shortfallRows: number;
  };
}

const speciesHazardRate = (
  definition: GameDefinition,
  speciesId: SpeciesId,
  channel: keyof HazardChannels
): number =>
  definition.species[speciesId].hazards.find((hazard) => hazard.channel === channel)?.rate ?? 0;

const anchorRatio = (target: number, current: number, label: string): number => {
  if (current <= 0) throw new Error(`${label} needs a positive authored coefficient.`);
  return target / current;
};

const mean = (values: number[]): number =>
  values.reduce((total, value) => total + value, 0) / values.length;

const SECOND_ORDER_ROLE_ANCHORS = new Set<DamageFamily>([
  "ox1_flash",
  "hydrogen_fluoride",
  "fluorine",
  "uranium_chemistry",
  "asphyxiation",
  "thermal",
  "overpressure",
]);

/** Secondary and already-clearing specialist damage retain their first-order role guardrails. */
const secondaryAnchorScale = (family: DamageFamily, definition: GameDefinition): number => {
  if (family === "overpressure") {
    return anchorRatio(36, definition.environmentHazards.staticPressure.rate, "Static pressure");
  }
  if (family === "thermal") {
    return mean([
      anchorRatio(0.014, definition.environmentHazards.gasTemperature.rate, "Environmental heat"),
      anchorRatio(7.3, speciesHazardRate(definition, "steam", "heat"), "Steam heat"),
    ]);
  }
  if (family === "asphyxiation") {
    return mean([
      anchorRatio(72.5, speciesHazardRate(definition, "oxygen", "atmosphere"), "Oxygen deficiency"),
      anchorRatio(
        30,
        speciesHazardRate(definition, "carbon_dioxide", "atmosphere"),
        "Carbon dioxide"
      ),
    ]);
  }
  return 1;
};

const familyMinimum = (family: DamageFamily, definition: GameDefinition): number => {
  if (SECOND_ORDER_ROLE_ANCHORS.has(family)) {
    return secondaryAnchorScale(family, definition);
  }
  return 0.05;
};

const familyMaximum = (family: DamageFamily, definition: GameDefinition): number => {
  if (SECOND_ORDER_ROLE_ANCHORS.has(family)) {
    return secondaryAnchorScale(family, definition);
  }
  return 5;
};

/** Uses exact state-space simulations as the sensitivity matrix for a coupled correction pass. */
export const solveSecondOrderDamage = (definition: GameDefinition): SecondOrderDamageSolve => {
  const rows = runTransientProbes(definition);
  const normalizedCoefficients = rows.map((row) =>
    DAMAGE_FAMILIES.map((family) => row.familyDamage[family] / row.targetDamage)
  );
  const normalizedTargets = rows.map(() => 1);
  const result = solveMinimumCoverage(normalizedCoefficients, normalizedTargets, {
    weights: rows.map(() => 1),
    ridge: 0.005,
    prior: DAMAGE_FAMILIES.map((family) => secondaryAnchorScale(family, definition)),
    minimum: DAMAGE_FAMILIES.map((family) => familyMinimum(family, definition)),
    maximum: DAMAGE_FAMILIES.map((family) => familyMaximum(family, definition)),
  });
  const coverage = [...result.predicted].sort((left, right) => left - right);
  return {
    rows,
    families: [...DAMAGE_FAMILIES],
    normalizedCoefficients,
    normalizedTargets,
    result,
    scales: Object.fromEntries(
      DAMAGE_FAMILIES.map((family, index) => [family, result.solution[index] ?? 1])
    ) as Record<DamageFamily, number>,
    coverage: {
      minimum: coverage[0] ?? 0,
      tenthPercentile: coverage[Math.floor(Math.max(0, coverage.length - 1) * 0.1)] ?? 0,
      mean: mean(coverage),
      shortfallRows: coverage.filter((value) => value < 1 - 1e-6).length,
    },
  };
};

export interface LiveBalanceResult {
  levelId: LevelId;
  planName: string;
  archetype: string | null;
  success: boolean;
  coreIntegrity: number;
  killed: number;
  breached: number;
  damage: number;
  matterSpent: number;
  damagePerMatter: number;
  dominantFamily: DamageFamily | null;
  dominantShare: number;
}

export const verifyLiveBalance = (definition: GameDefinition): LiveBalanceResult[] => {
  const runtime = createGameRuntime(definition);
  return LEVEL_IDS.flatMap((levelId) =>
    referencePlans(levelId).map((plan) => {
      const result = runPlan(levelId, plan, runtime);
      const familyDamage = Object.fromEntries(
        DAMAGE_FAMILIES.map((family) => {
          const sourceId = DAMAGE_SOURCE_FOR_FAMILY[family];
          return [
            family,
            result.damageBySource[sourceId] + result.fieldDamageAbsorbedBySource[sourceId],
          ];
        })
      ) as Record<DamageFamily, number>;
      const dominantFamily = DAMAGE_FAMILIES.reduce<DamageFamily | null>((best, family) => {
        if (familyDamage[family] <= 0) return best;
        return !best || familyDamage[family] > familyDamage[best] ? family : best;
      }, null);
      const damage = damageTotal(result);
      return {
        levelId,
        planName: plan.name,
        archetype: plan.archetype,
        success: result.success,
        coreIntegrity: result.coreIntegrity,
        killed: result.killed,
        breached: result.breached,
        damage,
        matterSpent: result.matterSpent,
        damagePerMatter: damage / Math.max(1, result.matterSpent),
        dominantFamily,
        dominantShare: dominantFamily ? familyDamage[dominantFamily] / Math.max(1, damage) : 0,
      };
    })
  );
};
