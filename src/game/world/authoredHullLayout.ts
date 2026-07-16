import { cell, orthogonalGridPath } from "../spatial";
import type { GridCell, RoomId } from "../types";
import {
  hullDockRoomId,
  translateHullFragment,
  type HullFragment,
  type HullOffset,
} from "./hullFragment";
import type { ArchitecturalConnection, MapRoom, WorldMap } from "./map";
import { isArchitectural, isProcessLine } from "./map";
import { routeConnection } from "./autoRouter";
import { embedHullFragment } from "./hullFragment";
import { validateWorldMap } from "./mapValidation";

const boundsOverlap = (left: MapRoom, right: MapRoom): boolean =>
  left.bounds.column < right.bounds.column + right.bounds.width &&
  left.bounds.column + left.bounds.width > right.bounds.column &&
  left.bounds.elevation < right.bounds.elevation + right.bounds.height &&
  left.bounds.elevation + left.bounds.height > right.bounds.elevation;

const shiftedRoomBounds = (room: MapRoom, offset: HullOffset): MapRoom => ({
  ...room,
  bounds: {
    ...room.bounds,
    column: room.bounds.column + offset.columns,
    elevation: room.bounds.elevation + offset.elevations,
  },
});

const hullOverlapsSite = (map: WorldMap, hull: HullFragment, offset: HullOffset): boolean =>
  Object.values(hull.rooms).some((hullRoom) =>
    Object.values(map.rooms).some((siteRoom) =>
      boundsOverlap(shiftedRoomBounds(hullRoom, offset), siteRoom)
    )
  );

const ladderColumn = (room: MapRoom, column: number): readonly GridCell[] =>
  Array.from({ length: room.bounds.height }, (_, index) =>
    cell(column, room.bounds.elevation + index)
  );

const withLadder = (room: MapRoom, column: number): MapRoom => ({
  ...room,
  ladderCells: [
    ...new Map(
      [...room.ladderCells, ...ladderColumn(room, column)].map((target) => [
        `${target.column}:${target.elevation}`,
        target,
      ])
    ).values(),
  ],
});

const siteDockRoomId = (
  map: WorldMap,
  crossConnections: readonly WorldMap["connections"][string][],
  hullRoomIds: ReadonlySet<RoomId>
): RoomId => {
  for (const connection of crossConnections) {
    if (!isArchitectural(connection)) continue;
    const siteRoomId = connection.rooms.find((roomId) => !hullRoomIds.has(roomId));
    if (siteRoomId && siteRoomId in map.rooms) return siteRoomId;
  }
  throw new Error("Authored site has no architectural room at the hull boundary.");
};

const bridgeConnection = (
  siteRoom: MapRoom,
  dockRoom: MapRoom
): { connection: ArchitecturalConnection; siteRoom: MapRoom; dockRoom: MapRoom } => {
  const siteEndpoint = cell(
    siteRoom.bounds.column + siteRoom.bounds.width - 1,
    siteRoom.bounds.elevation
  );
  const dockEndpoint = cell(dockRoom.bounds.column, dockRoom.bounds.elevation);
  const bridgeColumn = dockEndpoint.column - 1;
  const connectorCells = orthogonalGridPath(
    cell(siteEndpoint.column + 1, siteEndpoint.elevation),
    cell(bridgeColumn, siteEndpoint.elevation),
    cell(bridgeColumn, dockEndpoint.elevation)
  );
  return {
    siteRoom: withLadder(siteRoom, siteEndpoint.column),
    dockRoom: withLadder(dockRoom, dockEndpoint.column),
    connection: {
      id: "site_to_hull_dock",
      kind: "ladder_shaft",
      rooms: [siteRoom.id, dockRoom.id],
      connectorCells,
      endpoints: [siteEndpoint, dockEndpoint],
      orientation: "horizontal",
      sillElevation: Math.min(siteEndpoint.elevation, dockEndpoint.elevation),
      aperture: 1,
      gasConductance: 0.22,
      liquidConductance: 0.24,
      liquidMode: "drain",
      defaultOpen: true,
      defaultSealed: false,
      sealGroupId: "site_to_hull_seal",
      hostRoomId: siteRoom.id,
    },
  };
};

const rerouteCrossProcessLines = (
  map: WorldMap,
  crossConnections: readonly WorldMap["connections"][string][]
): WorldMap["connections"] => {
  const connections = { ...map.connections };
  for (const connection of crossConnections) {
    if (!isProcessLine(connection)) continue;
    const route = routeConnection(
      map,
      connection.kind,
      connection.direction[0],
      connection.direction[1]
    );
    if (!route) throw new Error(`Authored site cannot reroute ${connection.id} to the hull.`);
    connections[connection.id] = { ...connection, route };
  }
  return connections;
};

const validateAdaptedMap = (map: WorldMap): WorldMap => {
  const issues = validateWorldMap(map);
  if (issues.length > 0) {
    const detail = issues.map(({ path, message }) => `${path}: ${message}`).join("; ");
    throw new Error(`Authored hull layout rejected: ${detail}`);
  }
  return Object.freeze(map);
};

export interface AuthoredHullLayout {
  map: WorldMap;
  hull: HullFragment;
}

const expandedHullOffset = (
  source: WorldMap,
  hull: HullFragment,
  offset: HullOffset
): HullOffset => ({
  columns:
    offset.columns +
    Math.max(
      ...Object.values(source.rooms).map((room) => room.bounds.column + room.bounds.width - 1)
    ) -
    Math.min(...Object.values(hull.rooms).map((room) => room.bounds.column)) +
    2,
  elevations: offset.elevations,
});

/**
 * Embed an enlarged hull at an authored site. A footprint collision moves the complete
 * hull outward, bridges the site's old boundary room to the current hull dock, and
 * reroutes every process line that crosses that boundary.
 */
export const layoutHullAtAuthoredSite = (
  source: WorldMap,
  hull: HullFragment,
  offset: HullOffset
): AuthoredHullLayout => {
  if (!hullOverlapsSite(source, hull, offset)) {
    return {
      map: embedHullFragment(source, hull, offset),
      hull: translateHullFragment(hull, offset),
    };
  }
  const hullRoomIds = new Set(Object.keys(hull.rooms));
  const translation = expandedHullOffset(source, hull, offset);
  const translated = translateHullFragment(hull, translation);
  const crossConnections = Object.values(source.connections).filter((connection) =>
    connection.rooms.some((roomId) => hullRoomIds.has(roomId))
  );
  const siteConnections = Object.fromEntries(
    Object.entries(source.connections).filter(([, connection]) =>
      connection.rooms.every((roomId) => !hullRoomIds.has(roomId))
    )
  );
  const core = translated.rooms.core;
  if (!core) throw new Error("The traveling hull has no Core room.");
  const coreColumnShift = translation.columns;
  const base: WorldMap = {
    ...source,
    width: Math.max(
      source.width,
      ...Object.values(translated.rooms).map((room) => room.bounds.column + room.bounds.width + 1)
    ),
    coreAnchor: {
      ...source.coreAnchor,
      column: source.coreAnchor.column + coreColumnShift,
    },
    coreBreachCell: {
      ...source.coreBreachCell,
      column: source.coreBreachCell.column + coreColumnShift,
    },
    connections: siteConnections,
    utilityNodes: Object.fromEntries(
      Object.entries(source.utilityNodes).map(([id, node]) => [
        id,
        node && hullRoomIds.has(node.hostRoomId)
          ? { ...node, cell: { ...node.cell, column: node.cell.column + coreColumnShift } }
          : node,
      ])
    ),
  };
  const embedded = embedHullFragment(base, translated, { columns: 0, elevations: 0 });
  const siteRoomId = siteDockRoomId(source, crossConnections, hullRoomIds);
  const dockRoomId = hullDockRoomId(embedded);
  const bridge = bridgeConnection(
    embedded.rooms[siteRoomId] as MapRoom,
    embedded.rooms[dockRoomId] as MapRoom
  );
  const bridged: WorldMap = {
    ...embedded,
    rooms: {
      ...embedded.rooms,
      [siteRoomId]: bridge.siteRoom,
      [dockRoomId]: bridge.dockRoom,
    },
    connections: { ...embedded.connections, [bridge.connection.id]: bridge.connection },
  };
  return {
    map: validateAdaptedMap({
      ...bridged,
      connections: rerouteCrossProcessLines(bridged, crossConnections),
    }),
    hull: translated,
  };
};
