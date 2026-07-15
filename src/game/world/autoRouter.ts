import type { GridCell, RoomId } from "../types";
import { cell } from "../spatial";
import type { ProcessLineKind, WorldMap } from "./map";
import { isProcessLine } from "./map";

/**
 * Deterministic orthogonal auto-router (ADR-0005): same map + same request ⇒ the same
 * route, so player builds replay identically. Weights steer routes out of room
 * interiors and off existing lanes without forbidding them — a map with no clean
 * corridor still routes.
 */

const STEP_COST = 1;
const TURN_COST = 0.4;
const FOREIGN_ROOM_COST = 8;
const ENDPOINT_ROOM_COST = 0.5;
const OCCUPIED_LANE_COST = 3;

/** Gas taps sit high in a room, liquid taps low — endpoints mirror the tap physics. */
const ENDPOINT_HEIGHT: Record<ProcessLineKind, number> = {
  gas_line: 0.72,
  liquid_line: 0.12,
};

const DIRECTIONS = [cell(1, 0), cell(-1, 0), cell(0, 1), cell(0, -1)] as const;

export const lineEndpointCell = (
  map: WorldMap,
  roomId: RoomId,
  kind: ProcessLineKind
): GridCell => {
  const bounds = map.rooms[roomId]?.bounds;
  if (!bounds) throw new Error(`Unknown map room instance: ${roomId}`);
  const elevation = Math.min(
    bounds.elevation + bounds.height - 1,
    bounds.elevation + Math.floor(bounds.height * ENDPOINT_HEIGHT[kind])
  );
  return cell(bounds.column + Math.floor(bounds.width / 2), elevation);
};

const roomAt = (map: WorldMap, target: GridCell): RoomId | null => {
  for (const room of Object.values(map.rooms)) {
    const { bounds } = room;
    if (
      target.column >= bounds.column &&
      target.column < bounds.column + bounds.width &&
      target.elevation >= bounds.elevation &&
      target.elevation < bounds.elevation + bounds.height
    )
      return room.id;
  }
  return null;
};

const occupiedLaneKeys = (map: WorldMap): Set<number> => {
  const keys = new Set<number>();
  for (const connection of Object.values(map.connections)) {
    if (!isProcessLine(connection)) continue;
    for (const routeCell of connection.route) {
      keys.add(routeCell.elevation * map.width + routeCell.column);
    }
  }
  return keys;
};

interface SearchNode {
  cost: number;
  column: number;
  elevation: number;
  direction: number;
}

/** Total order so the frontier pops identically on every run. */
const compareNodes = (left: SearchNode, right: SearchNode): number =>
  left.cost - right.cost ||
  left.elevation - right.elevation ||
  left.column - right.column ||
  left.direction - right.direction;

const endpointRoomCost = (room: RoomId, fromRoomId: RoomId, toRoomId: RoomId): number => {
  if (room === fromRoomId || room === toRoomId) return ENDPOINT_ROOM_COST;
  return FOREIGN_ROOM_COST;
};

const makeCellCost = (
  map: WorldMap,
  fromRoomId: RoomId,
  toRoomId: RoomId
): ((target: GridCell) => number) => {
  const lanes = occupiedLaneKeys(map);
  return (target) => {
    const room = roomAt(map, target);
    const roomCost = room === null ? 0 : endpointRoomCost(room, fromRoomId, toRoomId);
    const laneCost = lanes.has(target.elevation * map.width + target.column)
      ? OCCUPIED_LANE_COST
      : 0;
    return STEP_COST + roomCost + laneCost;
  };
};

/** Deterministic pop: full ordering makes the frontier drain identically on every run. */
const popBestNode = (frontier: SearchNode[]): SearchNode => {
  let bestIndex = 0;
  for (let index = 1; index < frontier.length; index += 1) {
    if (compareNodes(frontier[index] as SearchNode, frontier[bestIndex] as SearchNode) < 0)
      bestIndex = index;
  }
  return frontier.splice(bestIndex, 1)[0] as SearchNode;
};

interface Search {
  map: WorldMap;
  cellCost: (target: GridCell) => number;
  best: Map<number, number>;
  previous: Map<number, number>;
  frontier: SearchNode[];
}

const stateKeyFor = (map: WorldMap, column: number, elevation: number, direction: number): number =>
  (elevation * map.width + column) * DIRECTIONS.length + direction;

const expandNode = (search: Search, node: SearchNode, nodeKey: number): void => {
  for (let direction = 0; direction < DIRECTIONS.length; direction += 1) {
    const delta = DIRECTIONS[direction] as GridCell;
    const column = node.column + delta.column;
    const elevation = node.elevation + delta.elevation;
    if (column < 0 || column >= search.map.width) continue;
    if (elevation < 0 || elevation >= search.map.height) continue;
    const cost =
      node.cost +
      search.cellCost(cell(column, elevation)) +
      (direction === node.direction ? 0 : TURN_COST);
    const key = stateKeyFor(search.map, column, elevation, direction);
    if (cost >= (search.best.get(key) ?? Number.POSITIVE_INFINITY)) continue;
    search.best.set(key, cost);
    search.previous.set(key, nodeKey);
    search.frontier.push({ cost, column, elevation, direction });
  }
};

export const routeConnection = (
  map: WorldMap,
  kind: ProcessLineKind,
  fromRoomId: RoomId,
  toRoomId: RoomId
): GridCell[] | null => {
  if (fromRoomId === toRoomId) return null;
  if (!(fromRoomId in map.rooms) || !(toRoomId in map.rooms)) return null;
  const start = lineEndpointCell(map, fromRoomId, kind);
  const goal = lineEndpointCell(map, toRoomId, kind);
  const search: Search = {
    map,
    cellCost: makeCellCost(map, fromRoomId, toRoomId),
    best: new Map(),
    previous: new Map(),
    frontier: [],
  };
  for (let direction = 0; direction < DIRECTIONS.length; direction += 1) {
    search.frontier.push({ cost: 0, column: start.column, elevation: start.elevation, direction });
    search.best.set(stateKeyFor(map, start.column, start.elevation, direction), 0);
  }
  while (search.frontier.length > 0) {
    const node = popBestNode(search.frontier);
    const nodeKey = stateKeyFor(map, node.column, node.elevation, node.direction);
    if ((search.best.get(nodeKey) ?? Number.POSITIVE_INFINITY) < node.cost) continue;
    if (node.column === goal.column && node.elevation === goal.elevation) {
      return reconstruct(search.previous, nodeKey, start, map);
    }
    expandNode(search, node, nodeKey);
  }
  return null;
};

const sameCell = (left: GridCell | undefined, right: GridCell): boolean =>
  left !== undefined && left.column === right.column && left.elevation === right.elevation;

const reconstruct = (
  previous: Map<number, number>,
  goalKey: number,
  start: GridCell,
  map: WorldMap
): GridCell[] => {
  const path: GridCell[] = [];
  let cursor: number | undefined = goalKey;
  while (cursor !== undefined) {
    const spatialKey = Math.floor(cursor / DIRECTIONS.length);
    const step = cell(spatialKey % map.width, Math.floor(spatialKey / map.width));
    if (!sameCell(path[0], step)) path.unshift(step);
    cursor = previous.get(cursor);
  }
  if (!sameCell(path[0], start)) path.unshift({ ...start });
  return path;
};
