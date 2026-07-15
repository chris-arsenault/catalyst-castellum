import type { GameDefinition } from "../definitionTypes";
import type {
  CommandDecision,
  CommandResult,
  EquipmentInstance,
  GameCommand,
  GameState,
  GasSourceId,
  LiquidSourceId,
} from "../types";
import { addEvent, makeStats } from "./events";
import { dismantleModuleCommand, graftModuleCommand } from "./graftCommands";
import { roundDefinitionFor } from "./campaign";
import { cloneGame } from "./roomState";
import { beginAssault } from "./phases";
import { evaluateCommand } from "./commandPolicy";
import { acceptCommand, rejectCommand } from "./commandResult";
import { transitionPhase } from "./phaseModel";
import {
  beginLevelCommand,
  dockAtSiteCommand,
  continueRoundCommand,
  retryLevelCommand,
  skipTutorialCommand,
  startNextLevelCommand,
} from "./campaignCommands";
import {
  buildConnectionCommand,
  dismantleConnectionCommand,
  setConduitCommand,
} from "./transportCommands";
import { roomState } from "../world/instances";

const startPrime = (source: GameState, definition: GameDefinition): CommandResult => {
  const state = cloneGame(source);
  transitionPhase(state, "prime");
  Object.assign(state, {
    stats: makeStats(),
    pendingMatter: 0,
    spawnCursor: 0,
    enemies: [],
  });
  addEvent(state, "info", "prime_started", {
    primeSeconds: roundDefinitionFor(state, definition).primeSeconds,
  });
  return acceptCommand(state);
};

const startAssault = (source: GameState): CommandResult => {
  const state = cloneGame(source);
  beginAssault(state, false);
  return acceptCommand(state);
};

const installEquipment = (
  source: GameState,
  command: GameCommand & { type: "install_equipment" },
  decision: CommandDecision
): CommandResult => {
  const instance: EquipmentInstance = { equipmentId: command.equipmentId, level: 1, enabled: true };
  const state = cloneGame(source);
  state.matter -= decision.cost;
  roomState(state, command.roomId).equipment[command.socketId] = instance;
  addEvent(
    state,
    "info",
    "equipment_installed",
    { equipmentId: command.equipmentId, cost: decision.cost },
    command.roomId
  );
  return acceptCommand(state);
};

const toggleEquipment = (
  source: GameState,
  command: GameCommand & { type: "toggle_equipment" }
): CommandResult => {
  const state = cloneGame(source);
  const target = roomState(state, command.roomId).equipment[command.socketId];
  if (target) target.enabled = command.enabled;
  return acceptCommand(state);
};

const upgradeEquipment = (
  source: GameState,
  command: GameCommand & { type: "upgrade_equipment" },
  decision: CommandDecision
): CommandResult => {
  const instance = roomState(source, command.roomId).equipment[command.socketId];
  if (!instance) throw new Error("Upgrade was applied without an installed equipment instance.");
  const state = cloneGame(source);
  const target = roomState(state, command.roomId).equipment[command.socketId];
  if (!target) throw new Error("Cloned equipment state lost the upgraded instance.");
  target.level = (target.level + 1) as 2 | 3;
  state.matter -= decision.cost;
  addEvent(
    state,
    "info",
    "equipment_upgraded",
    { equipmentId: instance.equipmentId, level: target.level },
    command.roomId
  );
  return acceptCommand(state);
};

const dismantleEquipment = (
  source: GameState,
  command: GameCommand & { type: "dismantle_equipment" },
  decision: CommandDecision
): CommandResult => {
  const state = cloneGame(source);
  roomState(state, command.roomId).equipment[command.socketId] = null;
  state.matter += decision.refund;
  return acceptCommand(state);
};

const gasCharge = (
  source: GameState,
  sourceId: GasSourceId,
  decision: CommandDecision,
  gameDefinition: GameDefinition
): CommandResult => {
  const definition = gameDefinition.gasSources[sourceId];
  const ratedAmount = Object.values(definition.chargeGas).reduce(
    (total, amount) => total + (amount ?? 0),
    0
  );
  const state = cloneGame(source);
  state.matter -= decision.cost;
  for (const [species, rated] of Object.entries(definition.chargeGas)) {
    state.gasSources[sourceId].gas[
      species as keyof (typeof state.gasSources)[typeof sourceId]["gas"]
    ] += (rated ?? 0) * (decision.amount / ratedAmount);
  }
  addEvent(state, "info", "gas_source_charged", {
    sourceId,
    cost: decision.cost,
    amount: decision.amount,
  });
  return acceptCommand(state);
};

const liquidCharge = (
  source: GameState,
  sourceId: LiquidSourceId,
  decision: CommandDecision,
  gameDefinition: GameDefinition
): CommandResult => {
  const definition = gameDefinition.liquidSources[sourceId];
  const state = cloneGame(source);
  state.matter -= decision.cost;
  state.liquidSources[sourceId].liquid[definition.substance] += decision.amount;
  addEvent(state, "info", "liquid_source_charged", {
    sourceId,
    cost: decision.cost,
    amount: decision.amount,
  });
  return acceptCommand(state);
};

const togglePause = (source: GameState): CommandResult => {
  const state = cloneGame(source);
  state.paused = !state.paused;
  return acceptCommand(state);
};

const setPause = (source: GameState, paused: boolean): CommandResult => {
  if (source.paused === paused) return acceptCommand(source);
  const state = cloneGame(source);
  state.paused = paused;
  return acceptCommand(state);
};

const setSpeed = (source: GameState, speed: 1 | 2): CommandResult => {
  const state = cloneGame(source);
  state.speed = speed;
  return acceptCommand(state);
};

/* eslint-disable complexity -- Exhaustive dispatch over the public command union is intentional. */
export const executeCommand = (
  source: GameState,
  command: GameCommand,
  definition: GameDefinition
): CommandResult => {
  const decision = evaluateCommand(source, command, definition);
  if (!decision.allowed) {
    return rejectCommand(source, decision.code ?? "invalid_phase", decision.parameters);
  }
  switch (command.type) {
    case "set_conduit":
      return setConduitCommand(source, command);
    case "install_equipment":
      return installEquipment(source, command, decision);
    case "toggle_equipment":
      return toggleEquipment(source, command);
    case "upgrade_equipment":
      return upgradeEquipment(source, command, decision);
    case "dismantle_equipment":
      return dismantleEquipment(source, command, decision);
    case "build_connection":
      return buildConnectionCommand(source, command, decision, definition);
    case "dismantle_connection":
      return dismantleConnectionCommand(source, command, decision);
    case "graft_module":
      return graftModuleCommand(source, command, decision, definition);
    case "dismantle_module":
      return dismantleModuleCommand(source, command, decision);
    case "charge_gas_source":
      return gasCharge(source, command.sourceId, decision, definition);
    case "charge_liquid_source":
      return liquidCharge(source, command.sourceId, decision, definition);
    case "start_prime":
      return startPrime(source, definition);
    case "start_assault":
      return startAssault(source);
    case "begin_level":
      return beginLevelCommand(source);
    case "skip_tutorial":
      return skipTutorialCommand(source, definition);
    case "continue_round":
      return continueRoundCommand(source, definition);
    case "start_next_level":
      return startNextLevelCommand(source, definition);
    case "dock_at_site":
      return dockAtSiteCommand(source, definition);
    case "retry_level":
      return retryLevelCommand(source, definition);
    case "toggle_pause":
      return togglePause(source);
    case "set_pause":
      return setPause(source, command.paused);
    case "set_speed":
      return setSpeed(source, command.speed);
  }
};
/* eslint-enable complexity */
