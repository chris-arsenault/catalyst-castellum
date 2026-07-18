import type { Graphics } from "pixi.js";
import type { FacilityRing, GridCell, RoomDefinition } from "../../game/types";
import type { RoomViewModel } from "../../presentation/selectors";
import { drawCoreOverlay, type CoreReservoirDrawModel } from "./coreGraphics";

export interface RoomDrawModel {
  analysis: RoomViewModel;
  coreIntegrity: number;
  coreReservoirs: readonly CoreReservoirDrawModel[];
  elapsed: number;
  gasInflowRate: number;
  gasInflowColors: readonly number[];
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
    graphics.circle(x, y, 2.2 + (index % 3)).fill({
      color:
        model.gasInflowColors[index % model.gasInflowColors.length] ??
        (upper ? model.upperGasColor : model.lowerGasColor),
      alpha: intensity,
    });
  }
};

const drawRoomAtmosphere = (graphics: Graphics, model: RoomDrawModel): void => {
  const half = model.height / 2;
  if (model.upperGasFill > 0.002) {
    graphics
      .rect(-model.width / 2 + 3, -half + 3, model.width - 6, half - 3)
      .fill({ color: model.upperGasColor, alpha: 0.035 + Math.sqrt(model.upperGasFill) * 0.24 });
  }
  if (model.lowerGasFill > 0.002) {
    graphics
      .rect(-model.width / 2 + 3, 0, model.width - 6, half - 3)
      .fill({ color: model.lowerGasColor, alpha: 0.035 + Math.sqrt(model.lowerGasFill) * 0.24 });
  }
  for (const atmosphericCell of model.cells) {
    if (atmosphericCell.cell.column % 3 === 0) {
      graphics
        .moveTo(atmosphericCell.left, atmosphericCell.top)
        .lineTo(atmosphericCell.left, atmosphericCell.top + atmosphericCell.size)
        .stroke({ color: 0x9ab0a6, width: 1, alpha: 0.075 });
    }
    if (atmosphericCell.cell.elevation % 3 === 0) {
      graphics
        .moveTo(atmosphericCell.left, atmosphericCell.top)
        .lineTo(atmosphericCell.left + atmosphericCell.size, atmosphericCell.top)
        .stroke({ color: 0x9ab0a6, width: 1, alpha: 0.075 });
    }
  }
  graphics
    .moveTo(-model.width / 2 + 8, 0)
    .lineTo(model.width / 2 - 8, 0)
    .stroke({ color: 0x83a99a, width: 1, alpha: 0.12 });
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
      .fill({ color: model.liquidColor, alpha: 0.58 });
    if (atmosphericCell.liquidFill < 1) {
      graphics
        .moveTo(atmosphericCell.left + 1, surface)
        .lineTo(atmosphericCell.left + atmosphericCell.size - 1, surface)
        .stroke({ color: model.liquidColor, width: 1.25, alpha: 0.86 });
    }
  }
  if (model.liquidInflowRate > 0.002) {
    const y = model.height / 2 - Math.max(8, model.analysis.liquidTotal * 0.1);
    for (let x = -model.width / 2 + 12; x < model.width / 2 - 8; x += 18) {
      graphics
        .moveTo(x, y + Math.sin(model.elapsed * 5 + x * 0.08) * 3)
        .lineTo(x + 12, y + Math.sin(model.elapsed * 5 + x * 0.08 + 1) * 3)
        .stroke({ color: model.liquidColor, width: 1.5, alpha: 0.82 });
    }
  }
};

const drawStatusPlate = (
  graphics: Graphics,
  x: number,
  y: number,
  color: number,
  pulse = 0
): void => {
  const radius = 7 + pulse * (0.5 + Math.sin(pulse * 8) * 0.35);
  graphics
    .circle(x, y, radius)
    .fill({ color: 0x07100d, alpha: 0.92 })
    .stroke({ color, width: 1.3, alpha: 0.9 });
};

const drawSelectionIcon = (graphics: Graphics, x: number, y: number): void => {
  const color = 0xedfaa5;
  drawStatusPlate(graphics, x, y, color);
  graphics
    .poly([x, y - 4, x + 4, y, x, y + 4, x - 4, y], true)
    .stroke({ color, width: 1.2, alpha: 0.95 });
  graphics.circle(x, y, 1.2).fill({ color, alpha: 1 });
};

const drawHazardIcon = (graphics: Graphics, x: number, y: number, lethal: boolean): void => {
  const color = lethal ? 0xdaf64c : 0xf0ba4d;
  drawStatusPlate(graphics, x, y, color);
  graphics
    .poly([x, y - 4.5, x + 4.5, y + 3.8, x - 4.5, y + 3.8], true)
    .stroke({ color, width: 1.15, alpha: 0.96 });
  graphics
    .moveTo(x, y - 1.7)
    .lineTo(x, y + 1)
    .stroke({ color, width: 1.2, alpha: 1 });
  graphics.circle(x, y + 2.7, 0.7).fill({ color, alpha: 1 });
};

const drawReactionIcon = (graphics: Graphics, x: number, y: number): void => {
  const color = 0xc1f64a;
  drawStatusPlate(graphics, x, y, color);
  for (const [dx, dy] of [
    [0, -4],
    [3.5, -2],
    [3.5, 2],
    [0, 4],
    [-3.5, 2],
    [-3.5, -2],
  ] as const) {
    graphics
      .moveTo(x, y)
      .lineTo(x + dx, y + dy)
      .stroke({ color, width: 0.9, alpha: 0.82 });
  }
  graphics.circle(x, y, 1.7).fill({ color, alpha: 0.96 });
};

const drawPressureIcon = (graphics: Graphics, x: number, y: number, pressure: number): void => {
  const color = 0xf6a35b;
  const pulse = Math.min(1, pressure / 160);
  drawStatusPlate(graphics, x, y, color, pulse);
  graphics.circle(x, y, 4).stroke({ color, width: 1, alpha: 0.9 });
  graphics
    .moveTo(x, y)
    .lineTo(x + 2.7, y - 2.5)
    .stroke({ color, width: 1.3, alpha: 1 });
  graphics.circle(x, y, 1).fill({ color, alpha: 1 });
};

const drawStatusIcons = (graphics: Graphics, model: RoomDrawModel): void => {
  let x = -model.width / 2 + 10;
  const y = -model.height / 2 + 12;
  const advance = (): number => {
    const current = x;
    x += 15;
    return current;
  };
  if (model.selected) drawSelectionIcon(graphics, advance(), y);
  if (model.analysis.hazard >= 32)
    drawHazardIcon(graphics, advance(), y, model.analysis.hazard >= 65);
  if (model.pressurePulse > 1) drawPressureIcon(graphics, advance(), y, model.pressurePulse);
  if (model.reactionIntensity > 0.08) drawReactionIcon(graphics, advance(), y);
};

const drawIndicators = (graphics: Graphics, model: RoomDrawModel): void => {
  const left = -model.width / 2;
  if (model.structure === "entry") {
    graphics.poly([left + 20, -16, left - 12, 0, left + 20, 16]).fill({ color: 0xe3785d });
  }
  if (model.occupied > 0) {
    graphics.circle(-left - 12, -model.height / 2 + 12, 11).fill({ color: 0xe9584a, alpha: 0.9 });
  }
  drawStatusIcons(graphics, model);
};

export const drawRoom = (graphics: Graphics, model: RoomDrawModel): void => {
  graphics.clear();
  if (model.structure === "core") {
    drawCoreOverlay(graphics, model);
    return;
  }
  drawRoomAtmosphere(graphics, model);
  drawRoomLiquid(graphics, model);
  drawIndicators(graphics, model);
};
