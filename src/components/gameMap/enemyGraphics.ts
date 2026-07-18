import type { Graphics } from "pixi.js";
import type { EnemyBehaviorState, EnemyLocomotionMode } from "../../game/types";

export interface EnemyPoseModel {
  groundedShadow: boolean;
  stance: "walk" | "climb" | "fall" | "brace" | "fly";
}

export const enemyPoseModel = (mode: EnemyLocomotionMode): EnemyPoseModel => ({
  groundedShadow: mode !== "falling" && mode !== "flying",
  stance: {
    walking: "walk",
    climbing: "climb",
    falling: "fall",
    door: "brace",
    flying: "fly",
  }[mode] as EnemyPoseModel["stance"],
});

const healthColor = (health: number): number => {
  if (health > 0.5) return 0xdcf455;
  if (health > 0.25) return 0xf5a44a;
  return 0xf54b42;
};

export const drawEnemyOverlay = (
  graphics: Graphics,
  health: number,
  mode: EnemyLocomotionMode,
  behavior: EnemyBehaviorState,
  fieldProtected: boolean
): void => {
  graphics.clear();
  const pose = enemyPoseModel(mode);
  graphics.rect(-31, -32, 62, 64).fill({ color: 0xffffff, alpha: 0.001 });
  if (pose.groundedShadow) {
    graphics.ellipse(0, 17, 23, 6).fill({ color: 0x020806, alpha: 0.42 });
  }
  if (behavior.kind === "shared_field") {
    graphics.circle(0, -3, 31).stroke({
      color: 0x8fffea,
      width: behavior.active ? 2 : 1,
      alpha: behavior.active ? 0.72 : 0.28,
    });
  }
  if (fieldProtected) {
    graphics.circle(0, -3, 29).stroke({ color: 0x8fffea, width: 1.5, alpha: 0.58 });
  }
  if (pose.stance === "brace") {
    graphics.moveTo(27, -16).lineTo(27, 20).stroke({ color: 0xf7b264, width: 1.25, alpha: 0.78 });
  } else if (pose.stance === "fall") {
    graphics
      .moveTo(-25, -4)
      .lineTo(-25, -19)
      .moveTo(24, 1)
      .lineTo(24, -14)
      .stroke({ color: 0xd4e7d4, width: 1, alpha: 0.38 });
  }
  graphics.roundRect(-20, -34, 40, 3, 1.5).fill({ color: 0x132720, alpha: 0.9 });
  graphics.roundRect(-20, -34, 40 * health, 3, 1.5).fill({ color: healthColor(health) });
};
