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
import {
  equipmentAvailable,
  gasSourceAvailable,
  liquidSourceAvailable,
  nextLevelIdFor,
  connectionAvailable,
} from "./campaign";
import { equipmentDismantleRefund, findEquipmentInstallation, roomSocketIds } from "./equipment";
import { roomUsableVolume } from "./physics";
import { gasAmountTotal, liquidAmountTotal } from "./roomState";
import { phaseAllowsCommand } from "./phaseModel";
import { conduitState, gasConduitState, liquidConduitState, roomState } from "../world/instances";
import { isProcessLine } from "../world/map";

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
  if (!roomSocketIds(command.roomId, gameDefinition).includes(command.socketId))
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
  return allow({ refund: equipmentDismantleRefund(instance, definition) });
};

const evaluateSetConduit = (
  state: GameState,
  command: Extract<GameCommand, { type: "set_conduit" }>
): CommandDecision => {
  if (!configurationUnlocked(state)) return reject("invalid_phase");
  if (!connectionAvailable(state, command.connectionId)) return reject("unavailable");
  if (!conduitState(state, command.connectionId).installed) return reject("not_installed");
  return allow();
};

const lineFor = (gameDefinition: GameDefinition, connectionId: ConnectionId) => {
  const connection = gameDefinition.map.connections[connectionId];
  return connection && isProcessLine(connection) ? connection : null;
};

const evaluateBuildTransport = (
  state: GameState,
  command: Extract<GameCommand, { type: "build_transport" }>,
  gameDefinition: GameDefinition
): CommandDecision => {
  if (state.phase !== "build") return reject("invalid_phase");
  if (!connectionAvailable(state, command.connectionId)) return reject("unavailable");
  const line = lineFor(gameDefinition, command.connectionId);
  if (!line) return reject("route_unavailable");
  if (conduitState(state, command.connectionId).installed)
    return reject("already_installed", { cost: line.buildCost });
  if (state.matter < line.buildCost) return reject("insufficient_matter", { cost: line.buildCost });
  return allow({ cost: line.buildCost });
};

const evaluateDismantleTransport = (
  state: GameState,
  command: Extract<GameCommand, { type: "dismantle_transport" }>,
  gameDefinition: GameDefinition
): CommandDecision => {
  if (state.phase !== "build") return reject("invalid_phase");
  if (!connectionAvailable(state, command.connectionId)) return reject("unavailable");
  const line = lineFor(gameDefinition, command.connectionId);
  if (!line) return reject("route_unavailable");
  if (!conduitState(state, command.connectionId).installed) return reject("not_installed");
  const amount =
    line.kind === "gas_line"
      ? gasAmountTotal(gasConduitState(state, command.connectionId).gas)
      : liquidAmountTotal(liquidConduitState(state, command.connectionId).liquid);
  const refund = Math.floor(line.buildCost * 0.75);
  if (amount > 0.001) return reject("capacity", { refund });
  return allow({ refund });
};

const evaluateGasCharge = (
  state: GameState,
  command: Extract<GameCommand, { type: "charge_gas_source" }>,
  gameDefinition: GameDefinition
): CommandDecision => {
  if (state.phase !== "build") return reject("invalid_phase");
  if (!gasSourceAvailable(state, command.sourceId)) return reject("unavailable");
  const definition = gameDefinition.gasSources[command.sourceId];
  const current = gasAmountTotal(state.gasSources[command.sourceId].gas);
  const ratedAmount = Object.values(definition.chargeGas).reduce(
    (total, amount) => total + (amount ?? 0),
    0
  );
  const amount = Math.min(ratedAmount, definition.capacity - current);
  const cost = Math.ceil(definition.chargeCost * (amount / ratedAmount));
  if (amount <= 0.01) return reject("capacity", { amount, cost });
  if (state.matter < cost) return reject("insufficient_matter", { amount, cost });
  return allow({ amount, cost });
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

const evaluateLiveControl = (state: GameState): CommandDecision =>
  simulationActive(state) ? allow() : reject("invalid_phase");

const evaluateLiquidCharge = (
  state: GameState,
  command: Extract<GameCommand, { type: "charge_liquid_source" }>,
  gameDefinition: GameDefinition
): CommandDecision => {
  if (state.phase !== "build") return reject("invalid_phase");
  if (!liquidSourceAvailable(state, command.sourceId)) return reject("unavailable");
  const definition = gameDefinition.liquidSources[command.sourceId];
  const current = liquidAmountTotal(state.liquidSources[command.sourceId].liquid);
  const amount = Math.min(definition.chargeAmount, definition.capacity - current);
  const cost = Math.ceil(definition.chargeCost * (amount / definition.chargeAmount));
  if (amount <= 0.01) return reject("capacity", { amount, cost });
  if (state.matter < cost) return reject("insufficient_matter", { amount, cost });
  return allow({ amount, cost });
};

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
    case "build_transport":
      return evaluateBuildTransport(state, command, definition);
    case "dismantle_transport":
      return evaluateDismantleTransport(state, command, definition);
    case "charge_gas_source":
      return evaluateGasCharge(state, command, definition);
    case "charge_liquid_source":
      return evaluateLiquidCharge(state, command, definition);
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
