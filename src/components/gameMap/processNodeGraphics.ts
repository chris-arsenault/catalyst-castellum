import type { Graphics } from "pixi.js";
import { type GameState, type WorldPoint } from "../../game/types";
import { colorNumber, mapViewFor } from "./mapGeometry";
import type { MapView } from "./mapGeometry";
import { gridCellToWorldPoint } from "../../game/spatial";
import { instance } from "../../game/world/instances";
import type { FacilityUtilityNodeId } from "../../game/types";
import type { SupplyCardCopy } from "../../presentation/supplyCopy";
import { gasAmountTotal, liquidAmountTotal } from "../../game/queries";

const drawTank = (
  graphics: Graphics,
  view: MapView,
  worldPoint: WorldPoint,
  color: number,
  fill: number
): void => {
  const point = view.worldToMapPoint(worldPoint);
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
  view: MapView,
  worldPoint: WorldPoint,
  color: number,
  fill: number,
  pointsUp: boolean
): void => {
  const point = view.worldToMapPoint(worldPoint);
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

export const drawProcessNodes = (
  graphics: Graphics,
  state: GameState,
  supplies: readonly SupplyCardCopy[]
): void => {
  const view = mapViewFor(state.map);
  const nodeWorldPoint = (nodeId: FacilityUtilityNodeId): WorldPoint =>
    gridCellToWorldPoint(instance(state.map.utilityNodes, nodeId, "utility node").cell);
  graphics.clear();
  for (const supply of supplies) {
    drawTank(
      graphics,
      view,
      nodeWorldPoint(supply.id),
      colorNumber(supply.accent),
      supply.amount / supply.capacity
    );
  }
  drawTerminal(
    graphics,
    view,
    nodeWorldPoint("gas_vent"),
    0x69c5cd,
    Math.min(1, gasAmountTotal(state.gasVent) / 80),
    true
  );
  drawTerminal(
    graphics,
    view,
    nodeWorldPoint("liquid_drain"),
    0x548ada,
    Math.min(1, liquidAmountTotal(state.liquidDrain) / 80),
    false
  );
};
