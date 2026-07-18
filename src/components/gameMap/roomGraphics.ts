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
  provenance: "site" | "hull";
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

interface RoomPalette {
  accent: number;
  base: number;
  inset: number;
}

const roomPalette = (model: RoomDrawModel): RoomPalette => {
  if (model.structure === "core") return { accent: 0xd2b85f, base: 0x18170f, inset: 0x292719 };
  if (model.ring === "inner") return { accent: 0xc49d64, base: 0x171a19, inset: 0x2b2a21 };
  if (model.ring === "middle") return { accent: 0x629db3, base: 0x0d171c, inset: 0x182b33 };
  return { accent: 0x54a891, base: 0x0b1815, inset: 0x163129 };
};

const chamberPath = (left: number, top: number, width: number, height: number, cut: number) => [
  left + cut,
  top,
  left + width - cut,
  top,
  left + width,
  top + cut,
  left + width,
  top + height - cut,
  left + width - cut,
  top + height,
  left + cut,
  top + height,
  left,
  top + height - cut,
  left,
  top + cut,
];

const HULL_ACCENT = 0x7be0ff;

/** Owned hull rooms wear a bright bracketed frame so the player reads them as theirs. */
const drawHullFrame = (graphics: Graphics, model: RoomDrawModel): void => {
  if (model.provenance !== "hull") return;
  const left = -model.width / 2 - 3;
  const top = -model.height / 2 - 3;
  const right = model.width / 2 + 3;
  const bottom = model.height / 2 + 3;
  const arm = 12;
  for (const [x, y, dx, dy] of [
    [left, top, 1, 1],
    [right, top, -1, 1],
    [left, bottom, 1, -1],
    [right, bottom, -1, -1],
  ] as const) {
    graphics
      .moveTo(x, y + dy * arm)
      .lineTo(x, y)
      .lineTo(x + dx * arm, y)
      .stroke({ color: HULL_ACCENT, width: 2, alpha: 0.9 });
  }
};

const drawHazardGlow = (graphics: Graphics, model: RoomDrawModel): void => {
  if (model.analysis.hazard < 32) return;
  const color = model.analysis.hazard >= 65 ? 0xdaf64c : 0xf0ba4d;
  graphics
    .roundRect(-model.width / 2 - 5, -model.height / 2 - 5, model.width + 10, model.height + 10, 11)
    .stroke({ color, width: model.analysis.hazard >= 65 ? 2 : 1.25, alpha: 0.34 });
};

const drawRoomShell = (graphics: Graphics, model: RoomDrawModel): void => {
  const left = -model.width / 2;
  const top = -model.height / 2;
  const palette = roomPalette(model);
  graphics
    .poly(chamberPath(left + 5, top + 7, model.width, model.height, 8))
    .fill({ color: 0x010302, alpha: 0.58 });
  graphics
    .poly(chamberPath(left - 2, top - 2, model.width + 4, model.height + 4, 10))
    .fill({ color: palette.inset, alpha: 0.98 })
    .stroke({ color: palette.accent, width: 1, alpha: 0.42 });
  graphics
    .poly(chamberPath(left, top, model.width, model.height, 8))
    .fill({ color: palette.base })
    .stroke({
      color: roomBorderColor(model),
      width: model.selected ? 2.5 : 1,
      alpha: model.selected ? 1 : 0.82,
    });
  if (model.selected) {
    graphics
      .poly(chamberPath(left + 2, top + 2, model.width - 4, model.height - 4, 7))
      .fill({ color: 0xdbea83, alpha: 0.055 });
  }
  graphics
    .moveTo(left + 10, top + 1)
    .lineTo(left + model.width * 0.4, top + 1)
    .stroke({ color: palette.accent, width: model.selected ? 3 : 2, alpha: 0.92 });
  graphics
    .moveTo(-left - 18, top + 1)
    .lineTo(-left - 9, top + 1)
    .lineTo(-left - 1, top + 9)
    .stroke({ color: palette.accent, width: 1, alpha: 0.6 });
  if (model.selected) {
    graphics
      .poly(chamberPath(left + 5, top + 5, model.width - 10, model.height - 10, 5))
      .stroke({ color: 0xedfaa5, width: 1, alpha: 0.32 });
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
  if (model.upperGasFill > 0.01) {
    graphics
      .roundRect(-model.width / 2 + 6, -half + 5, model.width - 12, 2, 1)
      .fill({ color: model.upperGasColor, alpha: 0.5 + model.upperGasFill * 0.28 });
  }
  if (model.lowerGasFill > 0.01) {
    graphics
      .roundRect(-model.width / 2 + 6, half - 7, model.width - 12, 2, 1)
      .fill({ color: model.lowerGasColor, alpha: 0.5 + model.lowerGasFill * 0.28 });
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

const drawIndicators = (graphics: Graphics, model: RoomDrawModel): void => {
  const left = -model.width / 2;
  const top = -model.height / 2;
  if (model.structure === "entry") {
    graphics.poly([left + 20, -16, left - 12, 0, left + 20, 16]).fill({ color: 0xe3785d });
  }
  if (model.reactionIntensity > 0.08) {
    graphics
      .rect(left + 10, top + 10, model.width - 20, model.height - 20)
      .stroke({ color: 0xc1f64a, width: 1.5, alpha: 0.72 });
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
      .stroke({ color: 0xf6a35b, width: 1 + pulse * 1.5, alpha: 0.35 + pulse * 0.35 });
  }
  if (model.occupied > 0) {
    graphics.circle(-left - 12, top + 12, 11).fill({ color: 0xe9584a, alpha: 0.9 });
  }
};

export const drawRoom = (graphics: Graphics, model: RoomDrawModel): void => {
  graphics.clear();
  if (model.structure === "core") {
    drawCoreOverlay(graphics, model);
    return;
  }
  drawHazardGlow(graphics, model);
  drawHullFrame(graphics, model);
  drawRoomShell(graphics, model);
  drawRoomAtmosphere(graphics, model);
  drawRoomLiquid(graphics, model);
  drawIndicators(graphics, model);
};
