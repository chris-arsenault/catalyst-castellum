import type {
  CommandDecision,
  CommandResult,
  GameCommand,
  GameState,
  TransportPhase,
  TransportRunId,
} from "../types";
import { acceptCommand } from "./commandResult";
import { cloneGame } from "./roomState";
import { gasConduitState, liquidConduitState } from "../world/instances";

const conduitFor = (state: GameState, runId: TransportRunId, phase: TransportPhase) =>
  phase === "gas" ? gasConduitState(state, runId) : liquidConduitState(state, runId);

export const setConduitCommand = (
  source: GameState,
  command: GameCommand & { type: "set_conduit" }
): CommandResult => {
  const state = cloneGame(source);
  conduitFor(state, command.runId, command.phase).enabled = command.enabled;
  return acceptCommand(state);
};

export const buildTransportCommand = (
  source: GameState,
  command: GameCommand & { type: "build_transport" },
  decision: CommandDecision
): CommandResult => {
  const state = cloneGame(source);
  state.matter -= decision.cost;
  const next = conduitFor(state, command.runId, command.phase);
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
  const next = conduitFor(state, command.runId, command.phase);
  next.installed = false;
  next.enabled = false;
  state.matter += decision.refund;
  return acceptCommand(state);
};
