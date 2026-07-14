import type { Graphics } from "pixi.js";
import type { EquipmentId, EquipmentLevel } from "../../game/types";

export interface EquipmentDrawModel {
  accent: number;
  enabled: boolean;
  equipmentId: EquipmentId;
  level: EquipmentLevel;
}

const drawAgitator = (graphics: Graphics, accent: number): void => {
  graphics.circle(0, -26, 10).stroke({ color: accent, width: 1.25, alpha: 0.9 });
  for (let index = 0; index < 3; index += 1) {
    const angle = (index * Math.PI * 2) / 3;
    const inner = { x: Math.cos(angle) * 3, y: -26 + Math.sin(angle) * 3 };
    const outer = { x: Math.cos(angle + 0.52) * 9, y: -26 + Math.sin(angle + 0.52) * 9 };
    const wing = { x: Math.cos(angle + 1.15) * 5, y: -26 + Math.sin(angle + 1.15) * 5 };
    graphics.poly([inner.x, inner.y, outer.x, outer.y, wing.x, wing.y]).fill({ color: accent });
  }
  graphics.circle(0, -26, 2.5).fill({ color: 0xe8f3ec });
};

const drawContactor = (graphics: Graphics, accent: number): void => {
  graphics
    .roundRect(-11, -38, 22, 25, 5)
    .fill({ color: 0x0a1713 })
    .stroke({ color: accent, width: 1.25 });
  graphics.rect(-8, -25, 16, 9).fill({ color: accent, alpha: 0.62 });
  graphics.circle(-5, -29, 2.2).fill({ color: accent, alpha: 0.9 });
  graphics.circle(3, -33, 2.8).fill({ color: accent, alpha: 0.75 });
};

const drawCoil = (graphics: Graphics, accent: number): void => {
  graphics
    .moveTo(-11, -36)
    .lineTo(8, -36)
    .lineTo(-8, -29)
    .lineTo(8, -22)
    .lineTo(-8, -15)
    .lineTo(11, -15)
    .stroke({ color: accent, width: 1.75, alpha: 0.92 });
};

const drawMembrane = (graphics: Graphics, accent: number): void => {
  graphics
    .roundRect(-13, -38, 26, 25, 3)
    .fill({ color: 0x0a1713 })
    .stroke({ color: accent, width: 1.25 });
  graphics.moveTo(0, -36).lineTo(0, -15).stroke({ color: accent, width: 1, alpha: 0.8 });
  graphics.circle(-6, -26, 3).fill({ color: 0x69c5cd, alpha: 0.92 });
  graphics.circle(6, -26, 3).fill({ color: 0xc5f540, alpha: 0.92 });
};

const drawEquipmentGlyph = (graphics: Graphics, model: EquipmentDrawModel): void => {
  switch (model.equipmentId) {
    case "gas_agitator":
      drawAgitator(graphics, model.accent);
      return;
    case "wet_contactor":
      drawContactor(graphics, model.accent);
      return;
    case "thermal_coil":
      drawCoil(graphics, model.accent);
      return;
    case "membrane_cell":
      drawMembrane(graphics, model.accent);
  }
};

export const drawEquipmentMarker = (graphics: Graphics, model: EquipmentDrawModel): void => {
  graphics.clear();
  if (model.enabled) graphics.circle(0, -24, 24).fill({ color: model.accent, alpha: 0.055 });
  graphics
    .roundRect(-18, -43, 36, 40, 9)
    .fill({ color: 0x091310, alpha: 0.94 })
    .stroke({ color: model.accent, width: 1, alpha: model.enabled ? 0.86 : 0.38 });
  graphics.moveTo(-11, -39).lineTo(11, -39).stroke({ color: 0xd9eee2, width: 1, alpha: 0.2 });
  drawEquipmentGlyph(graphics, model);
  for (let grade = 1; grade <= 3; grade += 1) {
    graphics
      .roundRect(-13 + (grade - 1) * 9, -8, 6, 2, 1)
      .fill({ color: grade <= model.level ? model.accent : 0x264239, alpha: 0.96 });
  }
  graphics.circle(13, -38, 2).fill({ color: model.enabled ? 0xcff56b : 0x637a70, alpha: 0.9 });
};
