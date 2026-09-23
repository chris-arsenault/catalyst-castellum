import type {
  CommandDecision,
  CommandRejectionCode,
  EquipmentInstance,
  GameCommand,
  RoomId,
  ConnectionId,
} from "../types";
import {
  dismantleRefundRatio,
  equipmentDismantleRefund,
  findEquipmentInstallation,
  roomSocketIds,
} from "../engine/equipment";
import { roomUsableVolume } from "../engine/physics";
import { gasAmountTotal, liquidAmountTotal } from "../engine/roomState";
import { gasConduitState, liquidConduitState, roomState } from "../world/instances";
import { isProcessLine, processLineId } from "../world/map";
import { plannedLineConnection } from "../world/processLineEdits";
import { evaluateSupplyCharge } from "../engine/supplyCommandPolicy";
import { processDefinitionForMap } from "./processDefinition";
import type {
  ProcessEncounterState,
  ProcessEncounterContext,
  ProcessSimulationDefinition,
} from "./processTypes";
import type { EncounterCommand } from "./types";

const connectionAvailable = (state: ProcessEncounterState, id: string): boolean =>
  state.availability.gasLines.includes(id) ||
  state.availability.liquidLines.includes(id) ||
  Boolean(
    state.map.connections[id]?.rooms.every(
      (roomId) => state.map.rooms[roomId]?.provenance === "hull"
    )
  );

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

/** Construction stays open through the whole round so a failing defense can be corrected mid-wave. */
const configurationUnlocked = (state: ProcessEncounterState): boolean =>
  state.phase === "build" || state.phase === "assault";

const equipmentFits = (
  state: ProcessEncounterState,
  roomId: RoomId,
  socketId: keyof ProcessEncounterState["process"]["rooms"][RoomId]["equipment"],
  instance: EquipmentInstance,
  definition: ProcessSimulationDefinition
): boolean => {
  const room = roomState(state, roomId);
  const candidate = {
    ...room,
    equipment: { ...room.equipment, [socketId]: instance },
  };
  return roomUsableVolume(candidate, definition) - liquidAmountTotal(room.liquid) >= 8;
};

const evaluateInstallationPlacement = (
  state: ProcessEncounterState,
  command: Extract<GameCommand, { type: "install_equipment" }>,
  cost: number,
  gameDefinition: ProcessSimulationDefinition
): CommandDecision | null => {
  const definition = gameDefinition.equipment[command.equipmentId];
  if (!state.availability.equipment.includes(command.equipmentId))
    return reject("unavailable", { cost });
  if (!roomSocketIds(command.roomId, state).includes(command.socketId))
    return reject("placement", { cost });
  if (roomState(state, command.roomId).equipment[command.socketId])
    return reject("occupied_socket", { cost });
  if (definition.unique && findEquipmentInstallation(state, command.equipmentId, gameDefinition))
    return reject("unique_equipment", { cost });
  return null;
};

const evaluateInstall = (
  state: ProcessEncounterState,
  command: Extract<GameCommand, { type: "install_equipment" }>,
  gameDefinition: ProcessSimulationDefinition
): CommandDecision => {
  if (!configurationUnlocked(state)) return reject("invalid_phase");
  const definition = gameDefinition.equipment[command.equipmentId];
  const cost = definition.buildCost;
  const placement = evaluateInstallationPlacement(state, command, cost, gameDefinition);
  if (placement) return placement;
  const instance: EquipmentInstance = {
    equipmentId: command.equipmentId,
    level: 1,
    enabled: true,
    operation: null,
    medium: null,
  };
  if (!equipmentFits(state, command.roomId, command.socketId, instance, gameDefinition))
    return reject("capacity", { cost });
  if (state.matter < cost) return reject("insufficient_matter", { cost });
  return allow({ cost });
};

const evaluateLoadVesselMedium = (
  state: ProcessEncounterState,
  command: Extract<GameCommand, { type: "load_vessel_medium" }>,
  gameDefinition: ProcessSimulationDefinition
): CommandDecision => {
  if (!configurationUnlocked(state)) return reject("invalid_phase");
  const room = roomState(state, command.roomId);
  const instance = room.equipment[command.socketId];
  if (!instance) return reject("empty_socket");
  const operation = gameDefinition.equipment[instance.equipmentId].operation;
  if (!operation) return reject("unsupported_medium");
  if (command.medium !== null) {
    if (!operation.duties.some((duty) => duty.medium === command.medium))
      return reject("unsupported_medium");
    if (room.stationary[command.medium] <= 0) return reject("retained_inventory");
  }
  return allow();
};

const evaluateToggleEquipment = (
  state: ProcessEncounterState,
  command: Extract<GameCommand, { type: "toggle_equipment" }>
): CommandDecision => {
  if (!configurationUnlocked(state)) return reject("invalid_phase");
  if (!roomState(state, command.roomId).equipment[command.socketId]) return reject("empty_socket");
  return allow();
};

const evaluateUpgrade = (
  state: ProcessEncounterState,
  command: Extract<GameCommand, { type: "upgrade_equipment" }>,
  gameDefinition: ProcessSimulationDefinition
): CommandDecision => {
  if (!configurationUnlocked(state)) return reject("invalid_phase");
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
  state: ProcessEncounterState,
  command: Extract<GameCommand, { type: "dismantle_equipment" }>,
  definition: ProcessSimulationDefinition
): CommandDecision => {
  if (!configurationUnlocked(state)) return reject("invalid_phase");
  const instance = roomState(state, command.roomId).equipment[command.socketId];
  if (!instance) return reject("empty_socket");
  const retainedOutput = Object.values(instance.operation?.outputs ?? {}).some((output) =>
    output?.phase === "gas"
      ? gasAmountTotal(output.gas) > 1e-8
      : output?.phase === "liquid" && liquidAmountTotal(output.liquid) > 1e-8
  );
  if (retainedOutput) return reject("retained_inventory");
  return allow({ refund: equipmentDismantleRefund(instance, state.phase, definition) });
};

const evaluateSetConduit = (
  state: ProcessEncounterState,
  command: Extract<GameCommand, { type: "set_conduit" }>
): CommandDecision => {
  if (!configurationUnlocked(state)) return reject("invalid_phase");
  if (!connectionAvailable(state, command.connectionId)) return reject("unavailable");
  if (!lineFor(state, command.connectionId)) return reject("not_installed");
  return allow();
};

const lineFor = (state: ProcessEncounterState, connectionId: ConnectionId) => {
  const connection = state.map.connections[connectionId];
  return connection && isProcessLine(connection) ? connection : null;
};

/** The pair's line as a build would create it. Existing map lines are already physical. */
export const buildableLineFor = (
  state: ProcessEncounterState,
  command: Extract<GameCommand, { type: "build_connection" }>,
  gameDefinition: ProcessSimulationDefinition
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
  state: ProcessEncounterState,
  command: Extract<GameCommand, { type: "build_connection" }>,
  gameDefinition: ProcessSimulationDefinition
): CommandDecision => {
  if (!configurationUnlocked(state)) return reject("invalid_phase");
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

const evaluateDismantleConnection = (
  state: ProcessEncounterState,
  command: Extract<GameCommand, { type: "dismantle_connection" }>
): CommandDecision => {
  if (!configurationUnlocked(state)) return reject("invalid_phase");
  if (!connectionAvailable(state, command.connectionId)) return reject("unavailable");
  const line = lineFor(state, command.connectionId);
  if (!line) return reject("route_unavailable");
  const amount =
    line.kind === "gas_line"
      ? gasAmountTotal(gasConduitState(state, command.connectionId).gas)
      : liquidAmountTotal(liquidConduitState(state, command.connectionId).liquid);
  const refund = Math.floor(line.buildCost * dismantleRefundRatio(state.phase));
  if (amount > 0.001) return reject("capacity", { refund });
  return allow({ refund });
};

const evaluateEquipmentCommand = (
  state: ProcessEncounterState,
  command: EncounterCommand,
  definition: ProcessSimulationDefinition
): CommandDecision | null => {
  if ("roomId" in command && !(command.roomId in state.process.rooms)) return reject("placement");
  switch (command.type) {
    case "install_equipment":
      return evaluateInstall(state, command, definition);
    case "toggle_equipment":
      return evaluateToggleEquipment(state, command);
    case "upgrade_equipment":
      return evaluateUpgrade(state, command, definition);
    case "dismantle_equipment":
      return evaluateDismantleEquipment(state, command, definition);
    case "load_vessel_medium":
      return evaluateLoadVesselMedium(state, command, definition);
    default:
      return null;
  }
};

export const evaluateProcessCommand = (
  state: ProcessEncounterState,
  command: EncounterCommand,
  context: ProcessEncounterContext
): CommandDecision | null => {
  const definition = processDefinitionForMap(context.definition.process, state.map);
  const equipment = evaluateEquipmentCommand(state, command, definition);
  if (equipment) return equipment;
  switch (command.type) {
    case "set_conduit":
      return evaluateSetConduit(state, command);
    case "build_connection":
      return evaluateBuildConnection(state, command, definition);
    case "dismantle_connection":
      return evaluateDismantleConnection(state, command);
    case "charge_gas_source":
    case "charge_liquid_source":
      return evaluateSupplyCharge(state, command, definition);
    default:
      return null;
  }
};
