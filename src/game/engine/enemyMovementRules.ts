import type { EnemyDefinition, EnemyLocomotionMode, EnemyState } from "../types";

export const ENEMY_WORLD_SPEED_SCALE = 32;

export const LOCOMOTION_SPEED: Record<EnemyState["mode"], number> = {
  walking: 1,
  climbing: 0.68,
  falling: 1.7,
  door: 0.72,
  flying: 1,
};

const definedLocomotionMultiplier = (
  multipliers: Record<EnemyLocomotionMode, number>,
  mode: EnemyLocomotionMode
): number => multipliers[mode];

export const enemyBehaviorSpeedMultiplier = (
  enemy: EnemyState,
  definition: EnemyDefinition
): number => {
  if (definition.behavior.kind === "ladder_runner") {
    return definedLocomotionMultiplier(definition.behavior.locomotionMultipliers, enemy.mode);
  }
  if (
    definition.behavior.kind === "armored_molt" &&
    enemy.behavior.kind === "armored_molt" &&
    enemy.behavior.phase === "exposed"
  ) {
    return (
      definition.behavior.exposedSpeedMultiplier *
      definedLocomotionMultiplier(definition.behavior.exposedLocomotionMultipliers, enemy.mode)
    );
  }
  return 1;
};
