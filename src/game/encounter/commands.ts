import type { CommandDecision } from "../types";
import { evaluateTowerCommand } from "../engine/towerCommandPolicy";
import {
  dismantleTowerCommand,
  moveTowerCommand,
  placeTowerCommand,
  rotateTowerCommand,
  setTowerTargetingCommand,
  upgradeTowerCommand,
} from "../engine/towerCommands";
import { cloneEncounter } from "./clone";
import { addEncounterEvent } from "./events";
import { configuredProcess } from "./processContext";
import { evaluateEncounterPortal, executeEncounterPortal } from "./portals";
import {
  initializeCatalystDevices,
  removeCatalystDevice,
  setCatalystFieldMode,
  suspendCatalystField,
} from "./catalystDevices";
import type {
  EncounterCommand,
  EncounterCommandResult,
  EncounterContext,
  EncounterState,
  OrderedEncounterCommand,
} from "./types";

const decision = (allowed: boolean, code: CommandDecision["code"] = null): CommandDecision => ({
  allowed,
  code,
  parameters: {},
  amount: 0,
  cost: 0,
  refund: 0,
});

export const evaluateEncounterCommand = (
  state: EncounterState,
  command: EncounterCommand,
  context: EncounterContext
): CommandDecision => {
  if (state.result) return decision(false, "invalid_phase");
  if (command.type === "set_field_mode") return evaluateFieldMode(state, command);
  if (command.type === "set_portal") return evaluateEncounterPortal(state, command, context);
  if (isTowerCommand(command)) return evaluateTowerCommand(state, command, context.combat);
  if (command.type === "start_assault")
    return state.phase === "build" ? decision(true) : decision(false, "invalid_phase");
  return evaluateProcess(state, command, context);
};

const evaluateFieldMode = (
  state: EncounterState,
  command: Extract<EncounterCommand, { type: "set_field_mode" }>
): CommandDecision =>
  state.catalyst?.devices[command.towerId]?.kind === "field" &&
  (command.mode === "attract" || command.mode === "repel")
    ? decision(true)
    : decision(false, "unavailable");

const isTowerCommand = (
  command: EncounterCommand
): command is Parameters<typeof evaluateTowerCommand>[1] =>
  [
    "place_tower",
    "move_tower",
    "rotate_tower",
    "set_tower_targeting",
    "upgrade_tower",
    "dismantle_tower",
  ].includes(command.type);

const evaluateProcess = (
  state: EncounterState,
  command: EncounterCommand,
  context: EncounterContext
): CommandDecision => {
  const process = configuredProcess(state, context);
  return (
    process?.bridge.evaluateCommand(process.state, command, process.context) ??
    decision(false, "unavailable")
  );
};

const applyCommand = (
  state: EncounterState,
  command: EncounterCommand,
  accepted: CommandDecision,
  context: EncounterContext
): void => {
  if (command.type === "set_portal") {
    executeEncounterPortal(state, command, context);
    return;
  }
  if (command.type === "set_field_mode") {
    setCatalystFieldMode(state, command.towerId, command.mode, context);
    return;
  }
  switch (command.type) {
    case "place_tower":
      placeTowerCommand(state, command, accepted, context);
      initializeCatalystDevices(state, context);
      break;
    case "move_tower":
      moveTowerCommand(state, command, context);
      suspendCatalystField(state, command.towerId, context);
      break;
    case "rotate_tower":
      rotateTowerCommand(state, command, context);
      suspendCatalystField(state, command.towerId, context);
      break;
    case "set_tower_targeting":
      setTowerTargetingCommand(state, command);
      break;
    case "upgrade_tower":
      upgradeTowerCommand(state, command, accepted);
      break;
    case "dismantle_tower":
      dismantleTowerCommand(state, command, accepted);
      removeCatalystDevice(state, command.towerId);
      break;
    case "start_assault":
      state.phase = "assault";
      state.phaseTime = 0;
      state.spawnCursor = 0;
      state.enemies = [];
      addEncounterEvent(state, "warning", "assault_started");
      break;
    default: {
      applyProcessCommand(state, command, accepted, context);
    }
  }
};

const applyProcessCommand = (
  state: EncounterState,
  command: EncounterCommand,
  accepted: CommandDecision,
  context: EncounterContext
): void => {
  const process = configuredProcess(state, context);
  process?.bridge.executeCommand(process.state, command, accepted, process.context);
};

export class EncounterCommandOrderError extends Error {
  constructor(readonly code: "tick_mismatch" | "invalid_sequence") {
    super(`Encounter command ordering rejected: ${code}`);
  }
}

export const validateCommandStream = (
  source: EncounterState,
  commands: readonly OrderedEncounterCommand[]
): void => {
  let previous = source.commandCursor;
  for (const input of commands) {
    if (!Number.isSafeInteger(input.tick) || input.tick < source.tick || input.tick < previous.tick)
      throw new EncounterCommandOrderError("tick_mismatch");
    if (
      !Number.isSafeInteger(input.sequence) ||
      input.sequence < 0 ||
      (input.tick === previous.tick && input.sequence <= previous.sequence)
    )
      throw new EncounterCommandOrderError("invalid_sequence");
    previous = input;
  }
};

export const executeEncounterCommand = (
  source: EncounterState,
  input: OrderedEncounterCommand,
  context: EncounterContext
): EncounterCommandResult => {
  if (!Number.isSafeInteger(input.tick) || input.tick !== source.tick)
    throw new EncounterCommandOrderError("tick_mismatch");
  if (
    !Number.isSafeInteger(input.sequence) ||
    input.sequence < 0 ||
    (source.commandCursor.tick === input.tick && input.sequence <= source.commandCursor.sequence)
  )
    throw new EncounterCommandOrderError("invalid_sequence");
  const accepted = evaluateEncounterCommand(source, input.command, context);
  const state = cloneEncounter(source);
  // Rejected gameplay commands still consume their place in the deterministic input stream.
  state.commandCursor = { tick: input.tick, sequence: input.sequence };
  if (accepted.allowed) applyCommand(state, input.command, accepted, context);
  return {
    state,
    decision: accepted,
    events: structuredClone(
      state.events.filter((event) => event.id >= source.nextEventId).reverse()
    ),
  };
};
