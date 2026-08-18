import type { GameDefinition, RouteIngressDefinition } from "../definitionTypes";
import type { EnemyState, FacilityPortalState, GridCell } from "../types";
import { findEnemyPathBetween } from "../engine/navigation";
import type { EnemyRouteGraph, WorldMap } from "./map";

const distance = (left: GridCell, right: GridCell): number =>
  Math.hypot(right.column - left.column, right.elevation - left.elevation);

const pathLength = (cells: readonly GridCell[]): number =>
  cells.slice(1).reduce((total, cell, index) => total + distance(cells[index]!, cell), 0);

const ingressCell = (map: WorldMap, definition: RouteIngressDefinition): GridCell => {
  const room = map.rooms[definition.roomId];
  if (!room)
    throw new Error(`Route ${definition.id} references unknown room ${definition.roomId}.`);
  return {
    column: room.bounds.column + definition.offset.column,
    elevation: room.bounds.elevation + definition.offset.elevation,
  };
};

export const materializeRouteGraph = (
  map: WorldMap,
  definitions: readonly RouteIngressDefinition[],
  portalStates: Readonly<Record<string, FacilityPortalState>>
): EnemyRouteGraph => {
  const coreNode = { id: "core", kind: "core" as const, cell: { ...map.coreBreachCell } };
  const nodes = Object.fromEntries([
    [coreNode.id, coreNode],
    ...definitions.map((definition) => [
      `ingress:${definition.id}`,
      {
        id: `ingress:${definition.id}`,
        kind: "ingress" as const,
        cell: ingressCell(map, definition),
      },
    ]),
  ]);
  const edges = Object.fromEntries(
    definitions.map((definition) => {
      const node = nodes[`ingress:${definition.id}`]!;
      const path = findEnemyPathBetween(
        {
          flying: definition.eligibility === "flying",
          portalStates,
          start: node.cell,
          goal: map.coreBreachCell,
        },
        map
      );
      const cells = path.map((step) => ({ ...step.cell }));
      if (cells.length === 0)
        throw new Error(`Route ${definition.id} cannot reach Core from ${definition.roomId}.`);
      const id = `edge:${definition.id}:core`;
      const length = pathLength(cells);
      return [
        id,
        {
          id,
          from: node.id,
          to: coreNode.id,
          cells,
          traversal: "authored_path" as const,
          length,
          movementCost: length * definition.movementCost,
          eligibility: definition.eligibility,
        },
      ];
    })
  );
  const routes = Object.fromEntries(
    definitions.map((definition, index) => [
      definition.id,
      {
        id: definition.id,
        ingressNodeId: `ingress:${definition.id}`,
        edgeIds: [`edge:${definition.id}:core`],
        authoredOrder: index,
      },
    ])
  );
  return { coreNodeId: coreNode.id, nodes, edges, routes };
};

export const routePathForEnemy = (
  enemy: Pick<EnemyState, "routeId" | "type">,
  map: WorldMap,
  portalStates: Readonly<Record<string, FacilityPortalState>>,
  definition: GameDefinition
) => {
  const route = map.routeGraph.routes[enemy.routeId];
  const ingress = route ? map.routeGraph.nodes[route.ingressNodeId] : null;
  if (!route || !ingress) return [];
  return findEnemyPathBetween(
    {
      flying: definition.enemies[enemy.type].flying,
      portalStates,
      start: ingress.cell,
      goal: map.coreBreachCell,
    },
    map
  );
};

export const enemyRouteDistance = (
  enemy: EnemyState
): {
  total: number;
  traveled: number;
  remaining: number;
} => {
  const segments = enemy.path
    .slice(1)
    .map((step, index) => distance(enemy.path[index]!.cell, step.cell));
  const total = segments.reduce((sum, value) => sum + value, 0);
  const traveledBefore = segments.slice(0, enemy.pathIndex).reduce((sum, value) => sum + value, 0);
  const currentLength = segments[enemy.pathIndex] ?? 0;
  const traveled = Math.min(total, traveledBefore + currentLength * enemy.progress);
  return { total, traveled, remaining: Math.max(0, total - traveled) };
};
