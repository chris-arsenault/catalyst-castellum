import type { Graphics } from "pixi.js";
import { SPECIES_DEFINITIONS, TRANSPORT_RUNS, gridCellsToWorldPath } from "../../game/config";
import {
  transportRunMaterialFlow,
  transportRunPhaseStatus,
  type MaterialRunFlow,
  type TransportPhaseStatus,
} from "../../game/queries";
import type {
  GameState,
  GridCell,
  Point,
  SpeciesId,
  TransportPhase,
  TransportRunId,
} from "../../game/types";
import { colorNumber, worldPathToMap } from "./mapGeometry";

const GAS_RUN_COLOR = 0x58aab3;
const LIQUID_RUN_COLOR = 0x3f76ba;
const FLOW_EPSILON = 0.002;

const tracePath = (graphics: Graphics, points: readonly Point[]): void => {
  const first = points[0];
  if (!first) return;
  graphics.moveTo(first.x, first.y);
  for (const point of points.slice(1)) graphics.lineTo(point.x, point.y);
};

const pointNormal = (points: readonly Point[], index: number): Point => {
  const previous = points[Math.max(0, index - 1)] as Point;
  const next = points[Math.min(points.length - 1, index + 1)] as Point;
  const dx = next.x - previous.x;
  const dy = next.y - previous.y;
  const length = Math.hypot(dx, dy) || 1;
  return { x: -dy / length, y: dx / length };
};

const offsetPath = (points: readonly Point[], offset: number): Point[] =>
  points.map((point, index) => {
    const normal = pointNormal(points, index);
    return { x: point.x + normal.x * offset, y: point.y + normal.y * offset };
  });

interface PathSample {
  point: Point;
  angle: number;
}

const samplePath = (points: readonly Point[], progress: number): PathSample => {
  const lengths = points.slice(1).map((point, index) => {
    const previous = points[index] as Point;
    return Math.hypot(point.x - previous.x, point.y - previous.y);
  });
  let remaining = lengths.reduce((total, length) => total + length, 0) * progress;
  for (let index = 0; index < lengths.length; index += 1) {
    const length = lengths[index] as number;
    const from = points[index] as Point;
    const to = points[index + 1] as Point;
    if (remaining <= length) {
      const ratio = length > 0 ? remaining / length : 0;
      return {
        point: { x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio },
        angle: Math.atan2(to.y - from.y, to.x - from.x),
      };
    }
    remaining -= length;
  }
  const last = points.at(-1) ?? { x: 0, y: 0 };
  const previous = points.at(-2) ?? last;
  return { point: last, angle: Math.atan2(last.y - previous.y, last.x - previous.x) };
};

const drawArrow = (
  graphics: Graphics,
  sample: PathSample,
  size: number,
  color: number,
  alpha: number,
  hollow: boolean
): void => {
  const directionX = Math.cos(sample.angle);
  const directionY = Math.sin(sample.angle);
  const normalX = -directionY;
  const normalY = directionX;
  const backX = sample.point.x - directionX * size;
  const backY = sample.point.y - directionY * size;
  const wing = size * 0.52;
  const left = { x: backX + normalX * wing, y: backY + normalY * wing };
  const right = { x: backX - normalX * wing, y: backY - normalY * wing };
  if (!hollow) {
    graphics
      .moveTo(backX - directionX * size * 0.65, backY - directionY * size * 0.65)
      .lineTo(sample.point.x, sample.point.y);
  }
  graphics.moveTo(left.x, left.y).lineTo(sample.point.x, sample.point.y).lineTo(right.x, right.y);
  graphics.stroke({ color, width: hollow ? 2 : 2.8, alpha });
};

const drawFlowArrows = (
  graphics: Graphics,
  points: readonly Point[],
  flow: MaterialRunFlow,
  elapsed: number,
  color: number
): void => {
  const rate = Math.abs(flow.net);
  if (rate <= FLOW_EPSILON) return;
  const direction = flow.net > 0 ? 1 : -1;
  const size = 5 + Math.min(8, Math.sqrt(rate) * 5);
  for (let index = 1; index <= 5; index += 1) {
    const progress = direction > 0 ? index / 6 : 1 - index / 6;
    const sample = samplePath(points, progress);
    if (direction < 0) sample.angle += Math.PI;
    const pulse = 0.48 + 0.42 * (0.5 + 0.5 * Math.sin(elapsed * 5 + index * 1.2));
    drawArrow(graphics, sample, size, color, pulse, flow.priming);
  }
};

const drawStopMarker = (graphics: Graphics, points: readonly Point[]): void => {
  const { point } = samplePath(points, 0.5);
  graphics.circle(point.x, point.y, 7).fill({ color: 0x170b09, alpha: 0.92 });
  graphics
    .moveTo(point.x - 4, point.y - 4)
    .lineTo(point.x + 4, point.y + 4)
    .moveTo(point.x + 4, point.y - 4)
    .lineTo(point.x - 4, point.y + 4)
    .stroke({ color: 0xf6644c, width: 2.5, alpha: 0.95 });
};

interface LaneModel {
  color: number;
  elapsed: number;
  flow: MaterialRunFlow | null;
  hovered: boolean;
  points: readonly Point[];
  status: TransportPhaseStatus;
}

const laneAlpha = (model: LaneModel): number => {
  if (!model.status.installed) {
    if (model.hovered) return 0.24;
    return 0.08;
  }
  if (model.hovered) return 0.9;
  if (model.status.active) return 0.68;
  if (model.status.configured) return 0.42;
  return 0.24;
};

const laneShellWidth = (model: LaneModel): number => {
  if (!model.status.installed) return 5;
  return model.hovered ? 12 : 10;
};

const laneCoreWidth = (model: LaneModel): number => {
  if (!model.status.installed) return 2;
  return model.hovered ? 6 : 5;
};

const laneColor = (model: LaneModel): number => {
  if (model.status.blocked && model.hovered) return 0xc74e41;
  return model.color;
};

const drawLane = (graphics: Graphics, model: LaneModel): void => {
  tracePath(graphics, model.points);
  graphics.stroke({
    color: 0x020705,
    width: laneShellWidth(model),
    alpha: model.status.installed ? 0.9 : 0.35,
  });
  tracePath(graphics, model.points);
  graphics.stroke({
    color: laneColor(model),
    width: laneCoreWidth(model),
    alpha: laneAlpha(model),
  });
  if (model.flow && Math.abs(model.flow.net) > FLOW_EPSILON) {
    tracePath(graphics, model.points);
    graphics.stroke({
      color: model.color,
      width: 2.5 + Math.min(5, Math.sqrt(Math.abs(model.flow.net)) * 2.6),
      alpha: 0.4,
    });
    drawFlowArrows(graphics, model.points, model.flow, model.elapsed, model.color);
  }
  if (model.status.blocked && model.hovered) drawStopMarker(graphics, model.points);
};

interface PhaseLaneModel {
  baseColor: number;
  basePath: readonly Point[];
  elapsed: number;
  hovered: boolean;
  offset: number;
  phase: "gas" | "liquid";
  runId: TransportRunId;
  selectedSpecies: SpeciesId | null;
  state: GameState;
}

const drawPhaseLane = (graphics: Graphics, model: PhaseLaneModel): void => {
  const points = offsetPath(model.basePath, model.offset);
  let color = model.baseColor;
  let flow: MaterialRunFlow | null = null;
  let status = transportRunPhaseStatus(model.state, model.runId, model.phase);
  if (model.selectedSpecies && SPECIES_DEFINITIONS[model.selectedSpecies].phase === model.phase) {
    flow = transportRunMaterialFlow(model.state, model.runId, model.selectedSpecies);
    const selectedRate = flow.forward + flow.reverse;
    if (selectedRate > FLOW_EPSILON) {
      color = colorNumber(SPECIES_DEFINITIONS[model.selectedSpecies].color);
    }
    status = {
      ...status,
      active: selectedRate > FLOW_EPSILON,
      configured: false,
      rate: selectedRate,
    };
  } else if (model.selectedSpecies) {
    status = { ...status, active: false, configured: false };
  }
  drawLane(graphics, {
    points,
    color,
    status,
    flow,
    elapsed: model.elapsed,
    hovered: model.hovered,
  });
};

const phaseRouteCells = (
  state: GameState,
  runId: TransportRunId,
  phase: TransportPhase
): readonly GridCell[] | null => {
  const definition = TRANSPORT_RUNS[runId][phase];
  const available =
    phase === "gas"
      ? state.availability.gasRuns.includes(runId)
      : state.availability.liquidRuns.includes(runId);
  if (!definition || !available) return null;
  const route =
    phase === "gas" ? state.gasConduits[runId].route : state.liquidConduits[runId].route;
  return route.length > 0 ? route : definition.blueprint;
};

const routesMatch = (
  left: readonly GridCell[],
  right: readonly GridCell[],
  reverse: boolean
): boolean => {
  if (left.length !== right.length) return false;
  return left.every((cell, index) => {
    const rightIndex = reverse ? right.length - 1 - index : index;
    const comparison = right[rightIndex];
    return cell.column === comparison?.column && cell.elevation === comparison?.elevation;
  });
};

interface PhaseLaneOffsets {
  gas: number;
  liquid: number;
}

const coincidentLaneOffsets = (
  gasCells: readonly GridCell[] | null,
  liquidCells: readonly GridCell[] | null
): PhaseLaneOffsets => {
  if (!gasCells || !liquidCells) return { gas: 0, liquid: 0 };
  if (routesMatch(gasCells, liquidCells, false)) return { gas: -5, liquid: 5 };
  if (routesMatch(gasCells, liquidCells, true)) return { gas: -5, liquid: -5 };
  return { gas: 0, liquid: 0 };
};

export const drawTransportRun = (
  graphics: Graphics,
  state: GameState,
  runId: TransportRunId,
  selectedSpecies: SpeciesId | null,
  hovered: boolean
): void => {
  graphics.clear();
  const gasCells = phaseRouteCells(state, runId, "gas");
  const liquidCells = phaseRouteCells(state, runId, "liquid");
  const hasGas = gasCells !== null;
  const hasLiquid = liquidCells !== null;
  const gasPath = worldPathToMap(gridCellsToWorldPath(gasCells ?? []));
  const liquidPath = worldPathToMap(gridCellsToWorldPath(liquidCells ?? []));
  const laneOffsets = coincidentLaneOffsets(gasCells, liquidCells);
  if (hasGas) {
    drawPhaseLane(graphics, {
      baseColor: GAS_RUN_COLOR,
      basePath: gasPath,
      elapsed: state.elapsed,
      hovered,
      offset: laneOffsets.gas,
      phase: "gas",
      runId,
      selectedSpecies,
      state,
    });
  }
  if (hasLiquid) {
    drawPhaseLane(graphics, {
      baseColor: LIQUID_RUN_COLOR,
      basePath: liquidPath,
      elapsed: state.elapsed,
      hovered,
      offset: laneOffsets.liquid,
      phase: "liquid",
      runId,
      selectedSpecies,
      state,
    });
  }
  if (hasGas) {
    tracePath(graphics, gasPath);
    graphics.stroke({ color: 0xffffff, width: 28, alpha: 0.001 });
  }
  if (hasLiquid) {
    tracePath(graphics, liquidPath);
    graphics.stroke({ color: 0xffffff, width: 28, alpha: 0.001 });
  }
};
