import type { GameDefinition } from "../definitionTypes";
import type { CommandDecision, CommandRejectionCode, GameCommand, GameState } from "../types";
import { nextLevelIdFor } from "./campaign";
import { phaseAllowsCommand } from "./phaseModel";
import { graftParentJoint, plannedGraft } from "../world/graft";
import {
  evaluateHullCellEdit,
  evaluateHullCellEdits,
  evaluateConnectHullRooms,
  evaluateRemoveHullConnection,
  evaluateHullPortalConfiguration,
  portalStatesForMap,
  topologyHasRoutes,
} from "./hullCommandPolicy";
import { createEncounterRuntime } from "../encounter/runtime";
import { campaignEncounterContext } from "./campaignEncounter";

const allow = (
  values: Partial<Pick<CommandDecision, "amount" | "cost" | "refund">> = {}
): CommandDecision => ({
  allowed: true,
  code: null,
  parameters: {},
  amount: values.amount ?? 0,
  cost: values.cost ?? 0,
  refund: values.refund ?? 0,
});
const reject = (
  code: CommandRejectionCode,
  values: Partial<Pick<CommandDecision, "amount" | "cost" | "refund">> = {}
): CommandDecision => ({ ...allow(values), allowed: false, code, parameters: values });

/** Grafting belongs to the cleared-site intermission, before the next site is revealed. */
const atGraftIntermission = (state: GameState): boolean => state.phase === "level_complete";

const evaluateGraftModule = (
  state: GameState,
  command: Extract<GameCommand, { type: "graft_module" }>,
  gameDefinition: GameDefinition
): CommandDecision => {
  if (!atGraftIntermission(state)) return reject("invalid_phase");
  const plan = plannedGraft(
    gameDefinition,
    state.encounter.map,
    command.hostRoomId,
    command.graftSlotId,
    command.moduleId
  );
  if (!plan) return reject("placement");
  if (!topologyHasRoutes(state, plan.map, portalStatesForMap(state, plan.map), gameDefinition))
    return reject("route_unavailable");
  if (state.encounter.matter < plan.cost) return reject("insufficient_matter", { cost: plan.cost });
  return allow({ cost: plan.cost });
};

/** Rooms always hold atmosphere; only equipment, liquids, and non-ambient gases block. */
const graftedRoomIsClear = (
  state: GameState,
  gameDefinition: GameDefinition,
  roomId: string
): boolean => {
  const room = state.encounter.process.rooms[roomId];
  if (!room) return false;
  const hasEquipment = Object.values(room.equipment).some((instance) => instance !== null);
  const nonAmbientGas = (Object.keys(room.gas.lower) as (keyof typeof room.gas.lower)[])
    .filter((species) => (gameDefinition.ambientGas[species] ?? 0) <= 0)
    .reduce((total, species) => total + room.gas.lower[species] + room.gas.upper[species], 0);
  const liquid = Object.values(room.liquid).reduce((total, amount) => total + amount, 0);
  return !hasEquipment && nonAmbientGas + liquid < ROOM_CLEAR_EPSILON;
};

const evaluateDismantleModule = (
  state: GameState,
  command: Extract<GameCommand, { type: "dismantle_module" }>,
  gameDefinition: GameDefinition
): CommandDecision => {
  if (!atGraftIntermission(state)) return reject("invalid_phase");
  const room = state.encounter.map.rooms[command.roomId];
  if (!room || !command.roomId.startsWith("graft:")) return reject("placement");
  const parentJoint = graftParentJoint(state.encounter.map, command.roomId);
  if (!parentJoint) return reject("placement");
  const attached = Object.values(state.encounter.map.connections).filter(
    (connection) => connection.rooms.includes(command.roomId) && connection.id !== parentJoint.id
  );
  if (attached.length > 0) return reject("capacity");
  if (!graftedRoomIsClear(state, gameDefinition, command.roomId)) return reject("capacity");
  const moduleId = graftModuleIdFor(state, gameDefinition, command.roomId);
  const refund = moduleId
    ? Math.floor((gameDefinition.modules[moduleId]?.graftCost ?? 0) * 0.75)
    : 0;
  return allow({ refund });
};

const ROOM_CLEAR_EPSILON = 0.5;

/** Recover the template from the grafted room's shape (code prefix). */
const graftModuleIdFor = (
  state: GameState,
  gameDefinition: GameDefinition,
  roomId: string
): string | null => {
  const room = state.encounter.map.rooms[roomId];
  if (!room) return null;
  const prefix = room.code.split("-")[0] ?? "";
  return (
    Object.values(gameDefinition.modules).find((template) => template.codePrefix === prefix)?.id ??
    null
  );
};

/* eslint-disable complexity -- Exhaustive policy dispatch keeps the public command union visible. */
export const evaluateCommand = (
  state: GameState,
  command: GameCommand,
  definition: GameDefinition
): CommandDecision => {
  if (!phaseAllowsCommand(state.phase, command.type)) return reject("invalid_phase");
  switch (command.type) {
    case "graft_module":
      return evaluateGraftModule(state, command, definition);
    case "dismantle_module":
      return evaluateDismantleModule(state, command, definition);
    case "edit_hull_cell":
      return evaluateHullCellEdit(state, command, definition);
    case "edit_hull_cells":
      return evaluateHullCellEdits(state, command, definition);
    case "connect_hull_rooms":
      return evaluateConnectHullRooms(state, command, definition);
    case "remove_hull_connection":
      return evaluateRemoveHullConnection(state, command, definition);
    case "configure_hull_portal":
      return evaluateHullPortalConfiguration(state, command, definition);
    case "begin_level":
    case "continue_round":
    case "retry_level":
      return allow();
    case "start_next_level":
    case "dock_at_site":
      return nextLevelIdFor(state.campaign.levelId, definition)
        ? allow()
        : reject("already_complete");
    case "toggle_pause":
    case "set_pause":
    case "set_speed":
      return reject("invalid_phase");
    default:
      return createEncounterRuntime(campaignEncounterContext(state, definition)).evaluate(
        state.encounter,
        command
      );
  }
};
