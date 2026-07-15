import { cell, cellKey } from "../spatial";
import { architecturalConnections } from "../world/map";
import type { GameDefinition } from "../definitionTypes";
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
  allowCoreBreach: boolean,
  definition: GameDefinition
): boolean =>
  definition.facility.cellIsTraversable(target, portalStates) ||
  (allowCoreBreach && sameCell(target, definition.map.coreBreachCell));

const connectorMode = (
  target: GridCell,
  fallback: EnemyLocomotionMode,
  definition: GameDefinition
): EnemyLocomotionMode => {
  const terrain = definition.facility.cellDefinition(target).terrain;
  if (terrain === "door") return "door";
  return fallback;
};

const flyingNeighbors = (
  current: GridCell,
  portalStates: Readonly<Record<string, FacilityPortalState>>,
  allowCoreBreach: boolean,
  definition: GameDefinition
): NavigationNeighbor[] =>
  CARDINAL_DIRECTIONS.flatMap((direction) => {
    const target = cell(current.column + direction.column, current.elevation + direction.elevation);
    if (!canEnterCell(target, portalStates, allowCoreBreach, definition)) return [];
    return [
      {
        cell: target,
        mode: connectorMode(target, "flying", definition),
        portalId: definition.facility.cellDefinition(target).portalId,
      },
    ];
  });

const fallingNeighbor = (
  current: GridCell,
  portalStates: Readonly<Record<string, FacilityPortalState>>,
  definition: GameDefinition
): NavigationNeighbor[] => {
  const below = cell(current.column, current.elevation - 1);
  if (!definition.facility.cellIsTraversable(below, portalStates)) return [];
  return [
    {
      cell: below,
      mode: "falling",
      portalId: definition.facility.cellDefinition(below).portalId,
    },
  ];
};

const horizontalNeighbors = (
  current: GridCell,
  portalStates: Readonly<Record<string, FacilityPortalState>>,
  allowCoreBreach: boolean,
  definition: GameDefinition
): NavigationNeighbor[] =>
  [-1, 1].flatMap((direction) => {
    const target = cell(current.column + direction, current.elevation);
    if (!canEnterCell(target, portalStates, allowCoreBreach, definition)) return [];
    const targetTerrain = definition.facility.cellDefinition(target).terrain;
    const targetSupported =
      targetTerrain === "ladder" || definition.facility.cellHasSupport(target, portalStates);
    return [
      {
        cell: target,
        mode: targetSupported ? connectorMode(target, "walking", definition) : "falling",
        portalId: definition.facility.cellDefinition(target).portalId,
      },
    ];
  });

const ladderNeighbors = (
  current: GridCell,
  portalStates: Readonly<Record<string, FacilityPortalState>>,
  definition: GameDefinition
): NavigationNeighbor[] =>
  [-1, 1].flatMap((direction) => {
    const target = cell(current.column, current.elevation + direction);
    if (!definition.facility.cellIsTraversable(target, portalStates)) return [];
    if (definition.facility.cellDefinition(target).terrain !== "ladder") return [];
    return [
      {
        cell: target,
        mode: "climbing",
        portalId: definition.facility.cellDefinition(target).portalId,
      },
    ];
  });

const groundNeighbors = (
  current: GridCell,
  portalStates: Readonly<Record<string, FacilityPortalState>>,
  allowCoreBreach: boolean,
  definition: GameDefinition
): NavigationNeighbor[] => {
  const cellDefinition = definition.facility.cellDefinition(current);
  const onLadder = cellDefinition.terrain === "ladder";
  const supported = onLadder || definition.facility.cellHasSupport(current, portalStates);
  if (!supported) return fallingNeighbor(current, portalStates, definition);
  return [
    ...horizontalNeighbors(current, portalStates, allowCoreBreach, definition),
    ...(onLadder ? ladderNeighbors(current, portalStates, definition) : []),
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

const openTopologyPortalStates = (
  definition: GameDefinition
): Record<string, FacilityPortalState> =>
  Object.fromEntries(
    architecturalConnections(definition.map).map((portal) => [
      portal.id,
      { open: true, sealed: false, lastGasFlow: 0, lastLiquidFlow: 0 },
    ])
  );

/** Validate persisted locomotion with the same neighbor policy used by live pathfinding. */
export const enemyPathTransitionIsLegal = (
  { flying, previous, step }: EnemyPathTransitionOptions,
  definition: GameDefinition
): boolean => {
  const portalStates = openTopologyPortalStates(definition);
  const allowCoreBreach = sameCell(step.cell, definition.map.coreBreachCell);
  const neighbors = flying
    ? flyingNeighbors(previous.cell, portalStates, allowCoreBreach, definition)
    : groundNeighbors(previous.cell, portalStates, allowCoreBreach, definition);
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

const searchEnemyPath = (
  { flying, portalStates, start, goal }: EnemyPathSearchOptions,
  definition: GameDefinition
): EnemyPathStep[] => {
  const allowCoreBreach = sameCell(goal, definition.map.coreBreachCell);
  if (!definition.facility.cellIsTraversable(start, portalStates)) return [];
  if (!canEnterCell(goal, portalStates, allowCoreBreach, definition)) return [];
  const queue: GridCell[] = [{ ...start }];
  const visited = new Set([cellKey(start)]);
  const previous = new Map<string, { from: string; node: SearchNode }>();

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor] as GridCell;
    if (sameCell(current, goal)) return reconstructPath(start, goal, previous);
    const neighbors = flying
      ? flyingNeighbors(current, portalStates, allowCoreBreach, definition)
      : groundNeighbors(current, portalStates, allowCoreBreach, definition);
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
export const findEnemyPath = (
  options: EnemyPathOptions,
  definition: GameDefinition
): EnemyPathStep[] =>
  searchEnemyPath(
    {
      ...options,
      start: definition.map.entryCell,
      goal: definition.map.coreBreachCell,
    },
    definition
  );

export const findEnemyPathBetween = (
  options: EnemyPathSearchOptions,
  definition: GameDefinition
): EnemyPathStep[] => searchEnemyPath(options, definition);

export const pathMovementModes = (path: readonly EnemyPathStep[]): EnemyLocomotionMode[] =>
  path.reduce<EnemyLocomotionMode[]>((modes, step) => {
    if (modes.at(-1) !== step.mode) modes.push(step.mode);
    return modes;
  }, []);
