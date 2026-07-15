import type { GridCell } from "../types";
import type { MapConnection, ProcessLineConnection, WorldMap } from "./map";
import { isProcessLine, processLineId } from "./map";

/**
 * Shared map validation (ADR-0001): every producer and every in-play map edit runs
 * the same invariants, regardless of how the map was made. Route/identity checks are
 * generalized from the pack compiler.
 */
export interface MapIssue {
  path: string;
  message: string;
}

const push = (issues: MapIssue[], path: string, message: string): void => {
  issues.push({ path, message });
};

const cellIsAdjacent = (left: GridCell, right: GridCell): boolean =>
  Math.abs(left.column - right.column) + Math.abs(left.elevation - right.elevation) === 1;

const inBounds = (map: WorldMap, { column, elevation }: GridCell): boolean =>
  column >= 0 && column < map.width && elevation >= 0 && elevation < map.height;

const roomContains = (map: WorldMap, roomId: string, cell: GridCell): boolean => {
  const bounds = map.rooms[roomId]?.bounds;
  if (!bounds) return false;
  return (
    cell.column >= bounds.column &&
    cell.column < bounds.column + bounds.width &&
    cell.elevation >= bounds.elevation &&
    cell.elevation < bounds.elevation + bounds.height
  );
};

const boundsOverlap = (
  left: WorldMap["rooms"][string],
  right: WorldMap["rooms"][string]
): boolean =>
  left.bounds.column < right.bounds.column + right.bounds.width &&
  left.bounds.column + left.bounds.width > right.bounds.column &&
  left.bounds.elevation < right.bounds.elevation + right.bounds.height &&
  left.bounds.elevation + left.bounds.height > right.bounds.elevation;

const validateRoom = (
  map: WorldMap,
  roomId: string,
  room: WorldMap["rooms"][string],
  issues: MapIssue[]
): void => {
  const path = `rooms.${roomId}`;
  if (room.id !== roomId)
    push(issues, `${path}.id`, `Record key ${roomId} differs from declared ID ${room.id}.`);
  for (const phase of ["gas", "liquid"] as const) {
    const sourceIds = room.taps[phase].sourceIds;
    if (new Set(sourceIds).size !== sourceIds.length)
      push(issues, `${path}.taps.${phase}.sourceIds`, "Tap source ids must be unique.");
  }
  for (const hardpoint of room.hardpoints) {
    if (!roomContains(map, roomId, hardpoint.cell))
      push(issues, `${path}.hardpoints.${hardpoint.id}`, "Hardpoint cell is outside its room.");
  }
};

const validateRooms = (map: WorldMap, issues: MapIssue[]): void => {
  const rooms = Object.entries(map.rooms);
  for (const [roomId, room] of rooms) validateRoom(map, roomId, room, issues);
  for (let left = 0; left < rooms.length; left += 1) {
    for (let right = left + 1; right < rooms.length; right += 1) {
      if (boundsOverlap(rooms[left]![1], rooms[right]![1]))
        push(issues, `rooms.${rooms[left]![0]}`, `Room bounds overlap ${rooms[right]![0]}.`);
    }
  }
};

const validateConnectionRooms = (
  map: WorldMap,
  connection: MapConnection,
  path: string,
  issues: MapIssue[]
): void => {
  for (const roomId of connection.rooms) {
    if (!(roomId in map.rooms)) push(issues, `${path}.rooms`, `Unknown room ${roomId}.`);
  }
};

const validateRoute = (
  map: WorldMap,
  line: ProcessLineConnection,
  path: string,
  issues: MapIssue[]
): void => {
  if (line.route.length < 2) push(issues, path, "A route requires at least two cells.");
  line.route.forEach((cell, index) => {
    if (!inBounds(map, cell)) push(issues, `${path}.${index}`, "Route cell is outside the map.");
    const previous = line.route[index - 1];
    if (previous && !cellIsAdjacent(previous, cell))
      push(issues, `${path}.${index}`, "Route cells must be orthogonally adjacent.");
  });
  const start = line.route[0];
  if (start && !roomContains(map, line.direction[0], start))
    push(issues, path, "Route start is outside its source room.");
  const end = line.route.at(-1);
  if (end && !roomContains(map, line.direction[1], end))
    push(issues, path, "Route end is outside its destination room.");
};

const validateProcessLine = (
  map: WorldMap,
  line: ProcessLineConnection,
  path: string,
  issues: MapIssue[]
): void => {
  const directionIsPair =
    (line.direction[0] === line.rooms[0] && line.direction[1] === line.rooms[1]) ||
    (line.direction[0] === line.rooms[1] && line.direction[1] === line.rooms[0]);
  if (!directionIsPair)
    push(issues, `${path}.direction`, "Line direction must connect the line's own room pair.");
  validateRoute(map, line, `${path}.route`, issues);
};

const validateConnections = (map: WorldMap, issues: MapIssue[]): void => {
  const linePairs = new Set<string>();
  for (const [connectionId, connection] of Object.entries(map.connections)) {
    const path = `connections.${connectionId}`;
    if (connection.id !== connectionId)
      push(
        issues,
        `${path}.id`,
        `Record key ${connectionId} differs from declared ID ${connection.id}.`
      );
    validateConnectionRooms(map, connection, path, issues);
    if (!isProcessLine(connection)) continue;
    const pairId = processLineId(connection.kind, connection.rooms[0], connection.rooms[1]);
    if (linePairs.has(pairId))
      push(issues, path, `A room pair owns at most one ${connection.kind}.`);
    linePairs.add(pairId);
    validateProcessLine(map, connection, path, issues);
  }
};

const validateUtilityNodes = (map: WorldMap, issues: MapIssue[]): void => {
  for (const [nodeId, node] of Object.entries(map.utilityNodes)) {
    if (!(node.hostRoomId in map.rooms))
      push(issues, `utilityNodes.${nodeId}`, `Unknown host room ${node.hostRoomId}.`);
    if (!inBounds(map, node.cell))
      push(issues, `utilityNodes.${nodeId}`, "Utility node cell is outside the map.");
  }
};

export const validateWorldMap = (map: WorldMap): readonly MapIssue[] => {
  const issues: MapIssue[] = [];
  validateRooms(map, issues);
  validateConnections(map, issues);
  validateUtilityNodes(map, issues);
  return issues;
};
