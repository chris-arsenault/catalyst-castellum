import { useCallback } from "react";
import type { Graphics } from "pixi.js";
import type { EnemyState } from "../../game/types";
import { drawEnemy } from "./enemyGraphics";
import { enemyRenderModel } from "./enemyRenderModel";

export const EnemyNode = ({ enemy }: { enemy: EnemyState }) => {
  const model = enemyRenderModel(enemy);
  const draw = useCallback(
    (graphics: Graphics) => drawEnemy(graphics, model.type, model.color, model.health, model.mode),
    [model.color, model.health, model.mode, model.type]
  );
  return (
    <pixiContainer x={model.position.x} y={model.position.y} scale={{ x: model.facing, y: 1 }}>
      <pixiGraphics draw={draw} />
    </pixiContainer>
  );
};
