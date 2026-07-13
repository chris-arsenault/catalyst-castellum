import type { Graphics } from "pixi.js";
import {
  GAS_BUFFERS,
  GAS_SOURCES,
  LIQUID_BUFFERS,
  LIQUID_SOURCES,
  utilityNodeWorldPoint,
} from "../../game/config";
import {
  GAS_BUFFER_IDS,
  GAS_SOURCE_IDS,
  LIQUID_BUFFER_IDS,
  LIQUID_SOURCE_IDS,
  type GameState,
  type WorldPoint,
} from "../../game/types";
import { gasAmountTotal, liquidAmountTotal } from "../../game/simulation";
import { colorNumber, worldToMapPoint } from "./mapGeometry";

const drawTank = (
  graphics: Graphics,
  worldPoint: WorldPoint,
  color: number,
  fill: number
): void => {
  const point = worldToMapPoint(worldPoint);
  graphics
    .roundRect(point.x - 13, point.y - 22, 26, 44, 7)
    .fill({ color: 0x0a1411 })
    .stroke({ color, width: 3, alpha: 0.92 });
  const level = 32 * Math.min(1, fill);
  graphics.rect(point.x - 9, point.y + 16 - level, 18, level).fill({ color, alpha: 0.55 });
  graphics.circle(point.x, point.y - 25, 4).fill({ color, alpha: 0.9 });
};

const drawBuffer = (
  graphics: Graphics,
  worldPoint: WorldPoint,
  color: number,
  fill: number
): void => {
  const point = worldToMapPoint(worldPoint);
  graphics
    .circle(point.x, point.y, 11)
    .fill({ color: 0x0a1411 })
    .stroke({ color, width: 3, alpha: 0.92 });
  graphics.circle(point.x, point.y, 7 * Math.min(1, fill)).fill({ color, alpha: 0.85 });
};

const drawTerminal = (
  graphics: Graphics,
  worldPoint: WorldPoint,
  color: number,
  fill: number,
  pointsUp: boolean
): void => {
  const point = worldToMapPoint(worldPoint);
  graphics
    .rect(point.x - 12, point.y - 12, 24, 24)
    .fill({ color: 0x09120f })
    .stroke({ color, width: 3, alpha: 0.9 });
  graphics.circle(point.x, point.y, 7 * Math.min(1, fill)).fill({ color, alpha: 0.8 });
  const direction = pointsUp ? -1 : 1;
  graphics
    .moveTo(point.x, point.y + direction * 12)
    .lineTo(point.x, point.y + direction * 28)
    .stroke({ color, width: 4, alpha: 0.8 });
};

export const drawProcessNodes = (graphics: Graphics, state: GameState): void => {
  graphics.clear();
  for (const sourceId of GAS_SOURCE_IDS) {
    const definition = GAS_SOURCES[sourceId];
    const fill = gasAmountTotal(state.gasSources[sourceId].gas) / definition.capacity;
    drawTank(graphics, utilityNodeWorldPoint(sourceId), colorNumber(definition.accent), fill);
  }
  for (const sourceId of LIQUID_SOURCE_IDS) {
    const definition = LIQUID_SOURCES[sourceId];
    const fill = liquidAmountTotal(state.liquidSources[sourceId].liquid) / definition.capacity;
    drawTank(graphics, utilityNodeWorldPoint(sourceId), colorNumber(definition.accent), fill);
  }
  for (const bufferId of GAS_BUFFER_IDS) {
    const definition = GAS_BUFFERS[bufferId];
    const fill = gasAmountTotal(state.gasBuffers[bufferId].gas) / definition.capacity;
    drawBuffer(graphics, utilityNodeWorldPoint(bufferId), colorNumber(definition.accent), fill);
  }
  for (const bufferId of LIQUID_BUFFER_IDS) {
    const definition = LIQUID_BUFFERS[bufferId];
    const fill = liquidAmountTotal(state.liquidBuffers[bufferId].liquid) / definition.capacity;
    drawBuffer(graphics, utilityNodeWorldPoint(bufferId), colorNumber(definition.accent), fill);
  }
  drawTerminal(
    graphics,
    utilityNodeWorldPoint("gas_vent"),
    0x79b8bd,
    Math.min(1, gasAmountTotal(state.gasVent) / 80),
    true
  );
  drawTerminal(
    graphics,
    utilityNodeWorldPoint("liquid_drain"),
    0x5a83c0,
    Math.min(1, liquidAmountTotal(state.liquidDrain) / 80),
    false
  );
};
