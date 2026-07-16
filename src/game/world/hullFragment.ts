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
