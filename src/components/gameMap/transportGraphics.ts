import type { Graphics } from "pixi.js";
import { SPECIES_DEFINITIONS } from "../../presentation/defaultGame";
import { gridPathToWorldPath as gridCellsToWorldPath } from "../../game/spatial";
import {
  transportRunMaterialFlow,
  transportRunPhaseStatus,
  type MaterialRunFlow,
  type TransportPhaseStatus,
} from "../../game/queries";
import {
  GAS_TYPES,
  LIQUID_TYPES,
  type GameState,
  type GridCell,
  type Point,
  type SpeciesId,
  type TransportPhase,
  type ConnectionId,
} from "../../game/types";
import { colorNumber, mapViewFor } from "./mapGeometry";
import { gasConduitState, liquidConduitState } from "../../game/world/instances";
import { lineDefinition } from "../../presentation/defaultGame";
import {
  drawArrow,
  drawClosedMarkers,
  drawOpenMarkers,
  drawStopMarker,
  samplePath,
} from "./transportPathGraphics";

export const GAS_RUN_COLOR = 0x58aab3;
export const LIQUID_RUN_COLOR = 0x3f76ba;
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
  const travel = (elapsed * (0.11 + Math.min(0.2, rate * 0.018))) % 1;
  for (let index = 1; index <= 5; index += 1) {
    const forwardProgress = (index / 5 + travel) % 1;
    const progress = direction > 0 ? forwardProgress : 1 - forwardProgress;
    const sample = samplePath(points, progress);
    if (direction < 0) sample.angle += Math.PI;
    const pulse = 0.48 + 0.42 * (0.5 + 0.5 * Math.sin(elapsed * 5 + index * 1.2));
    drawArrow(graphics, sample, size, color, pulse, flow.priming);
  }
};

const drawArrivalPulse = (
  graphics: Graphics,
  points: readonly Point[],
  flow: MaterialRunFlow,
  elapsed: number,
  color: number
): void => {
  if (flow.priming || Math.abs(flow.net) <= FLOW_EPSILON) return;
  const destination = samplePath(points, flow.net > 0 ? 1 : 0).point;
  const progress = (elapsed * 1.8) % 1;
  graphics
    .circle(destination.x, destination.y, 5 + progress * 14)
    .stroke({ color, width: 1.5 - progress * 0.5, alpha: 0.72 * (1 - progress) });
  graphics.circle(destination.x, destination.y, 3).fill({ color, alpha: 0.9 });
};

interface LaneModel {
  color: number;
  elapsed: number;
  emphasized: boolean;
  enabled: boolean;
  flow: MaterialRunFlow | null;
  hovered: boolean;
  points: readonly Point[];
  status: TransportPhaseStatus;
}

const laneAlpha = (model: LaneModel): number => {
  if (!model.status.installed) {
    if (model.emphasized) return model.hovered ? 0.85 : 0.5;
    if (model.hovered) return 0.24;
    return 0.08;
  }
  if (!model.enabled) return model.hovered ? 0.78 : 0.5;
  if (model.emphasized) return 1;
  if (model.hovered) return 1;
  return model.status.active ? 1 : 0.88;
};

const laneShellWidth = (model: LaneModel): number => {
  if (!model.status.installed) return model.emphasized ? 5 : 3;
  if (model.emphasized) return model.hovered ? 7.5 : 6;
  return model.hovered ? 6 : 4.5;
};

const laneCoreWidth = (model: LaneModel): number => {
  if (!model.status.installed) return model.emphasized ? 1.8 : 1;
  if (!model.enabled) return model.hovered ? 3.5 : 3;
  if (model.emphasized) return model.hovered ? 4 : 3.4;
  return model.hovered ? 3.7 : 3.1;
};

const laneColor = (model: LaneModel): number => {
  if (model.status.blocked) return 0xf0644c;
  if (model.status.installed && !model.enabled) return 0xb65a45;
  return model.color;
};

const laneShellAlpha = (model: LaneModel): number => {
  if (model.status.installed) return model.enabled ? 0.9 : 0.78;
  return model.emphasized ? 0.5 : 0.28;
};

const drawLane = (graphics: Graphics, model: LaneModel): void => {
  if (model.enabled) {
    tracePath(graphics, model.points);
    graphics.stroke({
      color: model.color,
      width: laneShellWidth(model) + 5,
      alpha: 0.14,
    });
  }
  tracePath(graphics, model.points);
  graphics.stroke({
    color: 0x020705,
    width: laneShellWidth(model),
    alpha: laneShellAlpha(model),
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
      width: 1.5 + Math.min(2.5, Math.sqrt(Math.abs(model.flow.net)) * 1.35),
      alpha: 0.34,
    });
    drawFlowArrows(graphics, model.points, model.flow, model.elapsed, model.color);
    drawArrivalPulse(graphics, model.points, model.flow, model.elapsed, model.color);
  } else if (model.enabled) {
    drawOpenMarkers(graphics, model.points, model.color);
  } else {
    drawClosedMarkers(graphics, model.points);
  }
  if (model.status.blocked) drawStopMarker(graphics, model.points);
};

interface PhaseLaneModel {
  baseColor: number;
  basePath: readonly Point[];
  elapsed: number;
  emphasized: boolean;
  hovered: boolean;
  offset: number;
  phase: "gas" | "liquid";
  runId: ConnectionId;
  selectedSpecies: SpeciesId | null;
  state: GameState;
}

const mixedPhaseColor = (
  state: GameState,
  runId: ConnectionId,
  phase: TransportPhase,
  fallback: number
): number => {
  const rates =
    phase === "gas"
      ? GAS_TYPES.map((species) => ({
          color: colorNumber(SPECIES_DEFINITIONS[species].color),
          rate: Math.abs(gasConduitState(state, runId).lastSpeciesFlow[species]),
        }))
      : LIQUID_TYPES.map((species) => ({
          color: colorNumber(SPECIES_DEFINITIONS[species].color),
          rate: Math.abs(liquidConduitState(state, runId).lastSpeciesFlow[species]),
        }));
  const total = rates.reduce((sum, entry) => sum + entry.rate, 0);
  if (total <= FLOW_EPSILON) return fallback;
  const mixed = rates.reduce(
    (rgb, entry) => ({
      red: rgb.red + ((entry.color >> 16) & 0xff) * (entry.rate / total),
      green: rgb.green + ((entry.color >> 8) & 0xff) * (entry.rate / total),
      blue: rgb.blue + (entry.color & 0xff) * (entry.rate / total),
    }),
    { red: 0, green: 0, blue: 0 }
  );
  return (Math.round(mixed.red) << 16) | (Math.round(mixed.green) << 8) | Math.round(mixed.blue);
};

const drawPhaseLane = (graphics: Graphics, model: PhaseLaneModel): void => {
  const points = offsetPath(model.basePath, model.offset);
  const conduit =
    model.phase === "gas"
      ? gasConduitState(model.state, model.runId)
      : liquidConduitState(model.state, model.runId);
  let color = mixedPhaseColor(model.state, model.runId, model.phase, model.baseColor);
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
  } else if (status.rate > FLOW_EPSILON) {
    flow = {
      forward: status.rate,
      reverse: 0,
      net: status.rate,
      blocked: status.blocked,
      priming: status.priming,
    };
  }
  drawLane(graphics, {
    points,
    color,
    status,
    flow,
    elapsed: model.elapsed,
    emphasized: model.emphasized,
    enabled: conduit.enabled,
    hovered: model.hovered,
  });
};

const phaseRouteCells = (
  state: GameState,
  runId: ConnectionId,
  phase: TransportPhase
): readonly GridCell[] | null => {
  const definition = lineDefinition(state, runId, phase);
  if (!definition) return null;
  const conduit =
    phase === "gas" ? gasConduitState(state, runId) : liquidConduitState(state, runId);
  // Only pipes the player has actually built appear on the map.
  if (!conduit.installed) return null;
  return conduit.route.length > 0 ? conduit.route : definition.route;
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
  if (routesMatch(gasCells, liquidCells, false)) return { gas: -3, liquid: 3 };
  if (routesMatch(gasCells, liquidCells, true)) return { gas: -3, liquid: -3 };
  return { gas: 0, liquid: 0 };
};

export const drawTransportRun = (
  graphics: Graphics,
  state: GameState,
  runId: ConnectionId,
  selectedSpecies: SpeciesId | null,
  hovered: boolean,
  emphasized: boolean
): void => {
  graphics.clear();
  const gasCells = phaseRouteCells(state, runId, "gas");
  const liquidCells = phaseRouteCells(state, runId, "liquid");
  const hasGas = gasCells !== null;
  const hasLiquid = liquidCells !== null;
  const view = mapViewFor(state.map);
  const gasPath = view.worldPathToMap(gridCellsToWorldPath(gasCells ?? []));
  const liquidPath = view.worldPathToMap(gridCellsToWorldPath(liquidCells ?? []));
  const laneOffsets = coincidentLaneOffsets(gasCells, liquidCells);
  if (hasGas) {
    drawPhaseLane(graphics, {
      baseColor: GAS_RUN_COLOR,
      basePath: gasPath,
      elapsed: state.elapsed,
      emphasized,
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
      emphasized,
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
