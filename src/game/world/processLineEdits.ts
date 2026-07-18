import type { GameDefinition } from "../definitionTypes";
import type { RoomId } from "../types";
import { routeConnection } from "./autoRouter";
import type { LineSpec, ProcessLineConnection, ProcessLineKind, WorldMap } from "./map";
import { isArchitectural, processLineId } from "./map";
import { validateWorldMap } from "./mapValidation";

export const lineBuildCost = (spec: LineSpec, routeLength: number): number =>
  Math.round(spec.baseCost + spec.costPerCell * routeLength);

const plannedCache = new WeakMap<WorldMap, Map<string, ProcessLineConnection | null>>();

/** One ordered construction request on one immutable map has one deterministic plan. */
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
  const key = `${kind}:${fromRoomId}>${toRoomId}`;
  if (!plans.has(key))
    plans.set(key, mintLineConnection(definition, map, kind, fromRoomId, toRoomId));
  return plans.get(key) ?? null;
};

/** Remove one physical process connection from a live map. */
export const withoutConnection = (map: WorldMap, connectionId: string): WorldMap => {
  const connection = map.connections[connectionId];
  if (!connection || isArchitectural(connection))
    throw new Error(`Unknown process connection instance: ${connectionId}`);
  const connections = { ...map.connections };
  delete connections[connectionId];
  const edited = { ...map, connections };
  const issues = validateWorldMap(edited);
  if (issues.length > 0) {
    const detail = issues.map(({ path, message }) => `${path}: ${message}`).join("; ");
    throw new Error(`Connection removal rejected: ${detail}`);
  }
  return Object.freeze(edited);
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
  const seed = definition.lineBlueprints[id];
  if (
    seed &&
    seed.kind === kind &&
    seed.direction[0] === fromRoomId &&
    seed.direction[1] === toRoomId
  ) {
    const seeded = { ...seed, route: seed.route.map((target) => ({ ...target })) };
    const seededMap = { ...map, connections: { ...map.connections, [id]: seeded } };
    if (validateWorldMap(seededMap).length === 0) return seeded;
  }
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
