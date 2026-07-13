import {
  FACILITY_MAP,
  cell,
  cellKey,
  facilityCellDefinition,
  facilityCellHasSupport,
  facilityCellIsTraversable,
} from "../content/facilityGeometry";
import type { EnemyLocomotionMode, EnemyPathStep, FacilityPortalState, GridCell } from "../types";

interface NavigationNeighbor {
  cell: GridCell;
  mode: EnemyLocomotionMode;
  portalId: string | null;
}

const CARDINAL_DIRECTIONS = [cell(-1, 0), cell(1, 0), cell(0, 1), cell(0, -1)] as const;

const sameCell = (left: GridCell, right: GridCell): boolean =>
  left.column === right.column && left.elevation === right.elevation;

const canEnterCell = (
  target: GridCell,
  portalStates: Readonly<Record<string, FacilityPortalState>>,
  allowCoreBreach: boolean
): boolean =>
  facilityCellIsTraversable(target, portalStates) ||
  (allowCoreBreach && sameCell(target, FACILITY_MAP.coreBreachCell));

const connectorMode = (target: GridCell, fallback: EnemyLocomotionMode): EnemyLocomotionMode => {
  const terrain = facilityCellDefinition(target).terrain;
  if (terrain === "door") return "door";
  return fallback;
};

const flyingNeighbors = (
  current: GridCell,
  portalStates: Readonly<Record<string, FacilityPortalState>>,
  allowCoreBreach: boolean
): NavigationNeighbor[] =>
  CARDINAL_DIRECTIONS.flatMap((direction) => {
    const target = cell(current.column + direction.column, current.elevation + direction.elevation);
    if (!canEnterCell(target, portalStates, allowCoreBreach)) return [];
    return [
      {
        cell: target,
        mode: connectorMode(target, "flying"),
        portalId: facilityCellDefinition(target).portalId,
      },
    ];
  });

const fallingNeighbor = (
  current: GridCell,
  portalStates: Readonly<Record<string, FacilityPortalState>>
): NavigationNeighbor[] => {
  const below = cell(current.column, current.elevation - 1);
  if (!facilityCellIsTraversable(below, portalStates)) return [];
  return [
    {
      cell: below,
      mode: "falling",
      portalId: facilityCellDefinition(below).portalId,
    },
  ];
};

const horizontalNeighbors = (
  current: GridCell,
  portalStates: Readonly<Record<string, FacilityPortalState>>,
  allowCoreBreach: boolean
): NavigationNeighbor[] =>
  [-1, 1].flatMap((direction) => {
    const target = cell(current.column + direction, current.elevation);
    if (!canEnterCell(target, portalStates, allowCoreBreach)) return [];
    const targetTerrain = facilityCellDefinition(target).terrain;
    const targetSupported =
      targetTerrain === "ladder" || facilityCellHasSupport(target, portalStates);
    return [
      {
        cell: target,
        mode: targetSupported ? connectorMode(target, "walking") : "falling",
        portalId: facilityCellDefinition(target).portalId,
      },
    ];
  });

const ladderNeighbors = (
  current: GridCell,
  portalStates: Readonly<Record<string, FacilityPortalState>>
): NavigationNeighbor[] =>
  [-1, 1].flatMap((direction) => {
    const target = cell(current.column, current.elevation + direction);
    if (!facilityCellIsTraversable(target, portalStates)) return [];
    if (facilityCellDefinition(target).terrain !== "ladder") return [];
    return [
      {
        cell: target,
        mode: "climbing",
        portalId: facilityCellDefinition(target).portalId,
      },
    ];
  });

const groundNeighbors = (
  current: GridCell,
  portalStates: Readonly<Record<string, FacilityPortalState>>,
  allowCoreBreach: boolean
): NavigationNeighbor[] => {
  const definition = facilityCellDefinition(current);
  const onLadder = definition.terrain === "ladder";
  const supported = onLadder || facilityCellHasSupport(current, portalStates);
  if (!supported) return fallingNeighbor(current, portalStates);
  return [
    ...horizontalNeighbors(current, portalStates, allowCoreBreach),
    ...(onLadder ? ladderNeighbors(current, portalStates) : []),
  ];
};

interface SearchNode {
  cell: GridCell;
  mode: EnemyLocomotionMode;
  portalId: string | null;
}

const reconstructPath = (
  start: GridCell,
  goal: GridCell,
  previous: Map<string, { from: string; node: SearchNode }>
): EnemyPathStep[] => {
  const reversed: EnemyPathStep[] = [];
  let cursor = cellKey(goal);
  const startKey = cellKey(start);
  while (cursor !== startKey) {
    const link = previous.get(cursor);
    if (!link) return [];
    reversed.push({ cell: link.node.cell, mode: link.node.mode, portalId: link.node.portalId });
    cursor = link.from;
  }
  reversed.push({ cell: { ...start }, mode: "walking", portalId: null });
  return reversed.reverse();
};

export interface EnemyPathOptions {
  flying: boolean;
  portalStates: Readonly<Record<string, FacilityPortalState>>;
}

export interface EnemyPathTransitionOptions {
  flying: boolean;
  previous: EnemyPathStep;
  step: EnemyPathStep;
}

const openTopologyPortalStates = (): Record<string, FacilityPortalState> =>
  Object.fromEntries(
    FACILITY_MAP.portals.map((portal) => [
      portal.id,
      { open: true, sealed: false, lastGasFlow: 0, lastLiquidFlow: 0 },
    ])
  );

/** Validate persisted locomotion with the same neighbor policy used by live pathfinding. */
export const enemyPathTransitionIsLegal = ({
  flying,
  previous,
  step,
}: EnemyPathTransitionOptions): boolean => {
  const portalStates = openTopologyPortalStates();
  const allowCoreBreach = sameCell(step.cell, FACILITY_MAP.coreBreachCell);
  const neighbors = flying
    ? flyingNeighbors(previous.cell, portalStates, allowCoreBreach)
    : groundNeighbors(previous.cell, portalStates, allowCoreBreach);
  return neighbors.some(
    (neighbor) =>
      sameCell(neighbor.cell, step.cell) &&
      neighbor.mode === step.mode &&
      neighbor.portalId === step.portalId
  );
};

interface EnemyPathSearchOptions extends EnemyPathOptions {
  start: GridCell;
  goal: GridCell;
}

const searchEnemyPath = ({
  flying,
  portalStates,
  start,
  goal,
}: EnemyPathSearchOptions): EnemyPathStep[] => {
  const allowCoreBreach = sameCell(goal, FACILITY_MAP.coreBreachCell);
  if (!facilityCellIsTraversable(start, portalStates)) return [];
  if (!canEnterCell(goal, portalStates, allowCoreBreach)) return [];
  const queue: GridCell[] = [{ ...start }];
  const visited = new Set([cellKey(start)]);
  const previous = new Map<string, { from: string; node: SearchNode }>();

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor] as GridCell;
    if (sameCell(current, goal)) return reconstructPath(start, goal, previous);
    const neighbors = flying
      ? flyingNeighbors(current, portalStates, allowCoreBreach)
      : groundNeighbors(current, portalStates, allowCoreBreach);
    for (const neighbor of neighbors) {
      const key = cellKey(neighbor.cell);
      if (visited.has(key)) continue;
      visited.add(key);
      previous.set(key, {
        from: cellKey(current),
        node: { ...neighbor, cell: { ...neighbor.cell } },
      });
      queue.push({ ...neighbor.cell });
    }
  }
  return [];
};

/** Deterministic breadth-first navigation over real facility cells and movement rules. */
export const findEnemyPath = (options: EnemyPathOptions): EnemyPathStep[] =>
  searchEnemyPath({
    ...options,
    start: FACILITY_MAP.entryCell,
    goal: FACILITY_MAP.coreBreachCell,
  });

export const findEnemyPathBetween = (options: EnemyPathSearchOptions): EnemyPathStep[] =>
  searchEnemyPath(options);

export const pathMovementModes = (path: readonly EnemyPathStep[]): EnemyLocomotionMode[] =>
  path.reduce<EnemyLocomotionMode[]>((modes, step) => {
    if (modes.at(-1) !== step.mode) modes.push(step.mode);
    return modes;
  }, []);
