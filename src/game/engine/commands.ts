import type { GameDefinition } from "../definitionTypes";
import type {
  CommandDecision,
  CommandResult,
  EquipmentLoadout,
  GameCommand,
  GameState,
  GasSourceId,
  LiquidSourceId,
} from "../types";
import { addEvent, makeStats } from "./events";
import { dismantleModuleCommand, graftModuleCommand } from "./graftCommands";
import { roundDefinitionFor, supplyDefinitionFor } from "./campaign";
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
  startNextLevelCommand,
} from "./campaignCommands";
import {
  buildConnectionCommand,
  dismantleConnectionCommand,
  setConduitCommand,
} from "./transportCommands";
import { roomState } from "../world/instances";
import { definitionForMap } from "../world/activeDefinition";
import { createEquipmentInstance } from "./equipment";
import {
  configureHullPortalCommand,
  connectHullRoomsCommand,
  editHullCellCommand,
  editHullCellsCommand,
  removeHullConnectionCommand,
  setPortalCommand,
} from "./hullCommands";

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
  decision: CommandDecision,
  definition: GameDefinition
): CommandResult => {
  const loadout: EquipmentLoadout = {
    equipmentId: command.equipmentId,
    level: 1,
    enabled: true,
  };
  const state = cloneGame(source);
  state.matter -= decision.cost;
  roomState(state, command.roomId).equipment[command.socketId] = createEquipmentInstance(
    loadout,
    definitionForMap(definition, state.map)
  );
  addEvent(
    state,
    "info",
    "equipment_installed",
    { equipmentId: command.equipmentId, cost: decision.cost },
    command.roomId
  );
  return acceptCommand(state);
};

const loadVesselMedium = (
  source: GameState,
  command: GameCommand & { type: "load_vessel_medium" }
): CommandResult => {
  const state = cloneGame(source);
  const instance = roomState(state, command.roomId).equipment[command.socketId];
  if (instance) {
    instance.medium = command.medium;
    if (command.medium !== null)
      addEvent(
        state,
        "info",
        "vessel_medium_loaded",
        { equipmentId: instance.equipmentId, medium: command.medium },
        command.roomId
      );
  }
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
  const room = roomState(state, command.roomId);
  room.equipment[command.socketId] = null;
  state.matter += decision.refund;
  return acceptCommand(state);
};

const gasCharge = (
  source: GameState,
  sourceId: GasSourceId,
  decision: CommandDecision,
  gameDefinition: GameDefinition
): CommandResult => {
  const definition = supplyDefinitionFor(source, sourceId, gameDefinition);
  if (definition?.phase !== "gas" || definition.replenishment.kind !== "matter")
    throw new Error(`Gas supply ${sourceId} has no Matter replenishment.`);
  const ratedAmount = Object.values(definition.replenishment.contents).reduce(
    (total, amount) => total + (amount ?? 0),
    0
  );
  const state = cloneGame(source);
  const target = state.gasSources[sourceId];
  if (!target) throw new Error(`Gas supply ${sourceId} has no state.`);
  state.matter -= decision.cost;
  for (const [species, rated] of Object.entries(definition.replenishment.contents)) {
    target.gas[species as keyof typeof target.gas] +=
      (rated ?? 0) * (decision.amount / ratedAmount);
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
  const definition = supplyDefinitionFor(source, sourceId, gameDefinition);
  if (definition?.phase !== "liquid" || definition.replenishment.kind !== "matter")
    throw new Error(`Liquid supply ${sourceId} has no Matter replenishment.`);
  const ratedAmount = Object.values(definition.replenishment.contents).reduce(
    (total, amount) => total + (amount ?? 0),
    0
  );
  const state = cloneGame(source);
  const target = state.liquidSources[sourceId];
  if (!target) throw new Error(`Liquid supply ${sourceId} has no state.`);
  state.matter -= decision.cost;
  for (const [species, rated] of Object.entries(definition.replenishment.contents)) {
    target.liquid[species as keyof typeof target.liquid] +=
      (rated ?? 0) * (decision.amount / ratedAmount);
  }
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
  const activeDefinition = definitionForMap(definition, source.map);
  // Construction may reuse a compatible pack-authored route template that is absent
  // from live topology. Other commands bind to the active map's derived definition.
  const commandDefinition = command.type === "build_connection" ? definition : activeDefinition;
  const decision = evaluateCommand(source, command, commandDefinition);
  if (!decision.allowed) {
    return rejectCommand(source, decision.code ?? "invalid_phase", decision.parameters);
  }
  switch (command.type) {
    case "set_conduit":
      return setConduitCommand(source, command);
    case "install_equipment":
      return installEquipment(source, command, decision, commandDefinition);
    case "toggle_equipment":
      return toggleEquipment(source, command);
    case "upgrade_equipment":
      return upgradeEquipment(source, command, decision);
    case "dismantle_equipment":
      return dismantleEquipment(source, command, decision);
    case "load_vessel_medium":
      return loadVesselMedium(source, command);
    case "build_connection":
      return buildConnectionCommand(source, command, decision, definition);
    case "dismantle_connection":
      return dismantleConnectionCommand(source, command, decision);
    case "graft_module":
      return graftModuleCommand(source, command, decision, activeDefinition);
    case "dismantle_module":
      return dismantleModuleCommand(source, command, decision);
    case "edit_hull_cell":
      return editHullCellCommand(source, command);
    case "edit_hull_cells":
      return editHullCellsCommand(source, command);
    case "connect_hull_rooms":
      return connectHullRoomsCommand(source, command);
    case "remove_hull_connection":
      return removeHullConnectionCommand(source, command);
    case "configure_hull_portal":
      return configureHullPortalCommand(source, command);
    case "set_portal":
      return setPortalCommand(source, command, activeDefinition);
    case "charge_gas_source":
      return gasCharge(source, command.sourceId, decision, activeDefinition);
    case "charge_liquid_source":
      return liquidCharge(source, command.sourceId, decision, activeDefinition);
    case "start_prime":
      return startPrime(source, activeDefinition);
    case "start_assault":
      return startAssault(source);
    case "begin_level":
      return beginLevelCommand(source);
    case "continue_round":
      return continueRoundCommand(source, activeDefinition);
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
