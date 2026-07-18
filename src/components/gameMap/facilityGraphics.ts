import { architecturalConnections } from "../../game/world/map";
import type { ArchitecturalConnection, WorldMap } from "../../game/world/map";
import type { Graphics } from "pixi.js";
import type { FacilityPortalState, GridCell } from "../../game/types";
import { WORLD_MARGIN_X, WORLD_MARGIN_Y, mapViewFor, type MapView } from "./mapGeometry";

type FacilityPortal = ArchitecturalConnection;

const drawGeologicalStrata = (graphics: Graphics, map: WorldMap, view: MapView): void => {
  for (let elevation = 7; elevation < map.height; elevation += 10) {
    const y = view.groundY - elevation * view.pixelsPerUnit;
    graphics
      .moveTo(WORLD_MARGIN_X, y)
      .bezierCurveTo(
        view.mapWidth * 0.27,
        y - 18,
        view.mapWidth * 0.7,
        y + 24,
        view.mapWidth - WORLD_MARGIN_X,
        y - 7
      )
      .stroke({ color: 0x527466, width: 1, alpha: 0.12 });
    graphics
      .moveTo(WORLD_MARGIN_X, y + 5)
      .bezierCurveTo(
        view.mapWidth * 0.27,
        y - 13,
        view.mapWidth * 0.7,
        y + 29,
        view.mapWidth - WORLD_MARGIN_X,
        y - 2
      )
      .stroke({ color: 0x020605, width: 3, alpha: 0.16 });
  }
};

const drawRockTexture = (graphics: Graphics, map: WorldMap, view: MapView): void => {
  // Deterministic marks keep the terrain legible without making rendering stateful.
  for (let column = 5; column < map.width; column += 12) {
    for (let elevation = 6; elevation < map.height; elevation += 12) {
      const x = WORLD_MARGIN_X + (column + ((elevation / 8) % 2) * 1.7) * view.pixelsPerUnit;
      const y = view.groundY - elevation * view.pixelsPerUnit;
      graphics
        .moveTo(x - 6, y + 3)
        .lineTo(x, y - 2)
        .lineTo(x + 8, y + 1)
        .stroke({ color: 0x769184, width: 1, alpha: 0.09 });
    }
  }
};

export const drawBackdrop = (graphics: Graphics, map: WorldMap): void => {
  const view = mapViewFor(map);
  graphics.clear();
  graphics.rect(0, 0, view.mapWidth, view.mapHeight).fill({ color: 0x040806 });
  graphics
    .rect(
      WORLD_MARGIN_X,
      WORLD_MARGIN_Y,
      map.width * view.pixelsPerUnit,
      map.height * view.pixelsPerUnit
    )
    .fill({ color: 0x0a1310 });
  const core = view.gridCellMapRect(map.coreAnchor);
  const coreX = core.left + core.width / 2;
  const coreY = core.top + core.height / 2;
  graphics.circle(coreX, coreY, 320).fill({ color: 0xb89b56, alpha: 0.018 });
  graphics.circle(coreX, coreY, 220).fill({ color: 0xb89b56, alpha: 0.025 });
  graphics.circle(coreX, coreY, 130).fill({ color: 0xd2b85f, alpha: 0.03 });
  graphics.circle(WORLD_MARGIN_X + 210, view.groundY - 210, 250).fill({
    color: 0x4b9f8b,
    alpha: 0.018,
  });
  for (let column = 0; column <= map.width; column += 4) {
    const x = WORLD_MARGIN_X + column * view.pixelsPerUnit;
    graphics
      .moveTo(x, WORLD_MARGIN_Y)
      .lineTo(x, view.groundY)
      .stroke({ color: 0x89a397, width: 1, alpha: column % 12 === 0 ? 0.055 : 0.025 });
  }
  for (let elevation = 0; elevation <= map.height; elevation += 4) {
    const y = view.groundY - elevation * view.pixelsPerUnit;
    graphics
      .moveTo(WORLD_MARGIN_X, y)
      .lineTo(view.mapWidth - WORLD_MARGIN_X, y)
      .stroke({ color: 0x89a397, width: 1, alpha: elevation % 12 === 0 ? 0.055 : 0.025 });
  }
  drawGeologicalStrata(graphics, map, view);
  drawRockTexture(graphics, map, view);
  graphics
    .rect(
      WORLD_MARGIN_X,
      WORLD_MARGIN_Y,
      map.width * view.pixelsPerUnit,
      map.height * view.pixelsPerUnit
    )
    .stroke({ color: 0x46685a, width: 1, alpha: 0.5 });
  graphics
    .moveTo(WORLD_MARGIN_X, view.groundY)
    .lineTo(view.mapWidth - WORLD_MARGIN_X, view.groundY)
    .stroke({ color: 0x98ad9f, width: 1.5, alpha: 0.42 });
  const corner = 28;
  for (const [x, y, dx, dy, color] of [
    [WORLD_MARGIN_X, WORLD_MARGIN_Y, 1, 1, 0x54a891],
    [view.mapWidth - WORLD_MARGIN_X, WORLD_MARGIN_Y, -1, 1, 0x629db3],
    [WORLD_MARGIN_X, view.groundY, 1, -1, 0x54a891],
    [view.mapWidth - WORLD_MARGIN_X, view.groundY, -1, -1, 0xd2b85f],
  ] as const) {
    graphics
      .moveTo(x, y + dy * corner)
      .lineTo(x, y)
      .lineTo(x + dx * corner, y)
      .stroke({ color, width: 2, alpha: 0.72 });
  }
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

const drawPortalCut = (graphics: Graphics, view: MapView, gridCell: GridCell): void => {
  const rect = view.gridCellMapRect(gridCell);
  graphics
    .rect(rect.left - 0.6, rect.top - 0.6, rect.width + 1.2, rect.height + 1.2)
    .stroke({ color: 0x607b6f, width: 1, alpha: 0.22 });
};

const drawPortalCuts = (graphics: Graphics, map: WorldMap, view: MapView): void => {
  for (const portal of architecturalConnections(map)) {
    for (const connector of portal.connectorCells) drawPortalCut(graphics, view, connector);
  }
};

export const drawFacilityCorridors = (graphics: Graphics, map: WorldMap): void => {
  const view = mapViewFor(map);
  graphics.clear();
  drawPortalCuts(graphics, map, view);
};
