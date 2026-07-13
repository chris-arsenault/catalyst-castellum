import type { Graphics } from "pixi.js";
import type { EquipmentId, EquipmentLevel } from "../../game/types";

export interface EquipmentDrawModel {
  accent: number;
  enabled: boolean;
  equipmentId: EquipmentId;
  level: EquipmentLevel;
}

const drawAgitator = (graphics: Graphics, accent: number): void => {
  graphics.circle(0, -26, 11).stroke({ color: accent, width: 2.5, alpha: 0.95 });
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
    .stroke({ color: accent, width: 2.5 });
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
    .stroke({ color: accent, width: 3.5, alpha: 0.98 });
};

const drawMembrane = (graphics: Graphics, accent: number): void => {
  graphics
    .roundRect(-13, -38, 26, 25, 3)
    .fill({ color: 0x0a1713 })
    .stroke({ color: accent, width: 2.5 });
  graphics.moveTo(0, -36).lineTo(0, -15).stroke({ color: accent, width: 2, alpha: 0.85 });
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
  if (model.enabled) graphics.circle(0, -24, 27).fill({ color: model.accent, alpha: 0.09 });
  graphics
    .roundRect(-21, -45, 42, 45, 6)
    .fill({ color: 0x07100d, alpha: 0.98 })
    .stroke({ color: model.accent, width: 2.5, alpha: model.enabled ? 1 : 0.5 });
  graphics.moveTo(-17, -41).lineTo(17, -41).stroke({ color: 0xd9eee2, width: 1.5, alpha: 0.35 });
  drawEquipmentGlyph(graphics, model);
  for (let grade = 1; grade <= 3; grade += 1) {
    graphics
      .roundRect(-16 + (grade - 1) * 11, -6, 8, 3, 1)
      .fill({ color: grade <= model.level ? model.accent : 0x264239, alpha: 0.96 });
  }
  graphics.circle(16, -40, 3.5).fill({ color: model.enabled ? 0xcff56b : 0x637a70, alpha: 0.98 });
};
