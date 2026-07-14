import { ENEMY_DEFINITIONS } from "../../presentation/defaultGame";
import { enemyWorldPosition } from "../../game/queries";
import type {
  EnemyAppearanceArchetype,
  EnemyLocomotionMode,
  EnemyState,
  Point,
} from "../../game/types";
import { colorNumber, worldToMapPoint } from "./mapGeometry";
import type { GameDefinition } from "../../game/definitionTypes";

export interface EnemyRenderModel {
  color: number;
  facing: -1 | 1;
  health: number;
  mode: EnemyLocomotionMode;
  position: Point;
  appearance: EnemyAppearanceArchetype;
}

/** Pure, pack-bound projection from persisted simulation state to the map renderer. */
export const createEnemyRenderModel =
  (definition: Pick<GameDefinition, "enemies">) =>
  (enemy: EnemyState): EnemyRenderModel => ({
    color: colorNumber(definition.enemies[enemy.type].color),
    appearance: definition.enemies[enemy.type].presentation.appearance,
    facing: enemy.facing,
    health: enemy.health / enemy.maxHealth,
    mode: enemy.mode,
    position: worldToMapPoint(enemyWorldPosition(enemy)),
  });

export const enemyRenderModel = createEnemyRenderModel({ enemies: ENEMY_DEFINITIONS });
