import type { CommandDecision, CommandResult, GameCommand, GameState } from "../types";
import { acceptCommand } from "./commandResult";
import { cloneGame } from "./roomState";
import { conduitState } from "../world/instances";

export const setConduitCommand = (
  source: GameState,
  command: GameCommand & { type: "set_conduit" }
): CommandResult => {
  const state = cloneGame(source);
  conduitState(state, command.connectionId).enabled = command.enabled;
  return acceptCommand(state);
};

export const buildTransportCommand = (
  source: GameState,
  command: GameCommand & { type: "build_transport" },
  decision: CommandDecision
): CommandResult => {
  const state = cloneGame(source);
  state.matter -= decision.cost;
  const next = conduitState(state, command.connectionId);
  next.installed = true;
  next.enabled = false;
  return acceptCommand(state);
};

export const dismantleTransportCommand = (
  source: GameState,
  command: GameCommand & { type: "dismantle_transport" },
  decision: CommandDecision
): CommandResult => {
  const state = cloneGame(source);
  const next = conduitState(state, command.connectionId);
  next.installed = false;
  next.enabled = false;
  state.matter += decision.refund;
  return acceptCommand(state);
};
