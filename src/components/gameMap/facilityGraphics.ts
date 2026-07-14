import type { Graphics } from "pixi.js";
import { FACILITY_MAP, facilityCells } from "../../presentation/defaultGame";
import type { FacilityPortalState, GridCell } from "../../game/types";
import {
  WORLD_GROUND_Y,
  WORLD_MAP_HEIGHT,
  WORLD_MAP_WIDTH,
  WORLD_MARGIN_X,
  WORLD_MARGIN_Y,
  WORLD_PIXELS_PER_UNIT,
  gridCellMapRect,
} from "./mapGeometry";

type FacilityPortal = (typeof FACILITY_MAP.portals)[number];

const drawGeologicalStrata = (graphics: Graphics): void => {
  for (let elevation = 7; elevation < FACILITY_MAP.height; elevation += 10) {
    const y = WORLD_GROUND_Y - elevation * WORLD_PIXELS_PER_UNIT;
    graphics
      .moveTo(WORLD_MARGIN_X, y)
      .bezierCurveTo(
        WORLD_MAP_WIDTH * 0.27,
        y - 18,
        WORLD_MAP_WIDTH * 0.7,
        y + 24,
        WORLD_MAP_WIDTH - WORLD_MARGIN_X,
        y - 7
      )
      .stroke({ color: 0x527466, width: 1, alpha: 0.12 });
    graphics
      .moveTo(WORLD_MARGIN_X, y + 5)
      .bezierCurveTo(
        WORLD_MAP_WIDTH * 0.27,
        y - 13,
        WORLD_MAP_WIDTH * 0.7,
        y + 29,
        WORLD_MAP_WIDTH - WORLD_MARGIN_X,
        y - 2
      )
      .stroke({ color: 0x020605, width: 3, alpha: 0.16 });
  }
};

const drawRockTexture = (graphics: Graphics): void => {
  // Deterministic marks keep the terrain legible without making rendering stateful.
  for (let column = 5; column < FACILITY_MAP.width; column += 12) {
    for (let elevation = 6; elevation < FACILITY_MAP.height; elevation += 12) {
      const x = WORLD_MARGIN_X + (column + ((elevation / 8) % 2) * 1.7) * WORLD_PIXELS_PER_UNIT;
      const y = WORLD_GROUND_Y - elevation * WORLD_PIXELS_PER_UNIT;
      graphics
        .moveTo(x - 6, y + 3)
        .lineTo(x, y - 2)
        .lineTo(x + 8, y + 1)
        .stroke({ color: 0x769184, width: 1, alpha: 0.09 });
    }
  }
};

export const drawBackdrop = (graphics: Graphics): void => {
  graphics.clear();
  graphics.rect(0, 0, WORLD_MAP_WIDTH, WORLD_MAP_HEIGHT).fill({ color: 0x040806 });
  graphics
    .rect(
      WORLD_MARGIN_X,
      WORLD_MARGIN_Y,
      FACILITY_MAP.width * WORLD_PIXELS_PER_UNIT,
      FACILITY_MAP.height * WORLD_PIXELS_PER_UNIT
    )
    .fill({ color: 0x0a1310 });
  const core = gridCellMapRect(FACILITY_MAP.coreAnchor);
  const coreX = core.left + core.width / 2;
  const coreY = core.top + core.height / 2;
  graphics.circle(coreX, coreY, 320).fill({ color: 0xb89b56, alpha: 0.018 });
  graphics.circle(coreX, coreY, 220).fill({ color: 0xb89b56, alpha: 0.025 });
  graphics.circle(coreX, coreY, 130).fill({ color: 0xd2b85f, alpha: 0.03 });
  graphics.circle(WORLD_MARGIN_X + 210, WORLD_GROUND_Y - 210, 250).fill({
    color: 0x4b9f8b,
    alpha: 0.018,
  });
  for (let column = 0; column <= FACILITY_MAP.width; column += 4) {
    const x = WORLD_MARGIN_X + column * WORLD_PIXELS_PER_UNIT;
    graphics
      .moveTo(x, WORLD_MARGIN_Y)
      .lineTo(x, WORLD_GROUND_Y)
      .stroke({ color: 0x89a397, width: 1, alpha: column % 12 === 0 ? 0.055 : 0.025 });
  }
  for (let elevation = 0; elevation <= FACILITY_MAP.height; elevation += 4) {
    const y = WORLD_GROUND_Y - elevation * WORLD_PIXELS_PER_UNIT;
    graphics
      .moveTo(WORLD_MARGIN_X, y)
      .lineTo(WORLD_MAP_WIDTH - WORLD_MARGIN_X, y)
      .stroke({ color: 0x89a397, width: 1, alpha: elevation % 12 === 0 ? 0.055 : 0.025 });
  }
  drawGeologicalStrata(graphics);
  drawRockTexture(graphics);
  graphics
    .rect(
      WORLD_MARGIN_X,
      WORLD_MARGIN_Y,
      FACILITY_MAP.width * WORLD_PIXELS_PER_UNIT,
      FACILITY_MAP.height * WORLD_PIXELS_PER_UNIT
    )
    .stroke({ color: 0x46685a, width: 1, alpha: 0.5 });
  graphics
    .moveTo(WORLD_MARGIN_X, WORLD_GROUND_Y)
    .lineTo(WORLD_MAP_WIDTH - WORLD_MARGIN_X, WORLD_GROUND_Y)
    .stroke({ color: 0x98ad9f, width: 1.5, alpha: 0.42 });
  const corner = 28;
  for (const [x, y, dx, dy, color] of [
    [WORLD_MARGIN_X, WORLD_MARGIN_Y, 1, 1, 0x54a891],
    [WORLD_MAP_WIDTH - WORLD_MARGIN_X, WORLD_MARGIN_Y, -1, 1, 0x629db3],
    [WORLD_MARGIN_X, WORLD_GROUND_Y, 1, -1, 0x54a891],
    [WORLD_MAP_WIDTH - WORLD_MARGIN_X, WORLD_GROUND_Y, -1, -1, 0xd2b85f],
  ] as const) {
    graphics
      .moveTo(x, y + dy * corner)
      .lineTo(x, y)
      .lineTo(x + dx * corner, y)
      .stroke({ color, width: 2, alpha: 0.72 });
  }
};

const drawLadderCell = (graphics: Graphics, gridCell: GridCell): void => {
  const rect = gridCellMapRect(gridCell);
  const leftRail = rect.left + rect.width * 0.25;
  const rightRail = rect.left + rect.width * 0.75;
  graphics
    .rect(rect.left + 2, rect.top - 1, rect.width - 4, rect.height + 2)
    .fill({ color: 0x050907, alpha: 0.58 });
  graphics
    .moveTo(leftRail + 2, rect.top)
    .lineTo(leftRail + 2, rect.top + rect.height)
    .moveTo(rightRail + 2, rect.top)
    .lineTo(rightRail + 2, rect.top + rect.height)
    .stroke({ color: 0x090704, width: 3, alpha: 0.56 });
  graphics
    .moveTo(leftRail, rect.top - 1)
    .lineTo(leftRail, rect.top + rect.height + 1)
    .moveTo(rightRail, rect.top - 1)
    .lineTo(rightRail, rect.top + rect.height + 1)
    .stroke({ color: 0xd6af61, width: 1.6, alpha: 0.9 });
  for (const y of [rect.top + 3, rect.top + rect.height / 2, rect.top + rect.height - 3]) {
    graphics
      .moveTo(leftRail, y)
      .lineTo(rightRail, y)
      .stroke({ color: 0xe9ca83, width: 1.2, alpha: 0.82 });
  }
};

const drawPlatformCell = (graphics: Graphics, gridCell: GridCell): void => {
  const rect = gridCellMapRect(gridCell);
  graphics
    .rect(rect.left + 2, rect.top + 3, rect.width, rect.height)
    .fill({ color: 0x020504, alpha: 0.42 });
  graphics
    .roundRect(rect.left, rect.top, rect.width, rect.height, 2)
    .fill({ color: 0x243d34 })
    .stroke({ color: 0x739486, width: 1, alpha: 0.72 });
  graphics
    .poly([
      rect.left,
      rect.top,
      rect.left + 4,
      rect.top - 4,
      rect.left + rect.width + 4,
      rect.top - 4,
      rect.left + rect.width,
      rect.top,
    ])
    .fill({ color: 0x9ab7a8, alpha: 0.7 });
  graphics
    .moveTo(rect.left + 2, rect.top + rect.height - 2)
    .lineTo(rect.left + rect.width - 2, rect.top + 2)
    .moveTo(rect.left + 2, rect.top + 2)
    .lineTo(rect.left + rect.width - 2, rect.top + rect.height - 2)
    .stroke({ color: 0x16251f, width: 1, alpha: 0.56 });
};

const drawCoreShellCell = (graphics: Graphics, gridCell: GridCell): void => {
  const rect = gridCellMapRect(gridCell);
  graphics
    .rect(rect.left, rect.top, rect.width, rect.height)
    .fill({ color: 0x2b3025, alpha: 0.94 })
    .stroke({ color: 0xa99a61, width: 1, alpha: 0.58 });
  graphics
    .moveTo(rect.left + 3, rect.top + rect.height - 3)
    .lineTo(rect.left + rect.width - 3, rect.top + 3)
    .stroke({ color: 0x746a3f, width: 1.2, alpha: 0.7 });
};

const drawPortalFlowArrow = (
  graphics: Graphics,
  portal: FacilityPortal,
  flow: number,
  color: number,
  offset: number
): void => {
  if (Math.abs(flow) < 0.001) return;
  const fromRect = gridCellMapRect(flow > 0 ? portal.endpoints[0] : portal.endpoints[1]);
  const toRect = gridCellMapRect(flow > 0 ? portal.endpoints[1] : portal.endpoints[0]);
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
  portal: FacilityPortal,
  portalState: FacilityPortalState | undefined
): void => {
  if (!portalState || portalState.sealed || !portalState.open) return;
  drawPortalFlowArrow(graphics, portal, portalState.lastGasFlow, 0x6ad9b4, -3);
  drawPortalFlowArrow(graphics, portal, portalState.lastLiquidFlow, 0x50b7f6, 3);
};

const portalOpen = (portal: FacilityPortal, state: FacilityPortalState | undefined): boolean =>
  state?.open ?? portal.defaultOpen;

const openDoorX = (door: GridCell, rect: ReturnType<typeof gridCellMapRect>): number => {
  if (door.column % 2 === 0) return rect.left + 2;
  return rect.left + rect.width - 5;
};

const drawDoorPortal = (
  graphics: Graphics,
  portal: FacilityPortal,
  state: FacilityPortalState | undefined
): void => {
  const open = portalOpen(portal, state);
  for (const door of portal.connectorCells) {
    const rect = gridCellMapRect(door);
    const width = open ? 3 : rect.width - 4;
    const x = open ? openDoorX(door, rect) : rect.left + 2;
    graphics
      .roundRect(x, rect.top + 1, width, rect.height - 2, 2)
      .fill({ color: 0x101814, alpha: 0.95 })
      .stroke({ color: 0xd78562, width: 1.5, alpha: 0.92 });
  }
};

const drawTrapdoorCell = (graphics: Graphics, trapdoor: GridCell, open: boolean): void => {
  const rect = gridCellMapRect(trapdoor);
  if (open) {
    graphics
      .moveTo(rect.left, rect.top)
      .lineTo(rect.left + 4, rect.top + rect.height)
      .moveTo(rect.left + rect.width, rect.top)
      .lineTo(rect.left + rect.width - 4, rect.top + rect.height)
      .stroke({ color: 0xd78562, width: 1.5, alpha: 0.88 });
    return;
  }
  graphics
    .rect(rect.left, rect.top + 5, rect.width, rect.height - 10)
    .fill({ color: 0x2b3c34 })
    .stroke({ color: 0xd78562, width: 1.25, alpha: 0.88 });
};

const drawTrapdoorPortal = (
  graphics: Graphics,
  portal: FacilityPortal,
  state: FacilityPortalState | undefined
): void => {
  const open = portalOpen(portal, state);
  for (const trapdoor of portal.connectorCells) drawTrapdoorCell(graphics, trapdoor, open);
};

export const drawFacilityDoors = (
  graphics: Graphics,
  portalStates: Readonly<Record<string, FacilityPortalState>>
): void => {
  graphics.clear();
  for (const portal of FACILITY_MAP.portals) {
    const state = portalStates[portal.id];
    if (portal.kind === "door" || portal.kind === "core_door") {
      drawDoorPortal(graphics, portal, state);
    }
    if (portal.kind === "trapdoor") {
      drawTrapdoorPortal(graphics, portal, state);
    }
    drawPortalFlows(graphics, portal, state);
  }
};

const drawPortalCut = (graphics: Graphics, gridCell: GridCell): void => {
  const rect = gridCellMapRect(gridCell);
  graphics
    .rect(rect.left - 0.6, rect.top - 0.6, rect.width + 1.2, rect.height + 1.2)
    .stroke({ color: 0x607b6f, width: 1, alpha: 0.22 });
};

const drawPortalCuts = (graphics: Graphics): void => {
  for (const portal of FACILITY_MAP.portals) {
    for (const connector of portal.connectorCells) drawPortalCut(graphics, connector);
  }
};

const drawTerrainStructures = (graphics: Graphics): void => {
  for (const definition of facilityCells()) {
    if (definition.terrain === "core_shell") drawCoreShellCell(graphics, definition.cell);
  }
  for (const definition of facilityCells()) {
    if (definition.terrain === "platform") drawPlatformCell(graphics, definition.cell);
  }
  for (const definition of facilityCells()) {
    if (definition.terrain === "ladder") drawLadderCell(graphics, definition.cell);
  }
};

const drawPassageFrames = (graphics: Graphics): void => {
  for (const portal of FACILITY_MAP.portals) {
    if (portal.kind !== "passage" && portal.kind !== "floor_hole") continue;
    for (const connector of portal.connectorCells) {
      const rect = gridCellMapRect(connector);
      graphics
        .rect(rect.left, rect.top, rect.width, rect.height)
        .stroke({ color: 0x607b6f, width: 1, alpha: 0.28 });
    }
  }
};

export const drawFacilityCorridors = (graphics: Graphics): void => {
  graphics.clear();
  drawPortalCuts(graphics);
  drawTerrainStructures(graphics);
  drawPassageFrames(graphics);
};
