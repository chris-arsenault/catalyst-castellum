import type { GameDefinition } from "../definitionTypes";
import type { RoomId } from "../types";
import type { ArchitecturalConnection, Hardpoint, MapRoom, WorldMap } from "./map";
import { isArchitectural } from "./map";
import { hullPlanningMap } from "./hullFragment";
import { withGraft } from "./mapEdits";
import {
  graftedJointId,
  graftedRoomId,
  hardpointOccupied,
  instantiateJoint,
  instantiateModuleRoom,
  type ModuleId,
} from "./modules";

export interface GraftPlan {
  room: MapRoom;
  joint: ArchitecturalConnection;
  cost: number;
  /** The edited map, already validated — the executor commits exactly this. */
  map: WorldMap;
}

const hardpointOn = (map: WorldMap, roomId: RoomId, hardpointId: string): Hardpoint | null =>
  map.rooms[roomId]?.hardpoints.find((hardpoint) => hardpoint.id === hardpointId) ?? null;

/** Deterministic display code: next index for the module's prefix on this map. */
const graftedCode = (map: WorldMap, prefix: string): string => {
  const taken = Object.values(map.rooms).filter((room) => room.code.startsWith(`${prefix}-`));
  return `${prefix}-${taken.length + 1}`;
};

const planCache = new WeakMap<WorldMap, Map<string, GraftPlan | null>>();

/**
 * Plan a graft: instantiate the template at the hardpoint and validate the edited map.
 * Null when the hardpoint is missing/occupied, the module is unknown, the host is not
 * hull provenance, or the placement violates a map invariant (overlap, bounds).
 */
export const plannedGraft = (
  definition: GameDefinition,
  map: WorldMap,
  hostRoomId: RoomId,
  hardpointId: string,
  moduleId: ModuleId
): GraftPlan | null => {
  let plans = planCache.get(map);
  if (!plans) {
    plans = new Map();
    planCache.set(map, plans);
  }
  const key = `${hostRoomId}\u0000${hardpointId}\u0000${moduleId}`;
  if (plans.has(key)) return plans.get(key) ?? null;
  const plan = computeGraftPlan(definition, map, hostRoomId, hardpointId, moduleId);
  plans.set(key, plan);
  return plan;
};

const computeGraftPlan = (
  definition: GameDefinition,
  map: WorldMap,
  hostRoomId: RoomId,
  hardpointId: string,
  moduleId: ModuleId
): GraftPlan | null => {
  const planningMap = hullPlanningMap(map);
  const host = planningMap.rooms[hostRoomId];
  const template = definition.modules[moduleId];
  const hardpoint = hardpointOn(planningMap, hostRoomId, hardpointId);
  if (!host || host.provenance !== "hull" || !template || !hardpoint) return null;
  if (hardpointOccupied(planningMap, hostRoomId, hardpointId)) return null;
  if (graftedRoomId(hostRoomId, hardpointId) in planningMap.rooms) return null;
  const room = instantiateModuleRoom(
    template,
    hostRoomId,
    hardpoint,
    graftedCode(planningMap, template.codePrefix)
  );
  const joint = instantiateJoint(template, hostRoomId, hardpoint, room.id);
  const expandedMap: WorldMap = {
    ...planningMap,
    width: Math.max(planningMap.width, room.bounds.column + room.bounds.width),
    height: Math.max(planningMap.height, room.bounds.elevation + room.bounds.height),
  };
  try {
    return {
      room,
      joint,
      cost: template.graftCost,
      map: hullPlanningMap(withGraft(expandedMap, room, joint)),
    };
  } catch {
    return null;
  }
};

/** The joint whose host created a grafted room; child joints point away from it. */
export const graftParentJoint = (map: WorldMap, roomId: RoomId): ArchitecturalConnection | null =>
  (Object.values(map.connections).find(
    (connection) =>
      isArchitectural(connection) &&
      connection.id.startsWith("joint:") &&
      !connection.id.startsWith("joint:bridge:") &&
      connection.rooms[1] === roomId
  ) as ArchitecturalConnection | undefined) ?? null;

export { graftedJointId, graftedRoomId };
