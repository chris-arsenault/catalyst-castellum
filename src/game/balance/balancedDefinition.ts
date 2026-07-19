import { deriveGame } from "../definition";
import type { GameDefinition, GameDefinitionSource } from "../definitionTypes";
import {
  ENEMY_TYPES,
  LEVEL_IDS,
  type EnemyType,
  type HazardChannels,
  type SpeciesId,
} from "../types";
import { DAMAGE_FAMILIES, damageFamilyIncludesSpecies, type DamageFamily } from "./damageModel";

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
