import type {
  GameState,
  GasConduitState,
  GridCell,
  LiquidConduitState,
  RoomId,
  RoomState,
  ConnectionId,
} from "../types";
import type { MapConnection, MapRoom, MapUtilityNode, WorldMap } from "./map";
import { architecturalConnections, isProcessLine } from "./map";
import { validateWorldMap } from "./mapValidation";

/**
 * The player's persistent castellum as data (ADR-0004): hull-provenance rooms, the
 * connections internal to them, and their live contents, extracted from an ending
 * state and embedded by translation into the next produced map. The simulation never
 * composes hull and site at runtime — producers do this before a level starts.
 */
export interface HullFragment {
  rooms: Record<RoomId, MapRoom>;
  connections: Record<ConnectionId, MapConnection>;
  utilityNodes: Record<string, MapUtilityNode>;
  roomStates: Record<RoomId, RoomState>;
  gasConduits: Record<ConnectionId, GasConduitState>;
  liquidConduits: Record<ConnectionId, LiquidConduitState>;
}

const deepCopy = <Value>(value: Value): Value => structuredClone(value);

const hullRoomRecords = (map: WorldMap): Record<RoomId, MapRoom> =>
  Object.fromEntries(
    Object.entries(map.rooms)
      .filter(([, room]) => room.provenance === "hull")
      .map(([roomId, room]) => [roomId, deepCopy(room)])
  );

const hullConnectionRecords = (
  map: WorldMap,
  rooms: Readonly<Record<RoomId, MapRoom>>
): Record<ConnectionId, MapConnection> =>
  Object.fromEntries(
    Object.entries(map.connections)
      .filter(([, connection]) => connection.rooms.every((roomId) => roomId in rooms))
      .map(([connectionId, connection]) => [connectionId, deepCopy(connection)])
  );

const hullUtilityNodeRecords = (
  map: WorldMap,
  rooms: Readonly<Record<RoomId, MapRoom>>
): Record<string, MapUtilityNode> =>
  Object.fromEntries(
    Object.entries(map.utilityNodes)
      .filter(([, node]) => node.hostRoomId in rooms)
      .map(([nodeId, node]) => [nodeId, deepCopy(node)])
  );

/**
 * The room where a generated site meets the traveling hull. Choosing the room with the
 * greatest architectural distance from Core makes every linear graft part of the final
 * enemy route; geometry and id provide deterministic branch tie-breakers.
 */
// eslint-disable-next-line complexity -- Graph distance and deterministic geometry resolve one dock.
export const hullDockRoomId = (map: WorldMap): RoomId => {
  const hullRooms = hullRoomRecords(map);
  if (!("core" in hullRooms)) throw new Error("The traveling hull has no Core room.");
  const neighbors = new Map<RoomId, RoomId[]>();
  for (const connection of architecturalConnections(map)) {
    const [left, right] = connection.rooms;
    if (!(left in hullRooms) || !(right in hullRooms)) continue;
    neighbors.set(left, [...(neighbors.get(left) ?? []), right]);
    neighbors.set(right, [...(neighbors.get(right) ?? []), left]);
  }
  const distance = new Map<RoomId, number>([["core", 0]]);
  const queue: RoomId[] = ["core"];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const roomId = queue[cursor] as RoomId;
    for (const neighbor of neighbors.get(roomId) ?? []) {
      if (distance.has(neighbor)) continue;
      distance.set(neighbor, (distance.get(roomId) ?? 0) + 1);
      queue.push(neighbor);
    }
  }
  return Object.keys(hullRooms)
    .filter((roomId) => distance.has(roomId))
    .sort((left, right) => {
      const distanceOrder = (distance.get(right) ?? 0) - (distance.get(left) ?? 0);
      if (distanceOrder !== 0) return distanceOrder;
      const columnOrder = hullRooms[left]!.bounds.column - hullRooms[right]!.bounds.column;
      return columnOrder !== 0 ? columnOrder : left.localeCompare(right);
    })[0] as RoomId;
};

/** A site-free map for the blue grafting workspace and validated hull edits. */
export const hullPlanningMap = (map: WorldMap): WorldMap => {
  const rooms = hullRoomRecords(map);
  const connections = hullConnectionRecords(map, rooms);
  const dock = rooms[hullDockRoomId({ ...map, rooms, connections })] as MapRoom;
  return Object.freeze({
    ...map,
    entryCell: { column: dock.bounds.column, elevation: dock.bounds.elevation },
    rooms,
    connections,
    utilityNodes: Object.fromEntries(
      Object.entries(map.utilityNodes).filter(([, node]) => node && node.hostRoomId in rooms)
    ),
  });
};

const extractHullMapData = (
  state: GameState
): Pick<HullFragment, "rooms" | "connections" | "utilityNodes"> => {
  const rooms = hullRoomRecords(state.map);
  const connections = hullConnectionRecords(state.map, rooms);
  const utilityNodes = hullUtilityNodeRecords(state.map, rooms);
  return { rooms, connections, utilityNodes };
};

/**
 * Fresh scenario/check tooling needs the authored hull geometry before live room state exists.
 * The scenario factory fills empty state records from the destination level's loadout.
 */
export const hullLayoutFromMap = (map: WorldMap): HullFragment => {
  const rooms = hullRoomRecords(map);
  const connections = hullConnectionRecords(map, rooms);
  const utilityNodes = hullUtilityNodeRecords(map, rooms);
  return { rooms, connections, utilityNodes, roomStates: {}, gasConduits: {}, liquidConduits: {} };
};

const extractConduitStates = (
  state: GameState,
  connections: HullFragment["connections"]
): Pick<HullFragment, "gasConduits" | "liquidConduits"> => {
  const gasConduits: HullFragment["gasConduits"] = {};
  const liquidConduits: HullFragment["liquidConduits"] = {};
  for (const [id, connection] of Object.entries(connections)) {
    if (!isProcessLine(connection)) continue;
    const gas = state.gasConduits[id];
    if (gas) gasConduits[id] = deepCopy(gas);
    const liquid = state.liquidConduits[id];
    if (liquid) liquidConduits[id] = deepCopy(liquid);
  }
  return { gasConduits, liquidConduits };
};

export const extractHullFragment = (state: GameState): HullFragment => {
  const { rooms, connections, utilityNodes } = extractHullMapData(state);
  const roomStates: HullFragment["roomStates"] = {};
  for (const roomId of Object.keys(rooms)) {
    const roomState = state.rooms[roomId];
    if (roomState) roomStates[roomId] = deepCopy(roomState);
  }
  return {
    rooms,
    connections,
    utilityNodes,
    roomStates,
    ...extractConduitStates(state, connections),
  };
};

export interface HullOffset {
  columns: number;
  elevations: number;
}

const shiftCell = (cell: GridCell, offset: HullOffset): GridCell => ({
  column: cell.column + offset.columns,
  elevation: cell.elevation + offset.elevations,
});

const shiftRoom = (room: MapRoom, offset: HullOffset): MapRoom => ({
  ...room,
  bounds: {
    ...room.bounds,
    column: room.bounds.column + offset.columns,
    elevation: room.bounds.elevation + offset.elevations,
  },
  socketCells: Object.fromEntries(
    Object.entries(room.socketCells).flatMap(([socketId, cell]) =>
      cell ? [[socketId, shiftCell(cell, offset)]] : []
    )
  ),
  platformCells: room.platformCells.map((cell) => shiftCell(cell, offset)),
  ladderCells: room.ladderCells.map((cell) => shiftCell(cell, offset)),
  hardpoints: room.hardpoints.map((hardpoint) => ({
    ...hardpoint,
    cell: shiftCell(hardpoint.cell, offset),
  })),
});

const shiftConnection = (connection: MapConnection, offset: HullOffset): MapConnection =>
  isProcessLine(connection)
    ? { ...connection, route: connection.route.map((cell) => shiftCell(cell, offset)) }
    : {
        ...connection,
        connectorCells: connection.connectorCells.map((cell) => shiftCell(cell, offset)),
        endpoints: [
          shiftCell(connection.endpoints[0], offset),
          shiftCell(connection.endpoints[1], offset),
        ],
        sillElevation: connection.sillElevation + offset.elevations,
      };

/**
 * Translate the fragment onto a produced map. Loud on id collisions and validation
 * failures — a producer that embeds an illegal hull has no legal output.
 */
export const embedHullFragment = (
  map: WorldMap,
  fragment: HullFragment,
  offset: HullOffset
): WorldMap => {
  const rooms = { ...map.rooms };
  for (const room of Object.values(fragment.rooms)) {
    if (room.id in rooms) throw new Error(`Hull room ${room.id} collides with a site room.`);
    rooms[room.id] = shiftRoom(deepCopy(room), offset);
  }
  const connections = { ...map.connections };
  for (const connection of Object.values(fragment.connections)) {
    if (connection.id in connections)
      throw new Error(`Hull connection ${connection.id} collides with a site connection.`);
    connections[connection.id] = shiftConnection(deepCopy(connection), offset);
  }
  const utilityNodes = { ...map.utilityNodes };
  for (const [nodeId, node] of Object.entries(fragment.utilityNodes)) {
    if (nodeId in utilityNodes)
      throw new Error(`Hull utility node ${nodeId} collides with a site.`);
    utilityNodes[nodeId] = { ...deepCopy(node), cell: shiftCell(node.cell, offset) };
  }
  const embedded: WorldMap = { ...map, rooms, connections, utilityNodes };
  const issues = validateWorldMap(embedded);
  if (issues.length > 0) {
    const detail = issues.map(({ path, message }) => path + ": " + message).join("; ");
    throw new Error(`Hull embedding rejected: ${detail}`);
  }
  return Object.freeze(embedded);
};

/** The conduit routes stored on state records must follow the embedded geometry. */
export const shiftFragmentStateRoutes = (
  fragment: HullFragment,
  offset: HullOffset
): HullFragment => ({
  ...fragment,
  gasConduits: Object.fromEntries(
    Object.entries(fragment.gasConduits).map(([id, conduit]) => [
      id,
      { ...deepCopy(conduit), route: conduit.route.map((cell) => shiftCell(cell, offset)) },
    ])
  ),
  liquidConduits: Object.fromEntries(
    Object.entries(fragment.liquidConduits).map(([id, conduit]) => [
      id,
      { ...deepCopy(conduit), route: conduit.route.map((cell) => shiftCell(cell, offset)) },
    ])
  ),
});

/** Translate the complete fragment, including geometry and live conduit routes. */
export const translateHullFragment = (
  fragment: HullFragment,
  offset: HullOffset
): HullFragment => ({
  ...shiftFragmentStateRoutes(fragment, offset),
  rooms: Object.fromEntries(
    Object.entries(fragment.rooms).map(([id, room]) => [id, shiftRoom(deepCopy(room), offset)])
  ),
  connections: Object.fromEntries(
    Object.entries(fragment.connections).map(([id, connection]) => [
      id,
      shiftConnection(deepCopy(connection), offset),
    ])
  ),
  utilityNodes: Object.fromEntries(
    Object.entries(fragment.utilityNodes).map(([id, node]) => [
      id,
      { ...deepCopy(node), cell: shiftCell(node.cell, offset) },
    ])
  ),
});

/**
 * Producers express anchors relative to the pack's seed hull. A traveling fragment may
 * already have been translated by a previous site, so align a shared hull room first.
 */
export const alignHullFragmentToMap = (
  fragment: HullFragment,
  reference: WorldMap
): HullFragment => {
  const anchorId = ["core", ...Object.keys(fragment.rooms).sort()].find(
    (roomId) => roomId in fragment.rooms && roomId in reference.rooms
  );
  if (!anchorId) throw new Error("The traveling hull has no room shared with the seed hull.");
  const actual = fragment.rooms[anchorId] as MapRoom;
  const target = reference.rooms[anchorId] as MapRoom;
  return translateHullFragment(fragment, {
    columns: target.bounds.column - actual.bounds.column,
    elevations: target.bounds.elevation - actual.bounds.elevation,
  });
};
