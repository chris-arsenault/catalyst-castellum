import type { RoomId } from "../types";
import type { ArchitecturalConnection, MapConnection, MapRoom, WorldMap } from "./map";
import { architecturalConnections, isArchitectural } from "./map";
import { validateWorldMap } from "./mapValidation";
import type { GridCell } from "../types";
import { cellKey } from "../spatial";
import { hullPlanningMap } from "./hullFragment";

/**
 * In-play map edits (ADR-0001): every edit produces a new frozen map object — the
 * derived-geometry caches key off map identity — and runs the shared validator, so a
 * player edit obeys exactly the invariants a producer's output does.
 */

/** Append a connection; authored insertion order stays a prefix (iteration order is behavior). */
export const withConnection = (map: WorldMap, connection: MapConnection): WorldMap => {
  if (connection.id in map.connections)
    throw new Error(`Connection ${connection.id} already exists on the map.`);
  const edited: WorldMap = {
    ...map,
    connections: { ...map.connections, [connection.id]: connection },
  };
  const issues = validateWorldMap(edited);
  if (issues.length > 0) {
    const detail = issues.map(({ path, message }) => path + ": " + message).join("; ");
    throw new Error(`Map edit rejected: ${detail}`);
  }
  return Object.freeze(edited);
};

const validated = (edited: WorldMap, operation: string): WorldMap => {
  const issues = validateWorldMap(edited);
  if (issues.length > 0) {
    const detail = issues.map(({ path, message }) => path + ": " + message).join("; ");
    throw new Error(`${operation} rejected: ${detail}`);
  }
  return Object.freeze(edited);
};

/** A graft adds one hull room and its joint in a single validated edit. */
export const withGraft = (map: WorldMap, room: MapRoom, joint: MapConnection): WorldMap => {
  if (room.id in map.rooms) throw new Error(`Graft room ${room.id} already exists on the map.`);
  if (joint.id in map.connections)
    throw new Error(`Graft joint ${joint.id} already exists on the map.`);
  return validated(
    {
      ...map,
      rooms: { ...map.rooms, [room.id]: room },
      connections: { ...map.connections, [joint.id]: joint },
    },
    "Graft"
  );
};

export const withoutGraft = (map: WorldMap, roomId: string, jointId: string): WorldMap => {
  const rooms = { ...map.rooms };
  const connections = { ...map.connections };
  if (!(roomId in rooms)) throw new Error(`Unknown graft room instance: ${roomId}`);
  delete rooms[roomId];
  delete connections[jointId];
  return validated({ ...map, rooms, connections }, "Graft removal");
};

export type HullCellTerrain = "platform" | "ladder";
export type HullCellStrokeTerrain = HullCellTerrain | "clear";

const roomContainsCell = (room: MapRoom, target: GridCell): boolean =>
  target.column >= room.bounds.column &&
  target.column < room.bounds.column + room.bounds.width &&
  target.elevation >= room.bounds.elevation &&
  target.elevation < room.bounds.elevation + room.bounds.height;

const updateCellList = (
  cells: readonly GridCell[],
  target: GridCell,
  present: boolean
): readonly GridCell[] => {
  const retained = cells.filter((candidate) => cellKey(candidate) !== cellKey(target));
  return present ? [...retained, { ...target }] : retained;
};

const editableHullRoom = (map: WorldMap, roomId: RoomId, targets: readonly GridCell[]): MapRoom => {
  const room = map.rooms[roomId];
  if (
    !room ||
    room.provenance !== "hull" ||
    targets.length === 0 ||
    targets.some((target) => !roomContainsCell(room, target))
  )
    throw new Error("Hull cell edit is outside a persistent room.");
  return room;
};

const addTargets = (
  cells: readonly GridCell[],
  targets: readonly GridCell[]
): readonly GridCell[] => {
  const targetKeys = new Set(targets.map(cellKey));
  return [...cells.filter((candidate) => !targetKeys.has(cellKey(candidate))), ...targets];
};

const removeTargets = (
  cells: readonly GridCell[],
  targets: readonly GridCell[]
): readonly GridCell[] => {
  const targetKeys = new Set(targets.map(cellKey));
  return cells.filter((candidate) => !targetKeys.has(cellKey(candidate)));
};

const roomWithTerrainStroke = (
  room: MapRoom,
  targets: readonly GridCell[],
  terrain: HullCellStrokeTerrain,
  clearTerrain?: HullCellTerrain
): MapRoom => {
  if (terrain === "platform")
    return {
      ...room,
      platformCells: addTargets(room.platformCells, targets),
      ladderCells: removeTargets(room.ladderCells, targets),
    };
  if (terrain === "ladder")
    return {
      ...room,
      platformCells: removeTargets(room.platformCells, targets),
      ladderCells: addTargets(room.ladderCells, targets),
    };
  return {
    ...room,
    platformCells:
      clearTerrain === "ladder" ? room.platformCells : removeTargets(room.platformCells, targets),
    ladderCells:
      clearTerrain === "platform" ? room.ladderCells : removeTargets(room.ladderCells, targets),
  };
};

/** Add or remove a walkable platform or ladder cell inside the persistent hull. */
export const withHullCellEdit = (
  source: WorldMap,
  roomId: RoomId,
  target: GridCell,
  terrain: HullCellTerrain,
  present: boolean
): WorldMap => withHullCellEdits(source, roomId, [target], present ? terrain : "clear", terrain);

/** Apply one drag stroke as one validated map edit. */
export const withHullCellEdits = (
  source: WorldMap,
  roomId: RoomId,
  targets: readonly GridCell[],
  terrain: HullCellStrokeTerrain,
  clearTerrain?: HullCellTerrain
): WorldMap => {
  const map = hullPlanningMap(source);
  const uniqueTargets = [...new Map(targets.map((target) => [cellKey(target), target])).values()];
  const room = editableHullRoom(map, roomId, uniqueTargets);
  const editedRoom = roomWithTerrainStroke(room, uniqueTargets, terrain, clearTerrain);
  return validated({ ...map, rooms: { ...map.rooms, [roomId]: editedRoom } }, "Hull cell edit");
};

export interface HullConnectionPlan {
  connection: ArchitecturalConnection;
  map: WorldMap;
}

const overlapRange = (
  leftStart: number,
  leftSize: number,
  rightStart: number,
  rightSize: number
) => {
  const start = Math.max(leftStart, rightStart);
  const end = Math.min(leftStart + leftSize - 1, rightStart + rightSize - 1);
  return start <= end ? { start, end } : null;
};

const bridgeId = (left: RoomId, right: RoomId): string =>
  `joint:bridge:${[left, right].sort().join("__")}`;

const horizontalHullConnection = (
  first: MapRoom,
  second: MapRoom
): ArchitecturalConnection | null => {
  const [left, right] =
    first.bounds.column <= second.bounds.column ? [first, second] : [second, first];
  const gap = right.bounds.column - (left.bounds.column + left.bounds.width);
  const overlap = overlapRange(
    left.bounds.elevation,
    left.bounds.height,
    right.bounds.elevation,
    right.bounds.height
  );
  if (gap < 1 || gap > 2 || !overlap) return null;
  const elevation = overlap.start;
  const leftEndpoint = {
    column: left.bounds.column + left.bounds.width - 1,
    elevation,
  };
  const rightEndpoint = { column: right.bounds.column, elevation };
  return {
    id: bridgeId(left.id, right.id),
    kind: "passage",
    rooms: [left.id, right.id],
    connectorCells: Array.from({ length: gap }, (_, index) => ({
      column: leftEndpoint.column + index + 1,
      elevation,
    })),
    endpoints: [leftEndpoint, rightEndpoint],
    orientation: "horizontal",
    sillElevation: elevation,
    aperture: gap,
    gasConductance: 0.2,
    liquidConductance: 0.2,
    liquidMode: "spill",
    defaultOpen: true,
    defaultSealed: false,
    sealGroupId: null,
    hostRoomId: left.id,
  };
};

const verticalHullConnection = (
  first: MapRoom,
  second: MapRoom
): ArchitecturalConnection | null => {
  const [lower, upper] =
    first.bounds.elevation <= second.bounds.elevation ? [first, second] : [second, first];
  const gap = upper.bounds.elevation - (lower.bounds.elevation + lower.bounds.height);
  const overlap = overlapRange(
    lower.bounds.column,
    lower.bounds.width,
    upper.bounds.column,
    upper.bounds.width
  );
  if (gap < 1 || gap > 2 || !overlap) return null;
  const column = Math.floor((overlap.start + overlap.end) / 2);
  const lowerEndpoint = {
    column,
    elevation: lower.bounds.elevation + lower.bounds.height - 1,
  };
  const upperEndpoint = { column, elevation: upper.bounds.elevation };
  return {
    id: bridgeId(lower.id, upper.id),
    kind: "ladder_shaft",
    rooms: [lower.id, upper.id],
    connectorCells: Array.from({ length: gap }, (_, index) => ({
      column,
      elevation: lowerEndpoint.elevation + index + 1,
    })),
    endpoints: [lowerEndpoint, upperEndpoint],
    orientation: "vertical",
    sillElevation: upperEndpoint.elevation,
    aperture: gap,
    gasConductance: 0.2,
    liquidConductance: 0.3,
    liquidMode: "drain",
    defaultOpen: true,
    defaultSealed: false,
    sealGroupId: null,
    hostRoomId: lower.id,
  };
};

const connectableHullRooms = (
  map: WorldMap,
  firstRoomId: RoomId,
  secondRoomId: RoomId
): readonly [MapRoom, MapRoom] | null => {
  const first = map.rooms[firstRoomId];
  const second = map.rooms[secondRoomId];
  const alreadyConnected = architecturalConnections(map).some(
    (connection) =>
      connection.rooms.includes(firstRoomId) && connection.rooms.includes(secondRoomId)
  );
  if (
    firstRoomId === secondRoomId ||
    !first ||
    !second ||
    first.provenance !== "hull" ||
    second.provenance !== "hull" ||
    alreadyConnected
  )
    return null;
  return [first, second];
};

const roomsWithVerticalEndpoints = (
  map: WorldMap,
  connection: ArchitecturalConnection
): WorldMap["rooms"] => {
  if (connection.orientation !== "vertical") return map.rooms;
  const rooms = { ...map.rooms };
  connection.endpoints.forEach((endpoint, index) => {
    const roomId = connection.rooms[index] as RoomId;
    const room = rooms[roomId] as MapRoom;
    rooms[roomId] = {
      ...room,
      platformCells: updateCellList(room.platformCells, endpoint, false),
      ladderCells: updateCellList(room.ladderCells, endpoint, true),
    };
  });
  return rooms;
};

/** Mint an opening across the one- or two-cell seam between persistent rooms. */
export const plannedHullConnection = (
  source: WorldMap,
  firstRoomId: RoomId,
  secondRoomId: RoomId
): HullConnectionPlan | null => {
  const map = hullPlanningMap(source);
  const rooms = connectableHullRooms(map, firstRoomId, secondRoomId);
  if (!rooms) return null;
  const connection =
    horizontalHullConnection(rooms[0], rooms[1]) ?? verticalHullConnection(rooms[0], rooms[1]);
  if (!connection) return null;
  try {
    const edited = validated(
      {
        ...map,
        rooms: roomsWithVerticalEndpoints(map, connection),
        connections: { ...map.connections, [connection.id]: connection },
      },
      "Hull connection"
    );
    return { connection, map: edited };
  } catch {
    return null;
  }
};

/** Remove a player-added room opening while preserving every graft parent joint. */
export const withoutHullConnection = (source: WorldMap, connectionId: string): WorldMap => {
  const map = hullPlanningMap(source);
  if (!connectionId.startsWith("joint:bridge:") || !(connectionId in map.connections))
    throw new Error("Hull connection removal requires a player-added opening.");
  const connections = { ...map.connections };
  delete connections[connectionId];
  return validated({ ...map, connections }, "Hull connection removal");
};

/** Install a door at a hull joint, or remove it to restore an open passage. */
export const withHullPortalConfiguration = (
  source: WorldMap,
  connectionId: string,
  kind: "passage" | "door",
  open: boolean
): WorldMap => {
  const map = hullPlanningMap(source);
  const connection = map.connections[connectionId];
  if (
    !connection ||
    !isArchitectural(connection) ||
    connection.kind === "core_door" ||
    connection.orientation !== "horizontal" ||
    !connection.rooms.every((roomId) => map.rooms[roomId]?.provenance === "hull")
  )
    throw new Error("Portal configuration requires a player-built hull joint.");
  const edited: ArchitecturalConnection = {
    ...connection,
    kind,
    defaultOpen: kind === "passage" ? true : open,
    defaultSealed: false,
  };
  return validated(
    { ...map, connections: { ...map.connections, [connectionId]: edited } },
    "Hull portal edit"
  );
};
