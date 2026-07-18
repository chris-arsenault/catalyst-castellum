import type { Graphics } from "pixi.js";
import type { EquipmentLevel } from "../../game/types";

export interface EquipmentDrawModel {
  accent: number;
  enabled: boolean;
  level: EquipmentLevel;
}

export const drawEquipmentOverlay = (graphics: Graphics, model: EquipmentDrawModel): void => {
  graphics.clear();
  graphics.roundRect(-54, -98, 108, 108, 8).fill({ color: 0xffffff, alpha: 0.001 });
  if (model.enabled) graphics.circle(0, -43, 51).fill({ color: model.accent, alpha: 0.045 });
  for (let grade = 1; grade <= 3; grade += 1) {
    graphics
      .roundRect(-14 + (grade - 1) * 10, 5, 7, 3, 1.5)
      .fill({ color: grade <= model.level ? model.accent : 0x264239, alpha: 0.96 });
  }
};
