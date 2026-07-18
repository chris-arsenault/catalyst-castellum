import { architecturalConnections } from "../../game/world/map";
import type { ArchitecturalConnection, WorldMap } from "../../game/world/map";
import type { Graphics } from "pixi.js";
import type { FacilityPortalState } from "../../game/types";
import { WORLD_MARGIN_X, WORLD_MARGIN_Y, mapViewFor, type MapView } from "./mapGeometry";

type FacilityPortal = ArchitecturalConnection;

const drawStationShell = (graphics: Graphics, view: MapView): void => {
  const left = WORLD_MARGIN_X - 18;
  const top = WORLD_MARGIN_Y - 16;
  const width = view.mapWidth - WORLD_MARGIN_X * 2 + 36;
  const height = view.groundY - WORLD_MARGIN_Y + 32;
  graphics.rect(0, 0, view.mapWidth, view.mapHeight).fill({ color: 0x020504 });
  graphics
    .roundRect(left, top, width, height, 46)
    .fill({ color: 0x111b17 })
    .stroke({ color: 0x263a32, width: 9, alpha: 0.92 });
  graphics
    .roundRect(left + 13, top + 13, width - 26, height - 26, 35)
    .fill({ color: 0x07100d })
    .stroke({ color: 0x587066, width: 2, alpha: 0.42 });
  graphics
    .poly([
      left + 36,
      top + 18,
      left + width - 52,
      top + 18,
      left + width - 24,
      top + 45,
      left + 18,
      top + 45,
    ])
    .fill({ color: 0x182720, alpha: 0.86 })
    .stroke({ color: 0x789085, width: 1.5, alpha: 0.36 });
  graphics
    .poly([
      left + 18,
      top + height - 49,
      left + width - 25,
      top + height - 49,
      left + width - 51,
      top + height - 18,
      left + 43,
      top + height - 18,
    ])
    .fill({ color: 0x15231d, alpha: 0.92 })
    .stroke({ color: 0x70877d, width: 1.5, alpha: 0.34 });
};

const drawDistantTank = (
  graphics: Graphics,
  left: number,
  top: number,
  width: number,
  height: number
): void => {
  graphics
    .roundRect(left, top, width, height, Math.min(width, height) * 0.24)
    .fill({ color: 0x0c1713, alpha: 0.9 })
    .stroke({ color: 0x42594f, width: 5, alpha: 0.38 });
  graphics
    .roundRect(left + 8, top + 8, width - 16, height - 16, Math.min(width, height) * 0.2)
    .stroke({ color: 0x82968d, width: 1.5, alpha: 0.16 });
  for (const position of [0.27, 0.72]) {
    const x = left + width * position;
    graphics
      .moveTo(x, top + 5)
      .lineTo(x, top + height - 5)
      .stroke({ color: 0x1d3028, width: 13, alpha: 0.76 });
    graphics
      .moveTo(x - 2, top + 8)
      .lineTo(x - 2, top + height - 8)
      .stroke({ color: 0x71877c, width: 1.5, alpha: 0.24 });
  }
};

const drawDistantPlant = (graphics: Graphics, view: MapView): void => {
  drawDistantTank(graphics, WORLD_MARGIN_X + 74, WORLD_MARGIN_Y + 82, 248, 164);
  drawDistantTank(graphics, view.mapWidth - WORLD_MARGIN_X - 298, WORLD_MARGIN_Y + 62, 222, 136);
  drawDistantTank(graphics, view.mapWidth * 0.41, view.groundY - 196, 184, 126);
};

const drawStationRibs = (graphics: Graphics, view: MapView): void => {
  const top = WORLD_MARGIN_Y + 23;
  const bottom = view.groundY - 24;
  for (const fraction of [0.12, 0.39, 0.68, 0.9]) {
    const x = WORLD_MARGIN_X + (view.mapWidth - WORLD_MARGIN_X * 2) * fraction;
    graphics
      .moveTo(x - 24, top)
      .bezierCurveTo(x - 47, top + 116, x - 45, bottom - 112, x - 18, bottom)
      .stroke({ color: 0x172720, width: 22, alpha: 0.82 });
    graphics
      .moveTo(x - 28, top + 5)
      .bezierCurveTo(x - 48, top + 118, x - 46, bottom - 110, x - 22, bottom - 5)
      .stroke({ color: 0x6e857a, width: 2, alpha: 0.23 });
    graphics
      .rect(x - 39, top - 2, 27, 12)
      .fill({ color: 0x283b33, alpha: 0.9 })
      .stroke({ color: 0x82968d, width: 1, alpha: 0.25 });
  }
};

const drawStationServices = (graphics: Graphics, view: MapView): void => {
  const upperY = WORLD_MARGIN_Y + 105;
  const lowerY = view.groundY - 96;
  for (const [y, color] of [
    [upperY, 0x8a6848],
    [lowerY, 0x557e72],
  ] as const) {
    graphics
      .moveTo(WORLD_MARGIN_X + 22, y)
      .bezierCurveTo(
        view.mapWidth * 0.31,
        y - 17,
        view.mapWidth * 0.68,
        y + 23,
        view.mapWidth - 58,
        y
      )
      .stroke({ color: 0x020605, width: 11, alpha: 0.84 });
    graphics
      .moveTo(WORLD_MARGIN_X + 22, y - 1)
      .bezierCurveTo(
        view.mapWidth * 0.31,
        y - 18,
        view.mapWidth * 0.68,
        y + 22,
        view.mapWidth - 58,
        y - 1
      )
      .stroke({ color, width: 3, alpha: 0.38 });
  }
  graphics
    .moveTo(view.mapWidth * 0.29, WORLD_MARGIN_Y + 26)
    .bezierCurveTo(
      view.mapWidth * 0.33,
      WORLD_MARGIN_Y + 118,
      view.mapWidth * 0.25,
      WORLD_MARGIN_Y + 144,
      view.mapWidth * 0.32,
      WORLD_MARGIN_Y + 218
    )
    .stroke({ color: 0x8f7650, width: 2.5, alpha: 0.4 });
};

const drawStationDamage = (graphics: Graphics, view: MapView): void => {
  const breachX = view.mapWidth - WORLD_MARGIN_X - 156;
  const breachY = WORLD_MARGIN_Y + 19;
  graphics
    .poly([
      breachX,
      breachY,
      breachX + 52,
      breachY - 13,
      breachX + 111,
      breachY + 5,
      breachX + 94,
      breachY + 47,
      breachX + 31,
      breachY + 41,
    ])
    .fill({ color: 0x010302 })
    .stroke({ color: 0x4d5f57, width: 3, alpha: 0.7 });
  for (const [dx, dy, radius] of [
    [24, 12, 1.2],
    [52, 25, 0.9],
    [76, 11, 1.4],
    [91, 31, 0.8],
  ] as const) {
    graphics.circle(breachX + dx, breachY + dy, radius).fill({ color: 0xdce9e3, alpha: 0.72 });
  }
  graphics
    .moveTo(breachX + 18, breachY + 39)
    .bezierCurveTo(
      breachX + 4,
      breachY + 74,
      breachX + 42,
      breachY + 80,
      breachX + 27,
      breachY + 113
    )
    .stroke({ color: 0x9a6948, width: 2.2, alpha: 0.58 });
};

export const drawBackdrop = (graphics: Graphics, map: WorldMap): void => {
  const view = mapViewFor(map);
  graphics.clear();
  drawStationShell(graphics, view);
  drawDistantPlant(graphics, view);
  drawStationRibs(graphics, view);
  drawStationServices(graphics, view);
  drawStationDamage(graphics, view);
  const core = view.gridCellMapRect(map.coreAnchor);
  const coreX = core.left + core.width / 2;
  const coreY = core.top + core.height / 2;
  graphics.circle(coreX, coreY, 270).fill({ color: 0xb89b56, alpha: 0.018 });
  graphics.circle(coreX, coreY, 170).fill({ color: 0xd2b85f, alpha: 0.024 });
};

const drawPortalFlowArrow = (
  graphics: Graphics,
  view: MapView,
  portal: FacilityPortal,
  flow: number,
  color: number,
  offset: number
): void => {
  if (Math.abs(flow) < 0.001) return;
  const fromRect = view.gridCellMapRect(flow > 0 ? portal.endpoints[0] : portal.endpoints[1]);
  const toRect = view.gridCellMapRect(flow > 0 ? portal.endpoints[1] : portal.endpoints[0]);
  const from = { x: fromRect.left + fromRect.width / 2, y: fromRect.top + fromRect.height / 2 };
  const to = { x: toRect.left + toRect.width / 2, y: toRect.top + toRect.height / 2 };
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  if (length <= 0) return;
  const unit = { x: (to.x - from.x) / length, y: (to.y - from.y) / length };
  const perpendicular = { x: -unit.y, y: unit.x };
  const midpoint = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  const start = {
    x: midpoint.x - unit.x * 8 + perpendicular.x * offset,
    y: midpoint.y - unit.y * 8 + perpendicular.y * offset,
  };
  const end = {
    x: midpoint.x + unit.x * 8 + perpendicular.x * offset,
    y: midpoint.y + unit.y * 8 + perpendicular.y * offset,
  };
  graphics
    .moveTo(start.x, start.y)
    .lineTo(end.x, end.y)
    .stroke({
      color,
      width: Math.min(4, 1.5 + Math.sqrt(Math.abs(flow))),
      alpha: 0.92,
    });
  graphics
    .poly([
      end.x,
      end.y,
      end.x - unit.x * 5 + perpendicular.x * 3,
      end.y - unit.y * 5 + perpendicular.y * 3,
      end.x - unit.x * 5 - perpendicular.x * 3,
      end.y - unit.y * 5 - perpendicular.y * 3,
    ])
    .fill({ color, alpha: 0.92 });
};

const drawPortalFlows = (
  graphics: Graphics,
  view: MapView,
  portal: FacilityPortal,
  portalState: FacilityPortalState | undefined
): void => {
  if (!portalState || portalState.sealed || !portalState.open) return;
  drawPortalFlowArrow(graphics, view, portal, portalState.lastGasFlow, 0x6ad9b4, -3);
  drawPortalFlowArrow(graphics, view, portal, portalState.lastLiquidFlow, 0x50b7f6, 3);
};

export const drawFacilityPortalFlows = (
  graphics: Graphics,
  map: WorldMap,
  portalStates: Readonly<Record<string, FacilityPortalState>>
): void => {
  const view = mapViewFor(map);
  graphics.clear();
  for (const portal of architecturalConnections(map)) {
    const state = portalStates[portal.id];
    drawPortalFlows(graphics, view, portal, state);
  }
};
