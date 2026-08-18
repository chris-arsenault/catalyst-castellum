import type { GameDefinition } from "../definitionTypes";
import type { RoomId } from "../types";
import type { ArchitecturalConnection, GraftSlot, MapRoom, WorldMap } from "./map";
import { isArchitectural } from "./map";
import { hullPlanningMap } from "./hullFragment";
import { withGraft } from "./mapEdits";
import {
  graftedJointId,
  graftedRoomId,
  graftSlotOccupied,
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

const graftSlotOn = (map: WorldMap, roomId: RoomId, graftSlotId: string): GraftSlot | null =>
  map.rooms[roomId]?.graftSlots.find((graftSlot) => graftSlot.id === graftSlotId) ?? null;

/** Deterministic display code: next index for the module's prefix on this map. */
const graftedCode = (map: WorldMap, prefix: string): string => {
  const taken = Object.values(map.rooms).filter((room) => room.code.startsWith(`${prefix}-`));
  return `${prefix}-${taken.length + 1}`;
};

const planCache = new WeakMap<WorldMap, Map<string, GraftPlan | null>>();

/**
 * Plan a graft: instantiate the template at the graft slot and validate the edited map.
 * Null when the graft slot is missing or occupied, the module is unknown, the host is not
 * hull provenance, or the placement violates a map invariant (overlap, bounds).
 */
export const plannedGraft = (
  definition: GameDefinition,
  map: WorldMap,
  hostRoomId: RoomId,
  graftSlotId: string,
  moduleId: ModuleId
): GraftPlan | null => {
  let plans = planCache.get(map);
  if (!plans) {
    plans = new Map();
    planCache.set(map, plans);
  }
  const key = `${hostRoomId}\u0000${graftSlotId}\u0000${moduleId}`;
  if (plans.has(key)) return plans.get(key) ?? null;
  const plan = computeGraftPlan(definition, map, hostRoomId, graftSlotId, moduleId);
  plans.set(key, plan);
  return plan;
};

const computeGraftPlan = (
  definition: GameDefinition,
  map: WorldMap,
  hostRoomId: RoomId,
  graftSlotId: string,
  moduleId: ModuleId
): GraftPlan | null => {
  const planningMap = hullPlanningMap(map);
  const host = planningMap.rooms[hostRoomId];
  const template = definition.modules[moduleId];
  const graftSlot = graftSlotOn(planningMap, hostRoomId, graftSlotId);
  if (!host || host.provenance !== "hull" || !template || !graftSlot) return null;
  if (graftSlotOccupied(planningMap, hostRoomId, graftSlotId)) return null;
  if (graftedRoomId(hostRoomId, graftSlotId) in planningMap.rooms) return null;
  const room = instantiateModuleRoom(
    template,
    hostRoomId,
    graftSlot,
    graftedCode(planningMap, template.codePrefix)
  );
  const joint = instantiateJoint(template, hostRoomId, graftSlot, room.id);
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
