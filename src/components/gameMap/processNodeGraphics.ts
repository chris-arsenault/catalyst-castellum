import type { Graphics } from "pixi.js";
import { GAS_SOURCES, LIQUID_SOURCES, utilityNodeWorldPoint } from "../../game/config";
import {
  GAS_SOURCE_IDS,
  LIQUID_SOURCE_IDS,
  type GameState,
  type WorldPoint,
} from "../../game/types";
import { gasAmountTotal, liquidAmountTotal } from "../../game/queries";
import { colorNumber, worldToMapPoint } from "./mapGeometry";

const drawTank = (
  graphics: Graphics,
  worldPoint: WorldPoint,
  color: number,
  fill: number
): void => {
  const point = worldToMapPoint(worldPoint);
  graphics
    .roundRect(point.x - 11, point.y - 20, 22, 40, 9)
    .fill({ color: 0x09110f })
    .stroke({ color: 0x57766a, width: 1, alpha: 0.82 });
  const level = 32 * Math.min(1, fill);
  graphics.roundRect(point.x - 7, point.y + 16 - level, 14, level, 4).fill({ color, alpha: 0.48 });
  graphics
    .moveTo(point.x - 6, point.y + 16 - level)
    .lineTo(point.x + 6, point.y + 16 - level)
    .stroke({ color, width: 1, alpha: 0.9 });
  graphics.circle(point.x, point.y - 23, 2.5).fill({ color, alpha: 0.9 });
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
    .roundRect(point.x - 10, point.y - 10, 20, 20, 6)
    .fill({ color: 0x09120f })
    .stroke({ color: 0x57766a, width: 1, alpha: 0.82 });
  graphics.circle(point.x, point.y, 6 * Math.min(1, fill)).fill({ color, alpha: 0.72 });
  const direction = pointsUp ? -1 : 1;
  graphics
    .moveTo(point.x, point.y + direction * 10)
    .lineTo(point.x, point.y + direction * 24)
    .stroke({ color, width: 1.5, alpha: 0.72 });
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
  drawTerminal(
    graphics,
    utilityNodeWorldPoint("gas_vent"),
    0x69c5cd,
    Math.min(1, gasAmountTotal(state.gasVent) / 80),
    true
  );
  drawTerminal(
    graphics,
    utilityNodeWorldPoint("liquid_drain"),
    0x548ada,
    Math.min(1, liquidAmountTotal(state.liquidDrain) / 80),
    false
  );
};
