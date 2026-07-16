import type {
  GameState,
  GasConduitState,
  GridCell,
  LiquidConduitState,
  RoomId,
  RoomState,
  ConnectionId,
} from "../types";
import type { MapConnection, MapRoom, WorldMap } from "./map";
import { isProcessLine } from "./map";
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
  roomStates: Record<RoomId, RoomState>;
  gasConduits: Record<ConnectionId, GasConduitState>;
  liquidConduits: Record<ConnectionId, LiquidConduitState>;
}

const deepCopy = <Value>(value: Value): Value => structuredClone(value);

const extractHullMapData = (state: GameState): Pick<HullFragment, "rooms" | "connections"> => {
  const rooms: HullFragment["rooms"] = {};
  for (const room of Object.values(state.map.rooms)) {
    if (room.provenance === "hull") rooms[room.id] = deepCopy(room);
  }
  const connections: HullFragment["connections"] = {};
  for (const connection of Object.values(state.map.connections)) {
    if (connection.rooms.every((roomId) => roomId in rooms))
      connections[connection.id] = deepCopy(connection);
  }
  return { rooms, connections };
};

/**
 * Fresh scenario/check tooling needs the authored hull geometry before live room state exists.
 * The scenario factory fills empty state records from the destination level's loadout.
 */
export const hullLayoutFromMap = (map: WorldMap): HullFragment => {
  const rooms: HullFragment["rooms"] = Object.fromEntries(
    Object.entries(map.rooms)
      .filter(([, room]) => room.provenance === "hull")
      .map(([id, room]) => [id, deepCopy(room)])
  );
  const connections: HullFragment["connections"] = Object.fromEntries(
    Object.entries(map.connections)
      .filter(([, connection]) => connection.rooms.every((roomId) => roomId in rooms))
      .map(([id, connection]) => [id, deepCopy(connection)])
  );
  return { rooms, connections, roomStates: {}, gasConduits: {}, liquidConduits: {} };
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
  const { rooms, connections } = extractHullMapData(state);
  const roomStates: HullFragment["roomStates"] = {};
  for (const roomId of Object.keys(rooms)) {
    const roomState = state.rooms[roomId];
    if (roomState) roomStates[roomId] = deepCopy(roomState);
  }
  return { rooms, connections, roomStates, ...extractConduitStates(state, connections) };
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
  const embedded: WorldMap = { ...map, rooms, connections };
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
