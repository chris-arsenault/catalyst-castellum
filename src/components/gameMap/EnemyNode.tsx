import { useCallback } from "react";
import type { Graphics } from "pixi.js";
import type { EnemyState } from "../../game/types";
import type { WorldMap } from "../../game/world/map";
import { drawEnemy } from "./enemyGraphics";
import { enemyRenderModel } from "./enemyRenderModel";

export const EnemyNode = ({
  enemy,
  map,
  onHover,
}: {
  enemy: EnemyState;
  map: WorldMap;
  onHover: (enemyId: number | null) => void;
}) => {
  const model = enemyRenderModel(enemy, map);
  const draw = useCallback(
    (graphics: Graphics) =>
      drawEnemy(graphics, model.appearance, model.color, model.health, model.mode),
    [model.appearance, model.color, model.health, model.mode]
  );
  return (
    <pixiContainer x={model.position.x} y={model.position.y} scale={{ x: model.facing, y: 1 }}>
      <pixiGraphics
        draw={draw}
        eventMode="static"
        cursor="help"
        onPointerOver={() => onHover(enemy.id)}
        onPointerOut={() => onHover(null)}
      />
    </pixiContainer>
  );
};
