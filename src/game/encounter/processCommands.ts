import type {
  CommandDecision,
  EquipmentLoadout,
  GameCommand,
  GasSourceId,
  LiquidSourceId,
} from "../types";
import { createEquipmentInstance } from "../engine/equipment";
import { roomState } from "../world/instances";
import {
  buildConnectionCommand,
  dismantleConnectionCommand,
  setConduitCommand,
} from "../engine/transportCommands";
import { addEncounterEvent } from "./events";
import { processDefinitionForMap } from "./processDefinition";
import type {
  ProcessEncounterState,
  ProcessEncounterContext,
  ProcessSimulationDefinition,
} from "./processTypes";
import type { EncounterCommand } from "./types";

const installEquipment = (
  state: ProcessEncounterState,
  command: GameCommand & { type: "install_equipment" },
  decision: CommandDecision,
  definition: ProcessSimulationDefinition
): void => {
  const loadout: EquipmentLoadout = {
    equipmentId: command.equipmentId,
    level: 1,
    enabled: true,
  };
  state.matter -= decision.cost;
  roomState(state, command.roomId).equipment[command.socketId] = createEquipmentInstance(
    loadout,
    processDefinitionForMap(definition, state.map)
  );
  addEncounterEvent(
    state,
    "info",
    "equipment_installed",
    { equipmentId: command.equipmentId, cost: decision.cost },
    command.roomId
  );
};

const loadVesselMedium = (
  state: ProcessEncounterState,
  command: GameCommand & { type: "load_vessel_medium" }
): void => {
  const instance = roomState(state, command.roomId).equipment[command.socketId];
  if (instance) {
    instance.medium = command.medium;
    if (command.medium !== null)
      addEncounterEvent(
        state,
        "info",
        "vessel_medium_loaded",
        { equipmentId: instance.equipmentId, medium: command.medium },
        command.roomId
      );
  }
};

const toggleEquipment = (
  state: ProcessEncounterState,
  command: GameCommand & { type: "toggle_equipment" }
): void => {
  const target = roomState(state, command.roomId).equipment[command.socketId];
  if (target) target.enabled = command.enabled;
};

const upgradeEquipment = (
  state: ProcessEncounterState,
  command: GameCommand & { type: "upgrade_equipment" },
  decision: CommandDecision
): void => {
  const instance = roomState(state, command.roomId).equipment[command.socketId];
  if (!instance) throw new Error("Upgrade was applied without an installed equipment instance.");
  const target = roomState(state, command.roomId).equipment[command.socketId];
  if (!target) throw new Error("Cloned equipment state lost the upgraded instance.");
  target.level = (target.level + 1) as 2 | 3;
  state.matter -= decision.cost;
  addEncounterEvent(
    state,
    "info",
    "equipment_upgraded",
    { equipmentId: instance.equipmentId, level: target.level },
    command.roomId
  );
};

const dismantleEquipment = (
  state: ProcessEncounterState,
  command: GameCommand & { type: "dismantle_equipment" },
  decision: CommandDecision
): void => {
  const room = roomState(state, command.roomId);
  room.equipment[command.socketId] = null;
  state.matter += decision.refund;
};

const gasCharge = (
  state: ProcessEncounterState,
  sourceId: GasSourceId,
  decision: CommandDecision,
  gameDefinition: ProcessSimulationDefinition
): void => {
  const definition = gameDefinition.supplies.find((candidate) => candidate.id === sourceId);
  if (definition?.phase !== "gas" || definition.replenishment.kind !== "matter")
    throw new Error(`Gas supply ${sourceId} has no Matter replenishment.`);
  const ratedAmount = Object.values(definition.replenishment.contents).reduce(
    (total, amount) => total + (amount ?? 0),
    0
  );
  const target = state.process.gasSources[sourceId];
  if (!target) throw new Error(`Gas supply ${sourceId} has no state.`);
  state.matter -= decision.cost;
  for (const [species, rated] of Object.entries(definition.replenishment.contents)) {
    target.gas[species as keyof typeof target.gas] +=
      (rated ?? 0) * (decision.amount / ratedAmount);
  }
  addEncounterEvent(state, "info", "gas_source_charged", {
    sourceId,
    cost: decision.cost,
    amount: decision.amount,
  });
};

const liquidCharge = (
  state: ProcessEncounterState,
  sourceId: LiquidSourceId,
  decision: CommandDecision,
  gameDefinition: ProcessSimulationDefinition
): void => {
  const definition = gameDefinition.supplies.find((candidate) => candidate.id === sourceId);
  if (definition?.phase !== "liquid" || definition.replenishment.kind !== "matter")
    throw new Error(`Liquid supply ${sourceId} has no Matter replenishment.`);
  const ratedAmount = Object.values(definition.replenishment.contents).reduce(
    (total, amount) => total + (amount ?? 0),
    0
  );
  const target = state.process.liquidSources[sourceId];
  if (!target) throw new Error(`Liquid supply ${sourceId} has no state.`);
  state.matter -= decision.cost;
  for (const [species, rated] of Object.entries(definition.replenishment.contents)) {
    target.liquid[species as keyof typeof target.liquid] +=
      (rated ?? 0) * (decision.amount / ratedAmount);
  }
  addEncounterEvent(state, "info", "liquid_source_charged", {
    sourceId,
    cost: decision.cost,
    amount: decision.amount,
  });
};

const executeEquipmentCommand = (
  state: ProcessEncounterState,
  command: EncounterCommand,
  decision: CommandDecision,
  definition: ProcessSimulationDefinition
): boolean => {
  switch (command.type) {
    case "install_equipment":
      installEquipment(state, command, decision, definition);
      break;
    case "toggle_equipment":
      toggleEquipment(state, command);
      break;
    case "upgrade_equipment":
      upgradeEquipment(state, command, decision);
      break;
    case "dismantle_equipment":
      dismantleEquipment(state, command, decision);
      break;
    case "load_vessel_medium":
      loadVesselMedium(state, command);
      break;
    default:
      return false;
  }
  return true;
};

export const executeProcessCommand = (
  state: ProcessEncounterState,
  command: EncounterCommand,
  decision: CommandDecision,
  context: ProcessEncounterContext
): void => {
  const definition = processDefinitionForMap(context.definition.process, state.map);
  if (executeEquipmentCommand(state, command, decision, definition)) return;
  switch (command.type) {
    case "set_conduit":
      return setConduitCommand(state, command);
    case "build_connection":
      return buildConnectionCommand(state, command, decision, definition);
    case "dismantle_connection":
      return dismantleConnectionCommand(state, command, decision);
    case "charge_gas_source":
      return gasCharge(state, command.sourceId, decision, definition);
    case "charge_liquid_source":
      return liquidCharge(state, command.sourceId, decision, definition);
    default:
      throw new Error(`Command ${command.type} does not belong to the process bridge.`);
  }
};
