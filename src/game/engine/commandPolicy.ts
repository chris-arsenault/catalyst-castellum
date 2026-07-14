import { DEFAULT_GAME_DEFINITION, type GameDefinition } from "../definition";
import type {
  CommandDecision,
  CommandRejectionCode,
  EquipmentInstance,
  GameCommand,
  GameState,
  RoomId,
  TransportPhase,
  TransportRunId,
} from "../types";
import {
  equipmentAvailable,
  gasSourceAvailable,
  liquidSourceAvailable,
  nextLevelIdFor,
  transportPhaseAvailable,
} from "./campaign";
import { equipmentDismantleRefund, findEquipmentInstallation, roomSocketIds } from "./equipment";
import { roomUsableVolume } from "./physics";
import { gasAmountTotal, liquidAmountTotal } from "./roomState";
import { phaseAllowsCommand } from "./phaseModel";

const allow = (
  values: Partial<Pick<CommandDecision, "amount" | "cost" | "refund">> = {}
): CommandDecision => ({
  allowed: true,
  code: null,
  reason: null,
  amount: values.amount ?? 0,
  cost: values.cost ?? 0,
  refund: values.refund ?? 0,
});

const reject = (
  code: CommandRejectionCode,
  reason: string,
  values: Partial<Pick<CommandDecision, "amount" | "cost" | "refund">> = {}
): CommandDecision => ({ ...allow(values), allowed: false, code, reason });

const configurationUnlocked = (state: GameState): boolean =>
  state.phase === "build" || state.phase === "prime";

const simulationActive = (state: GameState): boolean =>
  state.phase === "prime" || state.phase === "assault";

const availableEquipmentCopy = (state: GameState, gameDefinition: GameDefinition): string => {
  const names = state.availability.equipment.map(
    (equipmentId) => gameDefinition.equipment[equipmentId].name
  );
  return names.length > 0
    ? `Current operation authorizes ${names.join(", ")}.`
    : "Current operation equipment catalog is sealed.";
};

const equipmentFits = (
  state: GameState,
  roomId: RoomId,
  socketId: keyof GameState["rooms"][RoomId]["equipment"],
  instance: EquipmentInstance,
  definition: GameDefinition
): boolean => {
  const room = state.rooms[roomId];
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
  if (!equipmentAvailable(state, command.equipmentId))
    return reject("unavailable", availableEquipmentCopy(state, gameDefinition), { cost });
  if (!roomSocketIds(command.roomId, gameDefinition).includes(command.socketId))
    return reject("placement", "This space has no compatible equipment socket.", { cost });
  if (state.rooms[command.roomId].equipment[command.socketId])
    return reject(
      "occupied_socket",
      "Dismantle the installed equipment before reusing this socket.",
      { cost }
    );
  if (definition.unique && findEquipmentInstallation(state, command.equipmentId, gameDefinition))
    return reject(
      "unique_equipment",
      `Only one ${definition.name} may be installed in this facility.`,
      { cost }
    );
  return null;
};

const evaluateInstall = (
  state: GameState,
  command: Extract<GameCommand, { type: "install_equipment" }>,
  gameDefinition: GameDefinition
): CommandDecision => {
  if (state.phase !== "build")
    return reject("invalid_phase", "Equipment can be installed only while planning.");
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
    return reject("capacity", "The room lacks safe free volume for this equipment.", { cost });
  if (state.matter < cost)
    return reject("insufficient_matter", `${definition.name} requires ${cost} matter.`, { cost });
  return allow({ cost });
};

const evaluateToggleEquipment = (
  state: GameState,
  command: Extract<GameCommand, { type: "toggle_equipment" }>
): CommandDecision => {
  if (!configurationUnlocked(state))
    return reject("invalid_phase", "Equipment controls are locked during assault.");
  if (!state.rooms[command.roomId].equipment[command.socketId])
    return reject("empty_socket", "This socket is empty.");
  return allow();
};

const evaluateUpgrade = (
  state: GameState,
  command: Extract<GameCommand, { type: "upgrade_equipment" }>,
  gameDefinition: GameDefinition
): CommandDecision => {
  if (state.phase !== "build")
    return reject("invalid_phase", "Equipment can be upgraded only while planning.");
  const instance = state.rooms[command.roomId].equipment[command.socketId];
  if (!instance) return reject("empty_socket", "This socket is empty.");
  if (instance.level >= 3)
    return reject("already_complete", "This equipment is already Grade III.");
  const definition = gameDefinition.equipment[instance.equipmentId];
  const cost = definition.upgradeCosts[instance.level === 1 ? 0 : 1];
  const upgraded: EquipmentInstance = {
    ...instance,
    level: instance.level === 1 ? 2 : 3,
  };
  if (!equipmentFits(state, command.roomId, command.socketId, upgraded, gameDefinition))
    return reject("capacity", "Drain more liquid before fitting the larger grade.", { cost });
  if (state.matter < cost)
    return reject("insufficient_matter", `Grade ${instance.level + 1} requires ${cost} matter.`, {
      cost,
    });
  return allow({ cost });
};

const evaluateDismantleEquipment = (
  state: GameState,
  command: Extract<GameCommand, { type: "dismantle_equipment" }>,
  definition: GameDefinition
): CommandDecision => {
  if (state.phase !== "build")
    return reject("invalid_phase", "Equipment can be dismantled only while planning.");
  const instance = state.rooms[command.roomId].equipment[command.socketId];
  if (!instance) return reject("empty_socket", "This socket is already empty.");
  return allow({ refund: equipmentDismantleRefund(instance, definition) });
};

const conduitFor = (state: GameState, runId: TransportRunId, phase: TransportPhase) =>
  phase === "gas" ? state.gasConduits[runId] : state.liquidConduits[runId];

const evaluateSetConduit = (
  state: GameState,
  command: Extract<GameCommand, { type: "set_conduit" }>
): CommandDecision => {
  if (!configurationUnlocked(state))
    return reject("invalid_phase", "Conduit controls are locked during assault.");
  if (!transportPhaseAvailable(state, command.runId, command.phase))
    return reject("unavailable", `This ${command.phase} conduit has not been unlocked.`);
  if (!conduitFor(state, command.runId, command.phase).installed)
    return reject("not_installed", `Build the ${command.phase} conduit first.`);
  return allow();
};

const evaluateBuildTransport = (
  state: GameState,
  command: Extract<GameCommand, { type: "build_transport" }>,
  gameDefinition: GameDefinition
): CommandDecision => {
  if (state.phase !== "build")
    return reject("invalid_phase", "Transport construction is available only while planning.");
  if (!transportPhaseAvailable(state, command.runId, command.phase))
    return reject("unavailable", `This ${command.phase} route has not been unlocked.`);
  const definition = gameDefinition.transportRuns[command.runId][command.phase];
  if (!definition)
    return reject("route_unavailable", `No ${command.phase} conduit is authored here.`);
  if (conduitFor(state, command.runId, command.phase).installed)
    return reject("already_installed", `This ${command.phase} conduit is already built.`, {
      cost: definition.buildCost,
    });
  if (state.matter < definition.buildCost)
    return reject(
      "insufficient_matter",
      `Building this ${command.phase} conduit requires ${definition.buildCost} matter.`,
      { cost: definition.buildCost }
    );
  return allow({ cost: definition.buildCost });
};

const evaluateDismantleTransport = (
  state: GameState,
  command: Extract<GameCommand, { type: "dismantle_transport" }>,
  gameDefinition: GameDefinition
): CommandDecision => {
  if (state.phase !== "build")
    return reject("invalid_phase", "Transport can be dismantled only while planning.");
  if (!transportPhaseAvailable(state, command.runId, command.phase))
    return reject("unavailable", `This ${command.phase} conduit is unavailable.`);
  const definition = gameDefinition.transportRuns[command.runId][command.phase];
  if (!definition) return reject("route_unavailable", `No ${command.phase} conduit exists here.`);
  if (!conduitFor(state, command.runId, command.phase).installed)
    return reject("not_installed", `This ${command.phase} conduit is not built.`);
  const amount =
    command.phase === "gas"
      ? gasAmountTotal(state.gasConduits[command.runId].gas)
      : liquidAmountTotal(state.liquidConduits[command.runId].liquid);
  const refund = Math.floor(definition.buildCost * 0.75);
  if (amount > 0.001)
    return reject(
      "capacity",
      "Isolate and empty the conserved conduit inventory before dismantling.",
      { refund }
    );
  return allow({ refund });
};

const evaluateGasCharge = (
  state: GameState,
  command: Extract<GameCommand, { type: "charge_gas_source" }>,
  gameDefinition: GameDefinition
): CommandDecision => {
  if (state.phase !== "build")
    return reject("invalid_phase", "Exotic transmutation is available only while planning.");
  if (!gasSourceAvailable(state, command.sourceId))
    return reject("unavailable", "This feedstock has not been unlocked in the current lesson.");
  const definition = gameDefinition.gasSources[command.sourceId];
  const current = gasAmountTotal(state.gasSources[command.sourceId].gas);
  const ratedAmount = Object.values(definition.chargeGas).reduce(
    (total, amount) => total + (amount ?? 0),
    0
  );
  const amount = Math.min(ratedAmount, definition.capacity - current);
  const cost = Math.ceil(definition.chargeCost * (amount / ratedAmount));
  if (amount <= 0.01)
    return reject("capacity", `${definition.name} is already full.`, { amount, cost });
  if (state.matter < cost)
    return reject(
      "insufficient_matter",
      `Synthesizing ${definition.formula} requires ${cost} matter.`,
      { amount, cost }
    );
  return allow({ amount, cost });
};

const requirePhase = (
  state: GameState,
  phase: GameState["phase"],
  reason: string
): CommandDecision => (state.phase === phase ? allow() : reject("invalid_phase", reason));

const evaluateSkipTutorial = (state: GameState): CommandDecision =>
  state.phase === "level_briefing" && state.campaign.levelId === "flash_point"
    ? allow()
    : reject("invalid_phase", "The opening tutorial can only be skipped from its first briefing.");

const evaluateStartNextLevel = (state: GameState, definition: GameDefinition): CommandDecision => {
  if (state.phase !== "level_complete")
    return reject("invalid_phase", "Complete the current checkpoint before advancing.");
  return nextLevelIdFor(state.campaign.levelId, definition)
    ? allow()
    : reject("already_complete", "The campaign is already complete.");
};

const evaluateLiveControl = (state: GameState, reason: string): CommandDecision =>
  simulationActive(state) ? allow() : reject("invalid_phase", reason);

const evaluateLiquidCharge = (
  state: GameState,
  command: Extract<GameCommand, { type: "charge_liquid_source" }>,
  gameDefinition: GameDefinition
): CommandDecision => {
  if (state.phase !== "build")
    return reject("invalid_phase", "Exotic transmutation is available only while planning.");
  if (!liquidSourceAvailable(state, command.sourceId))
    return reject("unavailable", "This feedstock has not been unlocked in the current lesson.");
  const definition = gameDefinition.liquidSources[command.sourceId];
  const current = liquidAmountTotal(state.liquidSources[command.sourceId].liquid);
  const amount = Math.min(definition.chargeAmount, definition.capacity - current);
  const cost = Math.ceil(definition.chargeCost * (amount / definition.chargeAmount));
  if (amount <= 0.01)
    return reject("capacity", `${definition.name} is already full.`, { amount, cost });
  if (state.matter < cost)
    return reject(
      "insufficient_matter",
      `Synthesizing ${definition.formula} requires ${cost} matter.`,
      { amount, cost }
    );
  return allow({ amount, cost });
};

/* eslint-disable complexity -- Exhaustive policy over the public command union is intentional. */
export const evaluateCommand = (
  state: GameState,
  command: GameCommand,
  definition: GameDefinition = DEFAULT_GAME_DEFINITION
): CommandDecision => {
  if (!phaseAllowsCommand(state.phase, command.type))
    return reject(
      "invalid_phase",
      `The ${command.type.replaceAll("_", " ")} action is unavailable during ${state.phase.replaceAll("_", " ")}.`
    );
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
      return requirePhase(state, "build", "Prime can only begin from planning.");
    case "start_assault":
      return requirePhase(state, "prime", "The plant must be primed before assault.");
    case "begin_level":
      return requirePhase(
        state,
        "level_briefing",
        "This checkpoint briefing has already been acknowledged."
      );
    case "skip_tutorial":
      return evaluateSkipTutorial(state);
    case "continue_round":
      return requirePhase(state, "round_result", "There is no completed round to continue from.");
    case "start_next_level":
      return evaluateStartNextLevel(state, definition);
    case "retry_level":
      return requirePhase(state, "defeat", "Retry is available only after defeat.");
    case "toggle_pause":
    case "set_pause":
      return evaluateLiveControl(state, "There is no running simulation to pause.");
    case "set_speed":
      return evaluateLiveControl(
        state,
        "Simulation speed can change only while the plant is live."
      );
  }
};
/* eslint-enable complexity */
