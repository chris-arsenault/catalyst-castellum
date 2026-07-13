import type { EnemyState } from "../types";

export const ENEMY_WORLD_SPEED_SCALE = 32;

export const LOCOMOTION_SPEED: Record<EnemyState["mode"], number> = {
  walking: 1,
  climbing: 0.68,
  falling: 1.7,
  door: 0.72,
  flying: 1,
};
