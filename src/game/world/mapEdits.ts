import type { GameDefinition } from "../definitionTypes";
import type { RoomId } from "../types";
import { routeConnection } from "./autoRouter";
import type {
  LineSpec,
  MapConnection,
  ProcessLineConnection,
  ProcessLineKind,
  WorldMap,
} from "./map";
import { processLineId } from "./map";
import { validateWorldMap } from "./mapValidation";

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
