import type { Graphics } from "pixi.js";
import { coreDamageProfile } from "./coreDamageModel";

export type CoreReservoirId = "gas_header" | "water" | "brine";

export interface CoreReservoirDrawModel {
  available: boolean;
  color: number;
  fill: number;
  id: CoreReservoirId;
}

export interface CoreDrawModel {
  coreIntegrity: number;
  coreReservoirs: readonly CoreReservoirDrawModel[];
  elapsed: number;
  height: number;
  selected: boolean;
  width: number;
}

interface DrawRect {
  height: number;
  left: number;
  top: number;
  width: number;
}

const reservoir = (model: CoreDrawModel, id: CoreReservoirId): CoreReservoirDrawModel =>
  model.coreReservoirs.find((candidate) => candidate.id === id) ?? {
    available: false,
    color: 0x385047,
    fill: 0,
    id,
  };

const drawReservoirFill = (
  graphics: Graphics,
  source: CoreReservoirDrawModel,
  rect: DrawRect,
  gas: boolean
): void => {
  const inner = {
    left: rect.left + 6,
    top: rect.top + 7,
    width: rect.width - 12,
    height: rect.height - 14,
  };
  const fill = source.available ? Math.max(0, Math.min(1, source.fill)) : 0;
  const fillHeight = inner.height * fill;
  if (fillHeight <= 0.5) return;
  const surface = inner.top + inner.height - fillHeight;
  graphics
    .roundRect(inner.left, surface, inner.width, fillHeight, 3)
    .fill({ color: source.color, alpha: gas ? 0.42 : 0.64 });
  graphics
    .moveTo(inner.left + 2, surface)
    .lineTo(inner.left + inner.width - 2, surface)
    .stroke({ color: source.color, width: 1.5, alpha: 0.96 });
  graphics
    .moveTo(inner.left + 3, surface + 3)
    .lineTo(inner.left + inner.width * 0.62, surface + 3)
    .stroke({ color: 0xeafff7, width: 1, alpha: 0.2 });
  if (!gas) return;
  for (const [x, y, radius] of [
    [0.28, 0.68, 2.5],
    [0.57, 0.48, 3.2],
    [0.73, 0.76, 2],
  ] as const) {
    graphics
      .circle(inner.left + inner.width * x, inner.top + inner.height * y, radius)
      .stroke({ color: source.color, width: 1, alpha: 0.72 });
  }
};

const drawIntegritySegments = (graphics: Graphics, model: CoreDrawModel): void => {
  const profile = coreDamageProfile(model.coreIntegrity);
  const left = model.width / 2 - 91;
  const top = -model.height / 2 + 24;
  const filled = Math.ceil(profile.integrity * 10);
  for (let index = 0; index < 10; index += 1) {
    graphics.rect(left + 7 + index * 6, top + 23, 4, 5).fill({
      color: index < filled ? profile.alarmColor : 0x29372f,
      alpha: index < filled ? 0.95 : 0.7,
    });
  }
};

export const drawCoreOverlay = (graphics: Graphics, model: CoreDrawModel): void => {
  const left = -model.width / 2;
  const top = -model.height / 2;
  drawReservoirFill(
    graphics,
    reservoir(model, "gas_header"),
    { left: left + 27, top: top + 35, width: 76, height: 61 },
    true
  );
  drawReservoirFill(
    graphics,
    reservoir(model, "water"),
    { left: left + 27, top: 15, width: 35, height: 74 },
    false
  );
  drawReservoirFill(
    graphics,
    reservoir(model, "brine"),
    { left: left + 68, top: 15, width: 35, height: 74 },
    false
  );
  drawIntegritySegments(graphics, model);
};
