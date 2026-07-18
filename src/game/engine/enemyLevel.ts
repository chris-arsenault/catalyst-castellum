import type { EnemyDefinition } from "../types";

export const MIN_ENEMY_LEVEL = 1;
export const MAX_ENEMY_LEVEL = 99;
/** Existing solved archetype values are calibrated at this level. */
export const REFERENCE_ENEMY_LEVEL = 20;

export const ENEMY_HEALTH_GROWTH_PER_LEVEL = 1.1;
export const ENEMY_CORE_DAMAGE_GROWTH_PER_LEVEL = 1.035;
export const ENEMY_RESIDUE_GROWTH_PER_LEVEL = 1.025;

const geometricScale = (level: number, growth: number): number =>
  growth ** (level - REFERENCE_ENEMY_LEVEL);

/** Health and player damage can share this geometric basis to preserve exposure windows by level gap. */
export const enemyHealthScale = (level: number): number =>
  geometricScale(level, ENEMY_HEALTH_GROWTH_PER_LEVEL);

/** Durability-like behavior pools follow health so their share of an enemy budget stays stable. */
export const enemyBehaviorDurabilityScale = enemyHealthScale;

export interface LeveledEnemyStats {
  level: number;
  health: number;
  coreDamage: number;
  matterYield: number;
  residueOnDeath: number;
}

export const enemyStatsAtLevel = (
  definition: EnemyDefinition,
  level: number
): LeveledEnemyStats => {
  const healthScale = enemyHealthScale(level);
  return {
    level,
    health: definition.health * healthScale,
    coreDamage: Math.max(
      1,
      Math.round(definition.coreDamage * geometricScale(level, ENEMY_CORE_DAMAGE_GROWTH_PER_LEVEL))
    ),
    // Rewards grow with the square root of durability so level raises value without funding itself.
    matterYield: Math.max(1, Math.round(definition.matterYield * Math.sqrt(healthScale))),
    residueOnDeath: Math.max(
      1,
      Math.round(definition.residueOnDeath * geometricScale(level, ENEMY_RESIDUE_GROWTH_PER_LEVEL))
    ),
  };
};

export const resolveEnemyLevel = (siteLevel: number, levelOffset: number): number =>
  siteLevel + levelOffset;
