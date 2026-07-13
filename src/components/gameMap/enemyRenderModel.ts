import { ENEMY_DEFINITIONS } from "../../game/config";
import { enemyWorldPosition } from "../../game/simulation";
import type { EnemyLocomotionMode, EnemyState, EnemyType, Point } from "../../game/types";
import { colorNumber, worldToMapPoint } from "./mapGeometry";

export interface EnemyRenderModel {
  color: number;
  facing: -1 | 1;
  health: number;
  mode: EnemyLocomotionMode;
  position: Point;
  type: EnemyType;
}

/** Pure projection from persisted simulation state to the map renderer. */
export const enemyRenderModel = (enemy: EnemyState): EnemyRenderModel => ({
  color: colorNumber(ENEMY_DEFINITIONS[enemy.type].color),
  facing: enemy.facing,
  health: enemy.health / enemy.maxHealth,
  mode: enemy.mode,
  position: worldToMapPoint(enemyWorldPosition(enemy)),
  type: enemy.type,
});
