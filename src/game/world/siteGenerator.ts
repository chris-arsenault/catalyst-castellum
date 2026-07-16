import { cell } from "../spatial";
import type { GridCell, RoomId } from "../types";
import { routeConnection } from "./autoRouter";
import { embedHullFragment, type HullFragment, type HullOffset } from "./hullFragment";
import type {
  ArchitecturalConnection,
  MapRoom,
  MapUtilityNode,
  ProcessLineConnection,
  WorldMap,
} from "./map";
import { architecturalConnections, processLineId } from "./map";
import { validateWorldMap } from "./mapValidation";
import { drawIndex, seededRandom, type RandomSource } from "./seededRandom";
import { candidateMetrics } from "./siteCandidateMetrics";
import type {
  GeneratedSiteSpec,
  SiteJoinDirection,
  SiteLayoutCandidate,
  SiteProcessLineSpec,
  SiteRoomChunk,
  SiteRoutePattern,
} from "./siteGeneratorTypes";

const shiftCell = (source: GridCell, offset: HullOffset): GridCell =>
  cell(source.column + offset.columns, source.elevation + offset.elevations);

const shiftUtilityNode = (node: MapUtilityNode, offset: HullOffset): MapUtilityNode => ({
  ...node,
  cell: shiftCell(node.cell, offset),
});

const translateRoom = (room: MapRoom, column: number, elevation: number): MapRoom => {
  const offset = { columns: column, elevations: elevation };
  return {
    ...room,
    bounds: { ...room.bounds, column, elevation },
    socketCells: Object.fromEntries(
      Object.entries(room.socketCells).flatMap(([socketId, socket]) =>
        socket ? [[socketId, shiftCell(socket, offset)]] : []
      )
    ),
    platformCells: room.platformCells.map((platform) => shiftCell(platform, offset)),
    ladderCells: room.ladderCells.map((ladder) => shiftCell(ladder, offset)),
    hardpoints: room.hardpoints.map((hardpoint) => ({
      ...hardpoint,
      cell: shiftCell(hardpoint.cell, offset),
    })),
  };
};

const alignedColumn = (width: number, next: MapRoom["bounds"], random: RandomSource): number => {
  const alignments = [
    next.column,
    next.column + Math.floor((next.width - width) / 2),
    next.column + next.width - width,
  ];
  return alignments[drawIndex(random, alignments.length)] as number;
};

const placeBefore = (
  chunk: SiteRoomChunk,
  next: MapRoom["bounds"],
  direction: SiteJoinDirection,
  random: RandomSource
): MapRoom => {
  const { width, height } = chunk.room.bounds;
  if (direction === "right") {
    return translateRoom(chunk.room, next.column - width - 1, next.elevation);
  }
  const column = alignedColumn(width, next, random);
  const elevation =
    direction === "up" ? next.elevation - height - 1 : next.elevation + next.height + 1;
  return translateRoom(chunk.room, column, elevation);
};

const ladderCells = (room: MapRoom, column: number): readonly GridCell[] =>
  Array.from({ length: room.bounds.height }, (_, index) =>
    cell(column, room.bounds.elevation + index)
  );

const withLadder = (room: MapRoom, column: number): MapRoom => ({
  ...room,
  ladderCells: [
    ...new Map(
      [...room.ladderCells, ...ladderCells(room, column)].map((ladder) => [
        `${ladder.column}:${ladder.elevation}`,
        ladder,
      ])
    ).values(),
  ],
});

const portalBase = (
  id: string,
  rooms: readonly [RoomId, RoomId],
  hostRoomId: RoomId
): Pick<
  ArchitecturalConnection,
  | "id"
  | "rooms"
  | "hostRoomId"
  | "defaultOpen"
  | "defaultSealed"
  | "sealGroupId"
  | "gasConductance"
  | "liquidConductance"
  | "aperture"
> => ({
  id,
  rooms,
  hostRoomId,
  defaultOpen: true,
  defaultSealed: false,
  sealGroupId: `site_seal:${id}`,
  gasConductance: 0.22,
  liquidConductance: 0.24,
  aperture: 1,
});

interface JoinedRooms {
  current: MapRoom;
  next: MapRoom;
  connection: ArchitecturalConnection;
}

const horizontalJoin = (current: MapRoom, next: MapRoom, id: string): JoinedRooms => {
  const elevation = current.bounds.elevation;
  const connector = cell(current.bounds.column + current.bounds.width, elevation);
  return {
    current,
    next,
    connection: {
      ...portalBase(id, [current.id, next.id], current.id),
      kind: "passage",
      connectorCells: [connector],
      endpoints: [cell(connector.column - 1, elevation), cell(connector.column + 1, elevation)],
      orientation: "horizontal",
      sillElevation: elevation,
      liquidMode: "spill",
    },
  };
};

const verticalJoin = (
  current: MapRoom,
  next: MapRoom,
  direction: "up" | "down",
  id: string
): JoinedRooms => {
  const overlapStart = Math.max(current.bounds.column, next.bounds.column);
  const overlapEnd = Math.min(
    current.bounds.column + current.bounds.width,
    next.bounds.column + next.bounds.width
  );
  const column = Math.floor((overlapStart + overlapEnd - 1) / 2);
  const currentIsLower = direction === "up";
  const lower = currentIsLower ? current : next;
  const connector = cell(column, lower.bounds.elevation + lower.bounds.height);
  const endpoints = currentIsLower
    ? ([cell(column, connector.elevation - 1), cell(column, connector.elevation + 1)] as const)
    : ([cell(column, connector.elevation + 1), cell(column, connector.elevation - 1)] as const);
  return {
    current: withLadder(current, column),
    next: withLadder(next, column),
    connection: {
      ...portalBase(id, [current.id, next.id], lower.id),
      kind: "ladder_shaft",
      connectorCells: [connector],
      endpoints,
      orientation: "vertical",
      sillElevation: connector.elevation,
      liquidMode: "drain",
    },
  };
};

const joinRooms = (
  current: MapRoom,
  next: MapRoom,
  direction: SiteJoinDirection,
  index: number
): JoinedRooms => {
  const id = `site_route_${index + 1}:${current.id}__${next.id}`;
  return direction === "right"
    ? horizontalJoin(current, next, id)
    : verticalJoin(current, next, direction, id);
};

const assertChunkOrder = (
  spec: GeneratedSiteSpec,
  chunks: ReadonlyMap<string, SiteRoomChunk>,
  order: readonly string[]
): void => {
  if (order.length !== chunks.size || new Set(order).size !== chunks.size)
    throw new Error(`${spec.id} chunk orders must contain every chunk exactly once.`);
  const unknown = order.find((id) => !chunks.has(id));
  if (unknown) throw new Error(`${spec.id} references chunk ${unknown}.`);
  const entry = chunks.get(order[0] as string)?.room;
  if (entry?.structure !== "entry") throw new Error(`${spec.id} chunk orders must begin at Entry.`);
};

const assertRoutePattern = (
  spec: GeneratedSiteSpec,
  chunkCount: number,
  pattern: SiteRoutePattern
): void => {
  if (pattern.directions.length !== chunkCount)
    throw new Error(`${spec.id}/${pattern.id} needs one join direction per chunk.`);
};

const assertSpec = (spec: GeneratedSiteSpec): void => {
  const chunks = new Map(spec.chunks.map((chunk) => [chunk.id, chunk]));
  if (chunks.size !== spec.chunks.length) throw new Error(`${spec.id} has duplicate chunk ids.`);
  if (spec.patterns.length === 0 || spec.chunkOrders.length === 0)
    throw new Error(`${spec.id} requires route patterns and chunk orders.`);
  spec.chunkOrders.forEach((order) => assertChunkOrder(spec, chunks, order));
  spec.patterns.forEach((pattern) => assertRoutePattern(spec, chunks.size, pattern));
};

const placeChunks = (
  spec: GeneratedSiteSpec,
  hullMap: WorldMap,
  order: readonly string[],
  pattern: SiteRoutePattern,
  random: RandomSource
): Record<RoomId, MapRoom> => {
  const catalog = new Map(spec.chunks.map((chunk) => [chunk.id, chunk]));
  const placed: Record<RoomId, MapRoom> = {};
  let next = hullMap.rooms[spec.dockRoomId];
  if (!next) throw new Error(`${spec.id} hull is missing dock room ${spec.dockRoomId}.`);
  for (let index = order.length - 1; index >= 0; index -= 1) {
    const chunk = catalog.get(order[index] as string);
    if (!chunk) throw new Error(`${spec.id} references unknown chunk ${order[index]}.`);
    const room = placeBefore(
      chunk,
      next.bounds,
      pattern.directions[index] as SiteJoinDirection,
      random
    );
    placed[room.id] = room;
    next = room;
  }
  return placed;
};

const assembleRoute = (
  spec: GeneratedSiteSpec,
  hullRooms: Readonly<Record<RoomId, MapRoom>>,
  siteRooms: Record<RoomId, MapRoom>,
  order: readonly string[],
  pattern: SiteRoutePattern
): { rooms: Record<RoomId, MapRoom>; connections: Record<string, ArchitecturalConnection> } => {
  const chunks = new Map(spec.chunks.map((chunk) => [chunk.id, chunk.room.id]));
  const routeRoomIds = order.map((id) => chunks.get(id) as RoomId);
  const rooms = { ...hullRooms, ...siteRooms };
  const connections: Record<string, ArchitecturalConnection> = {};
  for (let index = 0; index < routeRoomIds.length; index += 1) {
    const currentId = routeRoomIds[index] as RoomId;
    const nextId = routeRoomIds[index + 1] ?? spec.dockRoomId;
    const joined = joinRooms(
      rooms[currentId] as MapRoom,
      (rooms[nextId] ?? hullRooms[nextId]) as MapRoom,
      pattern.directions[index] as SiteJoinDirection,
      index
    );
    rooms[currentId] = joined.current;
    rooms[nextId] = joined.next;
    connections[joined.connection.id] = joined.connection;
  }
  return { rooms, connections };
};

const makeProcessLines = (
  map: WorldMap,
  specs: readonly SiteProcessLineSpec[]
): Record<string, ProcessLineConnection> =>
  Object.fromEntries(
    specs.map((spec) => {
      const id = processLineId(spec.kind, spec.rooms[0], spec.rooms[1]);
      const route = routeConnection(map, spec.kind, spec.direction[0], spec.direction[1]);
      if (!route) throw new Error(`Generated site cannot route ${id}.`);
      return [
        id,
        {
          ...spec,
          id,
          destinationKind: spec.destinationKind,
          route,
        } satisfies ProcessLineConnection,
      ];
    })
  );

const roomContainingEntry = (map: WorldMap): MapRoom | undefined =>
  Object.values(map.rooms).find(
    ({ bounds }) =>
      map.entryCell.column >= bounds.column &&
      map.entryCell.column < bounds.column + bounds.width &&
      map.entryCell.elevation >= bounds.elevation &&
      map.entryCell.elevation < bounds.elevation + bounds.height
  );

const architecturalNeighbors = (map: WorldMap): ReadonlyMap<RoomId, readonly RoomId[]> => {
  const neighbors = new Map<RoomId, RoomId[]>();
  for (const { rooms } of architecturalConnections(map)) {
    const [left, right] = rooms;
    neighbors.set(left, [...(neighbors.get(left) ?? []), right]);
    neighbors.set(right, [...(neighbors.get(right) ?? []), left]);
  }
  return neighbors;
};

const roomGraphReachesCore = (map: WorldMap): boolean => {
  const entryRoom = roomContainingEntry(map);
  if (!entryRoom || !("core" in map.rooms)) return false;
  const neighbors = architecturalNeighbors(map);
  const queue: RoomId[] = [entryRoom.id];
  const visited = new Set<RoomId>(queue);
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const roomId = queue[cursor] as RoomId;
    if (roomId === "core") return true;
    for (const neighbor of neighbors.get(roomId) ?? []) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      queue.push(neighbor);
    }
  }
  return false;
};

const assertGeneratedMap = (spec: GeneratedSiteSpec, map: WorldMap): void => {
  const issues = validateWorldMap(map);
  if (issues.length > 0) {
    const detail = issues.map(({ path, message }) => `${path}: ${message}`).join("; ");
    throw new Error(`${spec.id} generated an invalid map: ${detail}`);
  }
  if (!roomGraphReachesCore(map)) throw new Error(`${spec.id} has no Entry-to-Core room route.`);
};

export const generateSiteLayoutCandidate = (
  spec: GeneratedSiteSpec,
  hull: HullFragment,
  seed: number
): SiteLayoutCandidate => {
  assertSpec(spec);
  const random = seededRandom(seed);
  const order = spec.chunkOrders[drawIndex(random, spec.chunkOrders.length)] as readonly string[];
  const pattern = spec.patterns[drawIndex(random, spec.patterns.length)] as SiteRoutePattern;
  const translatedUtilityNodes = Object.fromEntries(
    Object.entries(spec.utilityNodes).flatMap(([id, node]) =>
      node ? [[id, shiftUtilityNode(node, spec.hullAnchor)]] : []
    )
  );
  const emptyMap: WorldMap = {
    width: spec.width,
    height: spec.height,
    cellSize: spec.cellSize,
    ringRadii: spec.ringRadii,
    coreAnchor: shiftCell(spec.coreAnchor, spec.hullAnchor),
    coreBreachCell: shiftCell(spec.coreBreachCell, spec.hullAnchor),
    entryCell: cell(0, 0),
    rooms: {},
    connections: {},
    utilityNodes: translatedUtilityNodes,
  };
  const hullMap = embedHullFragment(emptyMap, hull, spec.hullAnchor);
  const placed = placeChunks(spec, hullMap, order, pattern, random);
  const route = assembleRoute(spec, hullMap.rooms, placed, order, pattern);
  const entryRoomId = spec.chunks.find((chunk) => chunk.room.structure === "entry")?.room.id;
  const entryRoom = entryRoomId ? route.rooms[entryRoomId] : undefined;
  if (!entryRoom) throw new Error(`${spec.id} has no placed Entry chunk.`);
  const architecturalMap: WorldMap = {
    ...hullMap,
    entryCell: cell(entryRoom.bounds.column, entryRoom.bounds.elevation),
    rooms: route.rooms,
    connections: { ...route.connections, ...hullMap.connections },
  };
  // Reject overlaps, bounds failures, and disconnected room graphs before running the
  // comparatively expensive process-line router for a candidate that cannot ship.
  assertGeneratedMap(spec, architecturalMap);
  const map: WorldMap = Object.freeze({
    ...architecturalMap,
    connections: {
      ...architecturalMap.connections,
      ...makeProcessLines(architecturalMap, spec.processLines),
    },
  });
  assertGeneratedMap(spec, map);
  return { seed, patternId: pattern.id, chunkOrder: [...order], map, ...candidateMetrics(map) };
};

export const generateSiteLayoutCandidates = (
  spec: GeneratedSiteSpec,
  hull: HullFragment,
  options: { seed: number; count: number },
  attemptLimit = Math.max(options.count * 12, 32)
): SiteLayoutCandidate[] => {
  const candidates: SiteLayoutCandidate[] = [];
  const signatures = new Set<string>();
  const errors: string[] = [];
  for (let attempt = 0; attempt < attemptLimit && candidates.length < options.count; attempt += 1) {
    const seed = (options.seed + attempt) >>> 0;
    try {
      const candidate = generateSiteLayoutCandidate(spec, hull, seed);
      const signature = JSON.stringify(
        Object.values(candidate.map.rooms)
          .filter((room) => room.provenance === "site")
          .map((room) => [room.id, room.bounds])
      );
      if (signatures.has(signature)) continue;
      signatures.add(signature);
      candidates.push(candidate);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  if (candidates.length < options.count) {
    const detail = [...new Set(errors)].slice(0, 3).join("; ");
    const suffix = detail ? ` ${detail}` : "";
    throw new Error(
      `${spec.id} produced ${candidates.length}/${options.count} unique candidates.${suffix}`
    );
  }
  return candidates;
};
