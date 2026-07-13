import type { Graphics } from "pixi.js";
import type { FacilityRing, GridCell, RoomDefinition } from "../../game/types";
import type { RoomViewModel } from "../../presentation/selectors";

export interface RoomDrawModel {
  analysis: RoomViewModel;
  coreIntegrity: number;
  elapsed: number;
  gasInflowRate: number;
  height: number;
  cells: readonly RoomDrawCell[];
  structure: RoomDefinition["structure"];
  liquidColor: number;
  liquidInflowRate: number;
  lowerGasColor: number;
  lowerGasFill: number;
  occupied: number;
  pressurePulse: number;
  reactionIntensity: number;
  ring: FacilityRing;
  selected: boolean;
  upperGasColor: number;
  upperGasFill: number;
  width: number;
}

export interface RoomDrawCell {
  cell: GridCell;
  left: number;
  liquidFill: number;
  size: number;
  top: number;
  zone: "lower" | "upper";
}

const roomBorderColor = (model: RoomDrawModel): number => {
  if (model.selected) return 0xedfaa5;
  if (model.structure === "core") return 0xe1cc60;
  if (model.ring === "inner") return 0x66ceaf;
  if (model.ring === "middle") return 0x5d95a3;
  return 0x458774;
};

const drawHazardGlow = (graphics: Graphics, model: RoomDrawModel): void => {
  if (model.analysis.hazard < 32) return;
  const color = model.analysis.hazard >= 65 ? 0xdaf64c : 0xf0ba4d;
  graphics
    .rect(-model.width / 2 - 8, -model.height / 2 - 8, model.width + 16, model.height + 16)
    .stroke({ color, width: model.analysis.hazard >= 65 ? 5 : 3, alpha: 0.32 });
};

const drawRoomShell = (graphics: Graphics, model: RoomDrawModel): void => {
  const left = -model.width / 2;
  const top = -model.height / 2;
  graphics
    .rect(left + 5, top + 7, model.width + 8, model.height + 8)
    .fill({ color: 0x020604, alpha: 0.78 });
  graphics
    .rect(left - 5, top - 5, model.width + 10, model.height + 10)
    .fill({ color: 0x243c32 })
    .stroke({ color: 0x4b7564, width: 2, alpha: 0.94 });
  graphics
    .rect(left, top, model.width, model.height)
    .fill({ color: 0x07100d })
    .stroke({ color: roomBorderColor(model), width: model.selected ? 5 : 3, alpha: 0.96 });
  graphics
    .moveTo(left + 2, top + 2)
    .lineTo(-left - 2, top + 2)
    .lineTo(-left - 2, -top - 2)
    .stroke({ color: 0xa8c5b6, width: 2.5, alpha: 0.48 });
  graphics
    .moveTo(left + 2, -top - 2)
    .lineTo(-left - 2, -top - 2)
    .lineTo(-left - 2, top + 2)
    .stroke({ color: 0x020605, width: 4, alpha: 0.72 });
  for (const x of [left + 8, -left - 8]) {
    for (const y of [top + 8, -top - 8]) {
      graphics.circle(x, y, 2.5).fill({ color: 0xb2c5b6, alpha: 0.7 });
    }
  }
};

const drawGasInflow = (graphics: Graphics, model: RoomDrawModel): void => {
  if (model.gasInflowRate <= 0.002 || model.structure === "core") return;
  const left = -model.width / 2 + 10;
  const travel =
    (model.elapsed * (24 + Math.min(46, model.gasInflowRate * 4))) % (model.width - 20);
  const intensity = Math.min(1, 0.35 + Math.sqrt(model.gasInflowRate) * 0.3);
  for (let index = 0; index < 9; index += 1) {
    const x = left + ((travel + index * 31) % (model.width - 20));
    const upper = index % 2 === 0;
    const baseY = upper ? -model.height * 0.23 : model.height * 0.23;
    const y = baseY + Math.sin(model.elapsed * 4 + index * 1.7) * 10;
    graphics
      .circle(x, y, 2.2 + (index % 3))
      .fill({ color: upper ? model.upperGasColor : model.lowerGasColor, alpha: intensity });
  }
  const pulse = 10 + ((model.elapsed * 28) % 24);
  graphics
    .circle(-model.width / 2 + 4, 0, pulse)
    .stroke({ color: model.lowerGasColor, width: 3, alpha: 0.8 * (1 - (pulse - 10) / 24) });
};

const drawRoomAtmosphere = (graphics: Graphics, model: RoomDrawModel): void => {
  for (const atmosphericCell of model.cells) {
    const upper = atmosphericCell.zone === "upper";
    const fill = upper ? model.upperGasFill : model.lowerGasFill;
    if (fill < 0.002) continue;
    graphics
      .rect(
        atmosphericCell.left + 0.8,
        atmosphericCell.top + 0.8,
        atmosphericCell.size - 1.6,
        atmosphericCell.size - 1.6
      )
      .fill({
        color: upper ? model.upperGasColor : model.lowerGasColor,
        alpha: 0.06 + Math.sqrt(fill) * 0.48,
      });
  }
  const half = model.height / 2;
  if (model.upperGasFill > 0.01) {
    graphics
      .rect(-model.width / 2 + 2, -half + 2, model.width - 4, 5)
      .fill({ color: model.upperGasColor, alpha: 0.55 + model.upperGasFill * 0.35 });
  }
  if (model.lowerGasFill > 0.01) {
    graphics
      .rect(-model.width / 2 + 2, half - 7, model.width - 4, 5)
      .fill({ color: model.lowerGasColor, alpha: 0.55 + model.lowerGasFill * 0.35 });
  }
  graphics
    .moveTo(-model.width / 2 + 8, 0)
    .lineTo(model.width / 2 - 8, 0)
    .stroke({ color: 0x83a99a, width: 1, alpha: 0.22 });
  drawGasInflow(graphics, model);
};

const drawRoomLiquid = (graphics: Graphics, model: RoomDrawModel): void => {
  if (model.analysis.liquidTotal <= 0.5 || model.structure === "core") return;
  for (const atmosphericCell of model.cells) {
    if (atmosphericCell.liquidFill <= 0) continue;
    const fillHeight = atmosphericCell.size * atmosphericCell.liquidFill;
    const surface = atmosphericCell.top + atmosphericCell.size - fillHeight;
    graphics
      .rect(atmosphericCell.left + 0.8, surface, atmosphericCell.size - 1.6, fillHeight)
      .fill({ color: model.liquidColor, alpha: 0.7 });
    if (atmosphericCell.liquidFill < 1) {
      graphics
        .moveTo(atmosphericCell.left + 1, surface)
        .lineTo(atmosphericCell.left + atmosphericCell.size - 1, surface)
        .stroke({ color: model.liquidColor, width: 2, alpha: 0.9 });
    }
  }
  if (model.liquidInflowRate > 0.002) {
    const y = model.height / 2 - Math.max(8, model.analysis.liquidTotal * 0.1);
    for (let x = -model.width / 2 + 12; x < model.width / 2 - 8; x += 18) {
      graphics
        .moveTo(x, y + Math.sin(model.elapsed * 5 + x * 0.08) * 3)
        .lineTo(x + 12, y + Math.sin(model.elapsed * 5 + x * 0.08 + 1) * 3)
        .stroke({ color: model.liquidColor, width: 2.5, alpha: 0.9 });
    }
  }
};

const integrityColor = (integrity: number): number => {
  if (integrity > 0.5) return 0xe8f87b;
  if (integrity > 0.25) return 0xf5a53e;
  return 0xf55147;
};

const drawCore = (graphics: Graphics, model: RoomDrawModel): void => {
  if (model.structure !== "core") return;
  const radius = Math.min(model.width, model.height) * 0.24;
  const integrity = model.coreIntegrity / 100;
  graphics.circle(0, 10, radius).stroke({ color: 0x2f6153, width: 12, alpha: 0.96 });
  graphics
    .arc(0, 10, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * integrity)
    .stroke({ color: integrityColor(integrity), width: 12 });
  graphics.circle(0, 10, radius * 0.25).fill({ color: 0xf6fbb9, alpha: 0.92 });
};

const drawIndicators = (graphics: Graphics, model: RoomDrawModel): void => {
  const left = -model.width / 2;
  const top = -model.height / 2;
  if (model.structure === "entry") {
    graphics.poly([left + 20, -16, left - 12, 0, left + 20, 16]).fill({ color: 0xe3785d });
  }
  if (model.reactionIntensity > 0.08) {
    graphics
      .rect(left + 10, top + 10, model.width - 20, model.height - 20)
      .stroke({ color: 0xc1f64a, width: 3, alpha: 0.8 });
  }
  if (model.pressurePulse > 1) {
    const pulse = Math.min(1, model.pressurePulse / 160);
    graphics
      .rect(
        left - 5 - pulse * 8,
        top - 5 - pulse * 8,
        model.width + 10 + pulse * 16,
        model.height + 10 + pulse * 16
      )
      .stroke({ color: 0xf6a35b, width: 3 + pulse * 3, alpha: 0.4 + pulse * 0.4 });
  }
  if (model.occupied > 0) {
    graphics.circle(-left - 12, top + 12, 17).fill({ color: 0xe9584a });
  }
};

export const drawRoom = (graphics: Graphics, model: RoomDrawModel): void => {
  graphics.clear();
  drawHazardGlow(graphics, model);
  drawRoomShell(graphics, model);
  drawRoomAtmosphere(graphics, model);
  drawRoomLiquid(graphics, model);
  drawCore(graphics, model);
  drawIndicators(graphics, model);
};
