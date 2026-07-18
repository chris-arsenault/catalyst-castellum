import { deriveGame } from "../definition";
import type { GameDefinition, GameDefinitionSource } from "../definitionTypes";
import { intendedPlan } from "../playtest/policies";
import { runPlan } from "../playtest/runner";
import { createGameRuntime } from "../runtime";
import {
  ENEMY_TYPES,
  LEVEL_IDS,
  type EnemyType,
  type HazardChannels,
  type LevelId,
  type SpeciesId,
} from "../types";
import { DAMAGE_FAMILIES, damageFamilyIncludesSpecies, type DamageFamily } from "./damageModel";
import { solveMinimumCoverage, type LeastSquaresResult, type Matrix } from "./linearAlgebra";
import { enemyStatsAtLevel, resolveEnemyLevel } from "../engine/enemyLevel";

const speciesScale = (
  speciesId: SpeciesId,
  scales: Partial<Record<DamageFamily, number>>,
  exclusiveFamily: DamageFamily | null
): number => {
  if (exclusiveFamily) return damageFamilyIncludesSpecies(exclusiveFamily, speciesId) ? 1 : 0;
  const family = DAMAGE_FAMILIES.find((candidate) =>
    damageFamilyIncludesSpecies(candidate, speciesId)
  );
  return family ? (scales[family] ?? 1) : 1;
};

const scaledSpecies = (
  definition: GameDefinition,
  scales: Partial<Record<DamageFamily, number>>,
  exclusiveFamily: DamageFamily | null
): GameDefinitionSource["species"] =>
  Object.fromEntries(
    Object.entries(definition.species).map(([id, species]) => {
      const scale = speciesScale(id as SpeciesId, scales, exclusiveFamily);
      return [
        id,
        {
          ...species,
          hazards: species.hazards.map((hazard) => ({ ...hazard, rate: hazard.rate * scale })),
        },
      ];
    })
  ) as unknown as GameDefinitionSource["species"];

const exclusiveScale = (
  family: DamageFamily,
  scales: Partial<Record<DamageFamily, number>>,
  exclusiveFamily: DamageFamily | null
): number => {
  if (exclusiveFamily) return exclusiveFamily === family ? 1 : 0;
  return scales[family] ?? 1;
};

const scaledReactions = (
  definition: GameDefinition,
  scales: Partial<Record<DamageFamily, number>>,
  exclusiveFamily: DamageFamily | null
): GameDefinitionSource["reactions"] =>
  Object.fromEntries(
    Object.entries(definition.reactions).map(([id, reaction]) => {
      if (id !== "hydrogen_oxygen_combustion" || reaction.behavior.kind !== "flash") {
        return [id, reaction];
      }
      const scale = exclusiveScale("ox1_flash", scales, exclusiveFamily);
      return [
        id,
        {
          ...reaction,
          behavior: {
            ...reaction.behavior,
            pressureDamageBase: reaction.behavior.pressureDamageBase * scale,
            pressureDamagePerExtent: reaction.behavior.pressureDamagePerExtent * scale,
            heatDamagePerExtent: reaction.behavior.heatDamagePerExtent * scale,
          },
        },
      ];
    })
  ) as GameDefinitionSource["reactions"];

const scaledEnvironment = (
  definition: GameDefinition,
  scales: Partial<Record<DamageFamily, number>>,
  exclusiveFamily: DamageFamily | null
): GameDefinitionSource["environmentHazards"] => ({
  gasTemperature: {
    ...definition.environmentHazards.gasTemperature,
    rate:
      definition.environmentHazards.gasTemperature.rate *
      exclusiveScale("thermal", scales, exclusiveFamily),
  },
  staticPressure: {
    ...definition.environmentHazards.staticPressure,
    rate:
      definition.environmentHazards.staticPressure.rate *
      exclusiveScale("overpressure", scales, exclusiveFamily),
  },
});

export type EnemyBalanceOverride = Partial<{
  health: number;
  speed: number;
  hazardMultipliers: HazardChannels;
  coreDamage: number;
}>;

export type BalancedDefinitionOptions = Partial<{
  familyScales: Partial<Record<DamageFamily, number>>;
  exclusiveFamily: DamageFamily | null;
  enemyOverrides: Partial<Record<EnemyType, EnemyBalanceOverride>>;
  probe: boolean;
}>;

const scaledEnemies = (
  definition: GameDefinition,
  options: BalancedDefinitionOptions
): GameDefinitionSource["enemies"] =>
  Object.fromEntries(
    ENEMY_TYPES.map((enemyType) => {
      const enemy = definition.enemies[enemyType];
      const override = options.enemyOverrides?.[enemyType];
      return [
        enemyType,
        {
          ...enemy,
          ...override,
          hazardMultipliers: override?.hazardMultipliers ?? enemy.hazardMultipliers,
          health: options.probe ? 1_000_000_000 : (override?.health ?? enemy.health),
          coreDamage: options.probe ? 0 : (override?.coreDamage ?? enemy.coreDamage),
        },
      ];
    })
  ) as GameDefinitionSource["enemies"];

const scaledLevels = (
  definition: GameDefinition,
  probe: boolean
): GameDefinitionSource["levels"] => {
  if (!probe) return definition.levels;
  return Object.fromEntries(
    LEVEL_IDS.map((levelId) => [
      levelId,
      { ...definition.levels[levelId], startingMatter: 1_000_000 },
    ])
  ) as GameDefinitionSource["levels"];
};

export const deriveBalancedDefinition = (
  definition: GameDefinition,
  options: BalancedDefinitionOptions
): GameDefinition => {
  const scales = options.familyScales ?? {};
  const exclusiveFamily = options.exclusiveFamily ?? null;
  return deriveGame(definition, {
    species: scaledSpecies(definition, scales, exclusiveFamily),
    reactions: scaledReactions(definition, scales, exclusiveFamily),
    environmentHazards: scaledEnvironment(definition, scales, exclusiveFamily),
    enemies: scaledEnemies(definition, options),
    levels: scaledLevels(definition, options.probe ?? false),
  });
};

const damageTotal = (report: {
  damageBySource: Record<string, number>;
  fieldDamageAbsorbed: number;
}): number =>
  Object.values(report.damageBySource).reduce((total, amount) => total + amount, 0) +
  report.fieldDamageAbsorbed;

export interface TransientProbeRow {
  levelId: LevelId;
  round: number;
  familyDamage: Record<DamageFamily, number>;
  effectiveHealth: number;
  targetDamage: number;
}

const LEVEL_COVERAGE_TARGET: Record<LevelId, number> = {
  flash_point: 1.2,
  make_the_reagent: 1.15,
  stored_chlorine: 1.18,
  commissioning_exam: 1.12,
};

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

type FamilyProbeDamage = Record<DamageFamily, Record<LevelId, Record<number, number>>>;

const probeFamily = (
  family: DamageFamily,
  definition: GameDefinition
): Record<LevelId, Record<number, number>> => {
  const probeDefinition = deriveBalancedDefinition(definition, {
    exclusiveFamily: family,
    probe: true,
  });
  const runtime = createGameRuntime(probeDefinition);
  return Object.fromEntries(
    LEVEL_IDS.map((levelId) => {
      const result = runPlan(levelId, intendedPlan(levelId), runtime);
      const rounds = Object.fromEntries(
        result.reports.map((report) => [report.round, damageTotal(report)])
      ) as Record<number, number>;
      return [levelId, rounds];
    })
  ) as Record<LevelId, Record<number, number>>;
};

const probeDamageByFamily = (definition: GameDefinition): FamilyProbeDamage =>
  Object.fromEntries(
    DAMAGE_FAMILIES.map((family) => [family, probeFamily(family, definition)])
  ) as FamilyProbeDamage;

export const runTransientProbes = (definition: GameDefinition): TransientProbeRow[] => {
  const damageByFamily = probeDamageByFamily(definition);
  return LEVEL_IDS.flatMap((levelId) =>
    definition.levels[levelId].rounds.map((_, roundIndex) => {
      const round = roundIndex + 1;
      const effectiveHealth = waveEffectiveHealth(levelId, roundIndex, definition);
      return {
        levelId,
        round,
        familyDamage: Object.fromEntries(
          DAMAGE_FAMILIES.map((family) => [family, damageByFamily[family][levelId][round] ?? 0])
        ) as Record<DamageFamily, number>,
        effectiveHealth,
        targetDamage: effectiveHealth * LEVEL_COVERAGE_TARGET[levelId],
      };
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

/** Secondary damage is measured in the matrix but held to absolute environmental guardrails. */
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

const familyMinimum = (
  family: DamageFamily,
  ox1Minimum: number,
  definition: GameDefinition
): number => {
  if (family === "overpressure" || family === "thermal" || family === "asphyxiation") {
    return secondaryAnchorScale(family, definition);
  }
  if (family === "ox1_flash") return ox1Minimum;
  return 0.05;
};

const familyMaximum = (family: DamageFamily, definition: GameDefinition): number => {
  if (family === "overpressure" || family === "thermal" || family === "asphyxiation") {
    return secondaryAnchorScale(family, definition);
  }
  return 5;
};

const ignitionPulseMinimum = (definition: GameDefinition): number => {
  const flash = definition.reactions.hydrogen_oxygen_combustion.behavior;
  if (flash.kind !== "flash") throw new Error("OX-1 behavior is not a flash.");
  const deckmouthPulse =
    (flash.pressureDamageBase + flash.ignitionExtent * flash.pressureDamagePerExtent) *
      definition.enemies.deckmouth.hazardMultipliers.pressure +
    flash.ignitionExtent *
      flash.heatDamagePerExtent *
      definition.enemies.deckmouth.hazardMultipliers.heat;
  return (definition.enemies.deckmouth.health * 1.05) / deckmouthPulse;
};

/** Uses exact state-space simulations as the sensitivity matrix for a coupled correction pass. */
export const solveSecondOrderDamage = (definition: GameDefinition): SecondOrderDamageSolve => {
  const rows = runTransientProbes(definition);
  const normalizedCoefficients = rows.map((row) =>
    DAMAGE_FAMILIES.map((family) => row.familyDamage[family] / row.targetDamage)
  );
  const normalizedTargets = rows.map(() => 1);
  const ox1Minimum = ignitionPulseMinimum(definition);
  const result = solveMinimumCoverage(normalizedCoefficients, normalizedTargets, {
    weights: rows.map(() => 1),
    ridge: 0.0005,
    prior: DAMAGE_FAMILIES.map((family) => secondaryAnchorScale(family, definition)),
    minimum: DAMAGE_FAMILIES.map((family) => familyMinimum(family, ox1Minimum, definition)),
    maximum: DAMAGE_FAMILIES.map((family) => familyMaximum(family, definition)),
  });
  return {
    rows,
    families: [...DAMAGE_FAMILIES],
    normalizedCoefficients,
    normalizedTargets,
    result,
    scales: Object.fromEntries(
      DAMAGE_FAMILIES.map((family, index) => [family, result.solution[index] ?? 1])
    ) as Record<DamageFamily, number>,
  };
};

export interface LiveBalanceResult {
  levelId: LevelId;
  success: boolean;
  coreIntegrity: number;
  killed: number;
  breached: number;
  damage: number;
}

export const verifyLiveBalance = (definition: GameDefinition): LiveBalanceResult[] => {
  const runtime = createGameRuntime(definition);
  return LEVEL_IDS.map((levelId) => {
    const result = runPlan(levelId, intendedPlan(levelId), runtime);
    return {
      levelId,
      success: result.success,
      coreIntegrity: result.coreIntegrity,
      killed: result.killed,
      breached: result.breached,
      damage: damageTotal(result),
    };
  });
};
