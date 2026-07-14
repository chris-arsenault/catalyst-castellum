import type { Graphics } from "pixi.js";
import type { EnemyLocomotionMode, EnemyType } from "../../game/types";

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

const drawFloater = (graphics: Graphics, color: number): void => {
  graphics.circle(0, -2, 12).fill({ color, alpha: 0.9 });
  graphics.circle(-10, -4, 6).fill({ color, alpha: 0.65 });
  graphics.circle(10, -4, 6).fill({ color, alpha: 0.65 });
  graphics.moveTo(-7, 8).lineTo(-11, 17).stroke({ color, width: 1.25, alpha: 0.8 });
  graphics.moveTo(7, 8).lineTo(11, 17).stroke({ color, width: 1.25, alpha: 0.8 });
};

const drawEnemyShape = (graphics: Graphics, type: EnemyType, color: number): void => {
  switch (type) {
    case "floater":
      return drawFloater(graphics, color);
    case "shell":
      graphics.poly([-17, 7, -11, -11, 5, -15, 17, -3, 13, 11, -4, 15]).fill({ color });
      return;
    case "bellows":
      graphics.ellipse(0, 0, 18, 13).fill({ color });
      graphics.circle(-13, -5, 7).stroke({ color: 0xfaad9d, width: 1.5, alpha: 0.9 });
      graphics.circle(13, -5, 7).stroke({ color: 0xfaad9d, width: 1.5, alpha: 0.9 });
      return;
    case "skimmer":
      graphics.poly([-18, 8, -11, -8, 14, -5, 19, 3, 7, 11]).fill({ color });
      return;
    case "crawler":
      graphics.ellipse(0, 0, 16, 11).fill({ color });
      graphics.circle(12, -3, 7).fill({ color: 0xf3cf84 });
  }
};

const healthColor = (health: number): number => {
  if (health > 0.5) return 0xdcf455;
  if (health > 0.25) return 0xf5a44a;
  return 0xf54b42;
};

export const drawEnemy = (
  graphics: Graphics,
  type: EnemyType,
  color: number,
  health: number,
  mode: EnemyLocomotionMode
): void => {
  graphics.clear();
  const pose = enemyPoseModel(mode);
  if (pose.groundedShadow) {
    graphics.ellipse(0, 10, 17, 7).fill({ color: 0x020806, alpha: 0.52 });
  }
  drawEnemyShape(graphics, type, color);
  if (pose.stance === "walk") {
    graphics
      .moveTo(-7, 7)
      .lineTo(-12, 14)
      .moveTo(6, 7)
      .lineTo(11, 14)
      .stroke({ color, width: 1.75, alpha: 0.9 });
  } else if (pose.stance === "brace") {
    graphics
      .moveTo(7, -4)
      .lineTo(20, -1)
      .moveTo(5, 4)
      .lineTo(18, 8)
      .moveTo(-6, 7)
      .lineTo(-13, 14)
      .stroke({ color, width: 1.75, alpha: 0.95 });
    graphics.moveTo(23, -9).lineTo(23, 12).stroke({ color: 0xf7b264, width: 1, alpha: 0.75 });
  } else if (pose.stance === "climb") {
    graphics
      .moveTo(-9, -5)
      .lineTo(-16, -12)
      .moveTo(9, 2)
      .lineTo(16, 10)
      .stroke({ color, width: 1.75, alpha: 0.95 });
  } else if (pose.stance === "fall") {
    graphics
      .moveTo(-9, -3)
      .lineTo(-18, -11)
      .moveTo(9, -3)
      .lineTo(18, -11)
      .moveTo(-7, 6)
      .lineTo(-14, 15)
      .moveTo(7, 6)
      .lineTo(14, 15)
      .stroke({ color, width: 1.75, alpha: 0.95 });
    graphics
      .moveTo(-22, -2)
      .lineTo(-22, -14)
      .moveTo(22, 1)
      .lineTo(22, -10)
      .stroke({ color: 0xd4e7d4, width: 1, alpha: 0.38 });
  }
  graphics.circle(9, -5, 2).fill({ color: 0x2e1711 });
  graphics.roundRect(-16, -22, 32, 2, 1).fill({ color: 0x132720, alpha: 0.88 });
  graphics.roundRect(-16, -22, 32 * health, 2, 1).fill({ color: healthColor(health) });
};
