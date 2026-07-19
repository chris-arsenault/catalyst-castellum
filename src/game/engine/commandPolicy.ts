import type { GameDefinition } from "../definitionTypes";
import type {
  CommandDecision,
  CommandRejectionCode,
  EquipmentInstance,
  GameCommand,
  GameState,
  RoomId,
  ConnectionId,
} from "../types";
import { equipmentAvailable, nextLevelIdFor, connectionAvailable } from "./campaign";
import { equipmentDismantleRefund, findEquipmentInstallation, roomSocketIds } from "./equipment";
import { roomUsableVolume } from "./physics";
import { gasAmountTotal, liquidAmountTotal } from "./roomState";
import { phaseAllowsCommand } from "./phaseModel";
import { gasConduitState, liquidConduitState, roomState } from "../world/instances";
import { isProcessLine, processLineId } from "../world/map";
import { plannedLineConnection } from "../world/processLineEdits";
import { graftParentJoint, plannedGraft } from "../world/graft";
import {
  evaluateHullCellEdit,
  evaluateHullCellEdits,
  evaluateConnectHullRooms,
  evaluateRemoveHullConnection,
  evaluateHullPortalConfiguration,
  evaluateSetPortal,
  portalStatesForMap,
  topologyHasRoutes,
} from "./hullCommandPolicy";
import { evaluateSupplyCharge } from "./supplyCommandPolicy";

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

const configurationUnlocked = (state: GameState): boolean =>
  state.phase === "build" || state.phase === "prime";

const simulationActive = (state: GameState): boolean =>
  state.phase === "prime" || state.phase === "assault";

const equipmentFits = (
  state: GameState,
  roomId: RoomId,
  socketId: keyof GameState["rooms"][RoomId]["equipment"],
  instance: EquipmentInstance,
  definition: GameDefinition
): boolean => {
  const room = roomState(state, roomId);
  const candidate = {
    ...room,
    equipment: { ...room.equipment, [socketId]: instance },
  };
  return roomUsableVolume(candidate, definition) - liquidAmountTotal(room.liquid) >= 8;
};

const evaluateInstallationPlacement = (
  state: GameState,
  command: Extract<GameCommand, { type: "install_equipment" }>,
  cost: number,
  gameDefinition: GameDefinition
): CommandDecision | null => {
  const definition = gameDefinition.equipment[command.equipmentId];
  if (!equipmentAvailable(state, command.equipmentId)) return reject("unavailable", { cost });
  if (!roomSocketIds(command.roomId, state).includes(command.socketId))
    return reject("placement", { cost });
  if (roomState(state, command.roomId).equipment[command.socketId])
    return reject("occupied_socket", { cost });
  if (definition.unique && findEquipmentInstallation(state, command.equipmentId, gameDefinition))
    return reject("unique_equipment", { cost });
  return null;
};

const evaluateInstall = (
  state: GameState,
  command: Extract<GameCommand, { type: "install_equipment" }>,
  gameDefinition: GameDefinition
): CommandDecision => {
  if (state.phase !== "build") return reject("invalid_phase");
  const definition = gameDefinition.equipment[command.equipmentId];
  const cost = definition.buildCost;
  const placement = evaluateInstallationPlacement(state, command, cost, gameDefinition);
  if (placement) return placement;
  const instance: EquipmentInstance = {
    equipmentId: command.equipmentId,
    level: 1,
    enabled: true,
    operation: null,
  };
  if (!equipmentFits(state, command.roomId, command.socketId, instance, gameDefinition))
    return reject("capacity", { cost });
  if (state.matter < cost) return reject("insufficient_matter", { cost });
  return allow({ cost });
};

const evaluateToggleEquipment = (
  state: GameState,
  command: Extract<GameCommand, { type: "toggle_equipment" }>
): CommandDecision => {
  if (!configurationUnlocked(state)) return reject("invalid_phase");
  if (!roomState(state, command.roomId).equipment[command.socketId]) return reject("empty_socket");
  return allow();
};

const evaluateUpgrade = (
  state: GameState,
  command: Extract<GameCommand, { type: "upgrade_equipment" }>,
  gameDefinition: GameDefinition
): CommandDecision => {
  if (state.phase !== "build") return reject("invalid_phase");
  const instance = roomState(state, command.roomId).equipment[command.socketId];
  if (!instance) return reject("empty_socket");
  if (instance.level >= 3) return reject("already_complete");
  const definition = gameDefinition.equipment[instance.equipmentId];
  const cost = definition.upgradeCosts[instance.level === 1 ? 0 : 1];
  const upgraded: EquipmentInstance = {
    ...instance,
    level: instance.level === 1 ? 2 : 3,
  };
  if (!equipmentFits(state, command.roomId, command.socketId, upgraded, gameDefinition))
    return reject("capacity", { cost });
  if (state.matter < cost) return reject("insufficient_matter", { cost });
  return allow({ cost });
};

const evaluateDismantleEquipment = (
  state: GameState,
  command: Extract<GameCommand, { type: "dismantle_equipment" }>,
  definition: GameDefinition
): CommandDecision => {
  if (state.phase !== "build") return reject("invalid_phase");
  const instance = roomState(state, command.roomId).equipment[command.socketId];
  if (!instance) return reject("empty_socket");
  const retainedOutput = Object.values(instance.operation?.outputs ?? {}).some((output) =>
    output?.phase === "gas"
      ? gasAmountTotal(output.gas) > 1e-8
      : output?.phase === "liquid" && liquidAmountTotal(output.liquid) > 1e-8
  );
  if (retainedOutput) return reject("retained_inventory");
  return allow({ refund: equipmentDismantleRefund(instance, definition) });
};

const evaluateSetConduit = (
  state: GameState,
  command: Extract<GameCommand, { type: "set_conduit" }>
): CommandDecision => {
  if (!configurationUnlocked(state)) return reject("invalid_phase");
  if (!connectionAvailable(state, command.connectionId)) return reject("unavailable");
  if (!(command.connectionId in state.map.connections)) return reject("not_installed");
  return allow();
};

const lineFor = (state: GameState, connectionId: ConnectionId) => {
  const connection = state.map.connections[connectionId];
  return connection && isProcessLine(connection) ? connection : null;
};

/** The pair's line as a build would create it. Existing map lines are already physical. */
export const buildableLineFor = (
  state: GameState,
  command: Extract<GameCommand, { type: "build_connection" }>,
  gameDefinition: GameDefinition
) => {
  return plannedLineConnection(
    gameDefinition,
    state.map,
    command.kind,
    command.fromRoomId,
    command.toRoomId
  );
};

const evaluateBuildConnection = (
  state: GameState,
  command: Extract<GameCommand, { type: "build_connection" }>,
  gameDefinition: GameDefinition
): CommandDecision => {
  if (state.phase !== "build") return reject("invalid_phase");
  const connectionId = processLineId(command.kind, command.fromRoomId, command.toRoomId);
  const hullInternal = [command.fromRoomId, command.toRoomId].every(
    (roomId) => state.map.rooms[roomId]?.provenance === "hull"
  );
  if (!connectionAvailable(state, connectionId) && !hullInternal) return reject("unavailable");
  const existing = lineFor(state, connectionId);
  if (existing) return reject("already_installed", { cost: existing.buildCost });
  const line = buildableLineFor(state, command, gameDefinition);
  if (!line) return reject("route_unavailable");
  if (state.matter < line.buildCost) return reject("insufficient_matter", { cost: line.buildCost });
  return allow({ cost: line.buildCost });
};

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
    state.map,
    command.hostRoomId,
    command.hardpointId,
    command.moduleId
  );
  if (!plan) return reject("placement");
  if (!topologyHasRoutes(state, plan.map, portalStatesForMap(state, plan.map), gameDefinition))
    return reject("route_unavailable");
  if (state.matter < plan.cost) return reject("insufficient_matter", { cost: plan.cost });
  return allow({ cost: plan.cost });
};

/** Rooms always hold atmosphere; only equipment, liquids, and non-ambient gases block. */
const graftedRoomIsClear = (
  state: GameState,
  gameDefinition: GameDefinition,
  roomId: string
): boolean => {
  const room = state.rooms[roomId];
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
  const room = state.map.rooms[command.roomId];
  if (!room || !command.roomId.startsWith("graft:")) return reject("placement");
  const parentJoint = graftParentJoint(state.map, command.roomId);
  if (!parentJoint) return reject("placement");
  const attached = Object.values(state.map.connections).filter(
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
  const room = state.map.rooms[roomId];
  if (!room) return null;
  const prefix = room.code.split("-")[0] ?? "";
  return (
    Object.values(gameDefinition.modules).find((template) => template.codePrefix === prefix)?.id ??
    null
  );
};

const evaluateDismantleConnection = (
  state: GameState,
  command: Extract<GameCommand, { type: "dismantle_connection" }>
): CommandDecision => {
  if (state.phase !== "build") return reject("invalid_phase");
  if (!connectionAvailable(state, command.connectionId)) return reject("unavailable");
  const line = lineFor(state, command.connectionId);
  if (!line) return reject("route_unavailable");
  const amount =
    line.kind === "gas_line"
      ? gasAmountTotal(gasConduitState(state, command.connectionId).gas)
      : liquidAmountTotal(liquidConduitState(state, command.connectionId).liquid);
  const refund = Math.floor(line.buildCost * 0.75);
  if (amount > 0.001) return reject("capacity", { refund });
  return allow({ refund });
};

const requirePhase = (state: GameState, phase: GameState["phase"]): CommandDecision =>
  state.phase === phase ? allow() : reject("invalid_phase");

const evaluateSkipTutorial = (state: GameState): CommandDecision =>
  state.phase === "level_briefing" && state.campaign.levelId === "flash_point"
    ? allow()
    : reject("invalid_phase");

const evaluateStartNextLevel = (state: GameState, definition: GameDefinition): CommandDecision => {
  if (state.phase !== "level_complete") return reject("invalid_phase");
  return nextLevelIdFor(state.campaign.levelId, definition) ? allow() : reject("already_complete");
};

const evaluateDockAtSite = (state: GameState, definition: GameDefinition): CommandDecision => {
  if (state.phase !== "travel") return reject("invalid_phase");
  return nextLevelIdFor(state.campaign.levelId, definition) ? allow() : reject("already_complete");
};

const evaluateLiveControl = (state: GameState): CommandDecision =>
  simulationActive(state) ? allow() : reject("invalid_phase");

/* eslint-disable complexity -- Exhaustive policy over the public command union is intentional. */
export const evaluateCommand = (
  state: GameState,
  command: GameCommand,
  definition: GameDefinition
): CommandDecision => {
  if (!phaseAllowsCommand(state.phase, command.type)) return reject("invalid_phase");
  switch (command.type) {
    case "install_equipment":
      return evaluateInstall(state, command, definition);
    case "toggle_equipment":
      return evaluateToggleEquipment(state, command);
    case "upgrade_equipment":
      return evaluateUpgrade(state, command, definition);
    case "dismantle_equipment":
      return evaluateDismantleEquipment(state, command, definition);
    case "set_conduit":
      return evaluateSetConduit(state, command);
    case "build_connection":
      return evaluateBuildConnection(state, command, definition);
    case "dismantle_connection":
      return evaluateDismantleConnection(state, command);
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
    case "set_portal":
      return evaluateSetPortal(state, command, definition);
    case "charge_gas_source":
    case "charge_liquid_source":
      return evaluateSupplyCharge(state, command, definition);
    case "start_prime":
      return requirePhase(state, "build");
    case "start_assault":
      return requirePhase(state, "prime");
    case "begin_level":
      return requirePhase(state, "level_briefing");
    case "skip_tutorial":
      return evaluateSkipTutorial(state);
    case "continue_round":
      return requirePhase(state, "round_result");
    case "start_next_level":
      return evaluateStartNextLevel(state, definition);
    case "dock_at_site":
      return evaluateDockAtSite(state, definition);
    case "retry_level":
      return requirePhase(state, "defeat");
    case "toggle_pause":
    case "set_pause":
      return evaluateLiveControl(state);
    case "set_speed":
      return evaluateLiveControl(state);
  }
};
/* eslint-enable complexity */
