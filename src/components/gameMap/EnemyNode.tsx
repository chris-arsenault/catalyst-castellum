import { useCallback, useEffect, useState } from "react";
import type { AnimatedSprite, Graphics, Texture } from "pixi.js";
import type { EnemyState } from "../../game/types";
import type { WorldMap } from "../../game/world/map";
import { drawEnemyOverlay } from "./enemyGraphics";
import { enemyRenderModel } from "./enemyRenderModel";
import {
  ENEMY_SPRITE_DISPLAY_SIZE,
  enemyAnimationSpeed,
  enemySpritePose,
  enemySpriteVariant,
  loadEnemySpriteTextures,
} from "./enemySprites";

export const EnemyNode = ({
  enemy,
  map,
  fieldProtected,
  onHover,
}: {
  enemy: EnemyState;
  map: WorldMap;
  fieldProtected: boolean;
  onHover: (enemyId: number | null) => void;
}) => {
  const model = enemyRenderModel(enemy, map);
  const variant = enemySpriteVariant(model.appearance, model.behavior);
  const [loaded, setLoaded] = useState<{ textures: Texture[]; variant: typeof variant } | null>(
    null
  );
  useEffect(() => {
    let mounted = true;
    loadEnemySpriteTextures(variant).then((textures) => {
      if (mounted) setLoaded({ textures, variant });
    });
    return () => {
      mounted = false;
    };
  }, [variant]);
  const textures = loaded?.variant === variant ? loaded.textures : null;
  const draw = useCallback(
    (graphics: Graphics) =>
      drawEnemyOverlay(graphics, model.health, model.mode, model.behavior, fieldProtected),
    [fieldProtected, model.behavior, model.health, model.mode]
  );
  const seedAnimation = useCallback(
    (sprite: AnimatedSprite | null) => {
      if (sprite) sprite.gotoAndPlay(enemy.id % 8);
    },
    [enemy.id]
  );
  const pose = enemySpritePose(model.mode);
  return (
    <pixiContainer x={model.position.x} y={model.position.y} scale={{ x: model.facing, y: 1 }}>
      {textures ? (
        <pixiAnimatedSprite
          ref={seedAnimation}
          textures={textures}
          autoPlay
          loop
          animationSpeed={enemyAnimationSpeed(model.appearance, model.mode, model.behavior)}
          anchor={0.5}
          width={ENEMY_SPRITE_DISPLAY_SIZE * pose.scaleX}
          height={ENEMY_SPRITE_DISPLAY_SIZE * pose.scaleY}
          y={pose.y}
          rotation={pose.rotation}
          eventMode="none"
        />
      ) : null}
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
