import type { Texture } from "pixi.js";
import type {
  EnemyAppearanceArchetype,
  EnemyBehaviorState,
  EnemyLocomotionMode,
} from "../../game/types";
import { loadSpriteTextures } from "./spriteTextures";

export const ENEMY_SPRITE_FRAME_COUNT = 8;
export const ENEMY_SPRITE_SOURCE_SIZE = 192;
export const ENEMY_SPRITE_DISPLAY_SIZE = 62;

export type EnemySpriteVariant = EnemyAppearanceArchetype | "splitback_exposed";

const SPRITE_ROOT = "/sprites/enemies";

export const enemySpriteVariant = (
  appearance: EnemyAppearanceArchetype,
  behavior: EnemyBehaviorState
): EnemySpriteVariant =>
  appearance === "splitback" && behavior.kind === "armored_molt" && behavior.phase === "exposed"
    ? "splitback_exposed"
    : appearance;

export const enemySpriteUrl = (variant: EnemySpriteVariant): string =>
  `${SPRITE_ROOT}/${variant}.sheet.png`;

export const loadEnemySpriteTextures = (variant: EnemySpriteVariant): Promise<Texture[]> => {
  return loadSpriteTextures(
    enemySpriteUrl(variant),
    ENEMY_SPRITE_FRAME_COUNT,
    ENEMY_SPRITE_SOURCE_SIZE
  );
};

export const enemyAnimationSpeed = (
  appearance: EnemyAppearanceArchetype,
  mode: EnemyLocomotionMode,
  behavior: EnemyBehaviorState
): number => {
  if (behavior.kind === "armored_molt" && behavior.phase === "exposed") return 0.18;
  if (mode === "door") return 0.06;
  if (mode === "falling") return 0.1;
  if (mode === "climbing") return appearance === "clatter" ? 0.2 : 0.14;
  const authoredSpeed: Record<EnemyAppearanceArchetype, number> = {
    anchor: 0.08,
    clatter: 0.16,
    deckmouth: 0.11,
    flintjack: 0.18,
    glowbag: 0.09,
    redlung: 0.075,
    shear_jelly: 0.1,
    splitback: 0.075,
  };
  return authoredSpeed[appearance];
};

export interface EnemySpritePose {
  rotation: number;
  scaleX: number;
  scaleY: number;
  y: number;
}

export const enemySpritePose = (mode: EnemyLocomotionMode): EnemySpritePose => {
  switch (mode) {
    case "climbing":
      return { rotation: -Math.PI / 2, scaleX: 0.94, scaleY: 0.94, y: -3 };
    case "falling":
      return { rotation: 0.14, scaleX: 0.94, scaleY: 1.04, y: -7 };
    case "door":
      return { rotation: 0, scaleX: 0.91, scaleY: 1.08, y: -2 };
    case "flying":
      return { rotation: 0, scaleX: 1, scaleY: 1, y: -6 };
    case "walking":
      return { rotation: 0, scaleX: 1, scaleY: 1, y: -3 };
  }
};
