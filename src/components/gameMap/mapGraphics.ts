import type { Graphics } from "pixi.js";
import { CONNECTIONS, ROOM_DEFINITIONS } from "../../game/config";
import type { EnemyType, RoomAnalysis, RoomDefinition } from "../../game/types";

export const MAP_WIDTH = 1120;
export const MAP_HEIGHT = 560;

export const colorNumber = (color: string): number => Number.parseInt(color.replace("#", ""), 16);

export const roomDimensions = (kind: RoomDefinition["kind"]): { width: number; height: number } => {
  if (kind === "core") return { width: 126, height: 126 };
  if (kind === "spawn") return { width: 112, height: 74 };
  return { width: 142, height: 96 };
};

export const drawBackdrop = (graphics: Graphics): void => {
  graphics.clear();
  graphics.rect(0, 0, MAP_WIDTH, MAP_HEIGHT).fill({ color: 0x091310 });
  for (let x = 18; x < MAP_WIDTH; x += 34) {
    graphics.moveTo(x, 0).lineTo(x, MAP_HEIGHT).stroke({ color: 0x17302a, width: 1, alpha: 0.34 });
  }
  for (let y = 16; y < MAP_HEIGHT; y += 34) {
    graphics.moveTo(0, y).lineTo(MAP_WIDTH, y).stroke({ color: 0x17302a, width: 1, alpha: 0.34 });
  }
  graphics
    .roundRect(17, 16, MAP_WIDTH - 34, MAP_HEIGHT - 32, 18)
    .stroke({ color: 0x29443c, width: 1, alpha: 0.6 });
  graphics
    .moveTo(31, 52)
    .lineTo(31, 31)
    .lineTo(52, 31)
    .stroke({ color: 0x70a091, width: 2, alpha: 0.7 });
  graphics
    .moveTo(MAP_WIDTH - 31, MAP_HEIGHT - 52)
    .lineTo(MAP_WIDTH - 31, MAP_HEIGHT - 31)
    .lineTo(MAP_WIDTH - 52, MAP_HEIGHT - 31)
    .stroke({ color: 0x70a091, width: 2, alpha: 0.7 });
};

const drawDirectionMarker = (
  graphics: Graphics,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
) => {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const x = fromX + (toX - fromX) * 0.52;
  const y = fromY + (toY - fromY) * 0.52;
  const size = 8;
  graphics
    .poly([
      x + Math.cos(angle) * size,
      y + Math.sin(angle) * size,
      x + Math.cos(angle + 2.45) * size,
      y + Math.sin(angle + 2.45) * size,
      x + Math.cos(angle - 2.45) * size,
      y + Math.sin(angle - 2.45) * size,
    ])
    .fill({ color: 0x91c9b8, alpha: 0.72 });
};

export const drawPipeNetwork = (graphics: Graphics): void => {
  graphics.clear();
  for (const connection of CONNECTIONS) {
    const from = ROOM_DEFINITIONS[connection.from].position;
    const to = ROOM_DEFINITIONS[connection.to].position;
    graphics.moveTo(from.x, from.y).lineTo(to.x, to.y).stroke({ color: 0x06100d, width: 18 });
    graphics.moveTo(from.x, from.y).lineTo(to.x, to.y).stroke({ color: 0x355d52, width: 10 });
    graphics
      .moveTo(from.x, from.y - 2)
      .lineTo(to.x, to.y - 2)
      .stroke({ color: 0x77ad9e, width: 2, alpha: 0.42 });
    drawDirectionMarker(graphics, from.x, from.y, to.x, to.y);
  }
};

export interface RoomDrawModel {
  width: number;
  height: number;
  kind: RoomDefinition["kind"];
  selected: boolean;
  analysis: RoomAnalysis;
  dominantColor: number;
  liquidColor: number;
  sealTimer: number;
  occupied: number;
  coreIntegrity: number;
}

const drawHazardGlow = (graphics: Graphics, model: RoomDrawModel): void => {
  if (model.analysis.hazard < 32) return;
  const color = model.analysis.hazard >= 65 ? 0xd4ed55 : 0xd3a955;
  const width = model.analysis.hazard >= 65 ? 4 : 2;
  graphics
    .roundRect(-model.width / 2 - 7, -model.height / 2 - 7, model.width + 14, model.height + 14, 19)
    .stroke({ color, width, alpha: 0.18 + model.analysis.hazard / 260 });
};

const roomBorderColor = (model: RoomDrawModel): number => {
  if (model.selected) return 0xe5efb0;
  if (model.kind === "core") return 0xcdbf74;
  return 0x4b7468;
};

const drawRoomShell = (graphics: Graphics, model: RoomDrawModel): void => {
  const left = -model.width / 2;
  const top = -model.height / 2;
  graphics
    .roundRect(left, top, model.width, model.height, model.kind === "core" ? 24 : 14)
    .fill({ color: 0x101d19 })
    .stroke({ color: roomBorderColor(model), width: model.selected ? 3 : 2, alpha: 0.9 });
  graphics
    .roundRect(left + 5, top + 5, model.width - 10, model.height - 10, 10)
    .fill({ color: model.dominantColor, alpha: 0.1 + model.analysis.dominantGasPercent * 0.18 });
};

const drawRoomLiquid = (graphics: Graphics, model: RoomDrawModel): void => {
  if (model.analysis.liquidTotal <= 0.5 || model.kind !== "chamber") return;
  const left = -model.width / 2;
  const top = -model.height / 2;
  const fillHeight = Math.min(
    model.height - 10,
    (model.height - 10) * (model.analysis.liquidTotal / 100)
  );
  const surface = top + model.height - 5 - fillHeight;
  graphics
    .rect(left + 5, surface, model.width - 10, fillHeight)
    .fill({ color: model.liquidColor, alpha: 0.36 });
  graphics
    .moveTo(left + 7, surface)
    .lineTo(left + model.width - 7, surface)
    .stroke({ color: model.liquidColor, width: 2, alpha: 0.82 });
};

const coreIntegrityColor = (integrity: number): number => {
  if (integrity > 0.5) return 0xdce88b;
  if (integrity > 0.25) return 0xe0a253;
  return 0xdf655d;
};

const drawCore = (graphics: Graphics, model: RoomDrawModel): void => {
  if (model.kind !== "core") return;
  const integrity = model.coreIntegrity / 100;
  graphics.circle(0, 8, 34).stroke({ color: 0x314f47, width: 9, alpha: 0.95 });
  graphics
    .arc(0, 8, 34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * integrity)
    .stroke({ color: coreIntegrityColor(integrity), width: 9 });
  graphics.circle(0, 8, 19).fill({ color: 0xdfe8a0, alpha: 0.13 });
  graphics.circle(0, 8, 7).fill({ color: 0xf0f4c0, alpha: 0.9 });
};

const drawRoomIndicators = (graphics: Graphics, model: RoomDrawModel): void => {
  const left = -model.width / 2;
  const top = -model.height / 2;
  if (model.kind === "spawn") {
    graphics
      .poly([left + 10, -12, left - 7, 0, left + 10, 12])
      .fill({ color: 0xc97762, alpha: 0.9 });
  }
  if (model.sealTimer > 0) {
    graphics
      .roundRect(left + 7, top + 7, model.width - 14, model.height - 14, 8)
      .stroke({ color: 0xe3c86e, width: 2, alpha: 0.92 });
    graphics.rect(model.width / 2 - 28, top - 5, 21, 11).fill({ color: 0xe3c86e, alpha: 0.95 });
  }
  if (model.occupied > 0) {
    graphics.circle(model.width / 2 - 7, top + 7, 14).fill({ color: 0xd16c62 });
    graphics
      .circle(model.width / 2 - 7, top + 7, 17)
      .stroke({ color: 0xf3a38e, width: 1, alpha: 0.7 });
  }
};

export const drawRoom = (graphics: Graphics, model: RoomDrawModel): void => {
  graphics.clear();
  drawHazardGlow(graphics, model);
  drawRoomShell(graphics, model);
  drawRoomLiquid(graphics, model);
  drawCore(graphics, model);
  drawRoomIndicators(graphics, model);
};

const drawFloater = (graphics: Graphics, color: number): void => {
  graphics.circle(0, -2, 13).fill({ color });
  graphics.circle(-10, -4, 6).fill({ color, alpha: 0.65 });
  graphics.circle(10, -4, 6).fill({ color, alpha: 0.65 });
  graphics.moveTo(-7, 8).lineTo(-11, 17).stroke({ color, width: 2, alpha: 0.8 });
  graphics.moveTo(7, 8).lineTo(11, 17).stroke({ color, width: 2, alpha: 0.8 });
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
      graphics.circle(-13, -5, 7).stroke({ color: 0xf2b2a5, width: 3, alpha: 0.9 });
      graphics.circle(13, -5, 7).stroke({ color: 0xf2b2a5, width: 3, alpha: 0.9 });
      return;
    case "skimmer":
      graphics.poly([-18, 8, -11, -8, 14, -5, 19, 3, 7, 11]).fill({ color });
      return;
    case "crawler":
      graphics.ellipse(0, 0, 16, 11).fill({ color });
      graphics.circle(12, -3, 7).fill({ color: 0xe2c995 });
  }
};

const healthColor = (health: number): number => {
  if (health > 0.5) return 0xcbdc6d;
  if (health > 0.25) return 0xe5a35a;
  return 0xdf5f58;
};

export const drawEnemy = (
  graphics: Graphics,
  type: EnemyType,
  color: number,
  health: number
): void => {
  graphics.clear();
  graphics.ellipse(0, 10, 17, 7).fill({ color: 0x020806, alpha: 0.52 });
  drawEnemyShape(graphics, type, color);
  graphics.circle(9, -5, 2).fill({ color: 0x251713 });
  graphics.roundRect(-18, -24, 36, 4, 2).fill({ color: 0x14201c, alpha: 0.95 });
  graphics.roundRect(-18, -24, 36 * health, 4, 2).fill({ color: healthColor(health) });
};
