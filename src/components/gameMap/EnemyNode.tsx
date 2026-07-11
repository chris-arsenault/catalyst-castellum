import { useCallback } from "react";
import type { Graphics } from "pixi.js";
import { ENEMY_DEFINITIONS } from "../../game/config";
import { enemyWorldPosition } from "../../game/simulation";
import type { EnemyState } from "../../game/types";
import { colorNumber, drawEnemy } from "./mapGraphics";

export const EnemyNode = ({ enemy }: { enemy: EnemyState }) => {
  const position = enemyWorldPosition(enemy);
  const definition = ENEMY_DEFINITIONS[enemy.type];
  const health = enemy.health / enemy.maxHealth;
  const offset = ((enemy.id % 3) - 1) * 10;
  const color = colorNumber(definition.color);
  const draw = useCallback(
    (graphics: Graphics) => drawEnemy(graphics, enemy.type, color, health),
    [color, enemy.type, health]
  );
  return <pixiGraphics x={position.x} y={position.y + offset} draw={draw} />;
};
