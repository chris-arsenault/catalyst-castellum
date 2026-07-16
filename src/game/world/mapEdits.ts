import type { GameDefinition } from "../definitionTypes";
import type { RoomId } from "../types";
import { routeConnection } from "./autoRouter";
import type {
  ArchitecturalConnection,
  LineSpec,
  MapConnection,
  MapRoom,
  ProcessLineConnection,
  ProcessLineKind,
  WorldMap,
} from "./map";
import { isArchitectural, processLineId } from "./map";
import { validateWorldMap } from "./mapValidation";
import type { GridCell } from "../types";
import { cellKey } from "../spatial";
import { hullPlanningMap } from "./hullFragment";

/**
 * In-play map edits (ADR-0001): every edit produces a new frozen map object — the
 * derived-geometry caches key off map identity — and runs the shared validator, so a
 * player edit obeys exactly the invariants a producer's output does.
 */

export const lineBuildCost = (spec: LineSpec, routeLength: number): number =>
  Math.round(spec.baseCost + spec.costPerCell * routeLength);

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

const plannedCache = new WeakMap<WorldMap, Map<string, ProcessLineConnection | null>>();

/**
 * Cached mint for command policy and preview: maps are frozen between edits, so the
 * same pair on the same map always plans the same line.
 */
export const plannedLineConnection = (
  definition: GameDefinition,
  map: WorldMap,
  kind: ProcessLineKind,
  fromRoomId: RoomId,
  toRoomId: RoomId
): ProcessLineConnection | null => {
  let plans = plannedCache.get(map);
  if (!plans) {
    plans = new Map();
    plannedCache.set(map, plans);
  }
  const key = processLineId(kind, fromRoomId, toRoomId);
  if (!plans.has(key))
    plans.set(key, mintLineConnection(definition, map, kind, fromRoomId, toRoomId));
  return plans.get(key) ?? null;
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

/** Add or remove a walkable platform or ladder cell inside the persistent hull. */
export const withHullCellEdit = (
  source: WorldMap,
  roomId: RoomId,
  target: GridCell,
  terrain: HullCellTerrain,
  present: boolean
): WorldMap => {
  const map = hullPlanningMap(source);
  const room = map.rooms[roomId];
  if (!room || room.provenance !== "hull" || !roomContainsCell(room, target))
    throw new Error("Hull cell edit is outside a persistent room.");
  let platformCells = room.platformCells;
  let ladderCells = room.ladderCells;
  if (terrain === "platform") {
    platformCells = updateCellList(platformCells, target, present);
    if (present) ladderCells = updateCellList(ladderCells, target, false);
  } else {
    ladderCells = updateCellList(ladderCells, target, present);
    if (present) platformCells = updateCellList(platformCells, target, false);
  }
  const editedRoom: MapRoom = {
    ...room,
    platformCells,
    ladderCells,
  };
  return validated({ ...map, rooms: { ...map.rooms, [roomId]: editedRoom } }, "Hull cell edit");
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

/** Route and parameterize a new player line; null when no legal route exists. */
export const mintLineConnection = (
  definition: GameDefinition,
  map: WorldMap,
  kind: ProcessLineKind,
  fromRoomId: RoomId,
  toRoomId: RoomId
): ProcessLineConnection | null => {
  const id = processLineId(kind, fromRoomId, toRoomId);
  if (id in map.connections) return null;
  const route = routeConnection(map, kind, fromRoomId, toRoomId);
  if (!route) return null;
  const spec = definition.lineSpecs[kind];
  return {
    id,
    kind,
    rooms: [fromRoomId, toRoomId],
    direction: [fromRoomId, toRoomId],
    destinationKind: "room",
    actuator: spec.actuator,
    actuatorHead: spec.actuatorHead,
    maxFlow: spec.maxFlow,
    volumePerCell: spec.volumePerCell,
    buildCost: lineBuildCost(spec, route.length),
    route,
  };
};
