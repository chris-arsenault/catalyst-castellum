import { TRANSPORT_RUNS } from "../config";
import type {
  CommandResult,
  GameCommand,
  GameState,
  TransportPhase,
  TransportRunId,
} from "../types";
import { transportPhaseAvailable } from "./campaign";
import { cloneGame, gasAmountTotal, liquidAmountTotal } from "./roomState";

const reject = (state: GameState, reason: string): CommandResult => ({
  state,
  accepted: false,
  reason,
});

const accept = (state: GameState): CommandResult => ({ state, accepted: true, reason: null });

const conduitFor = (state: GameState, runId: TransportRunId, phase: TransportPhase) =>
  phase === "gas" ? state.gasConduits[runId] : state.liquidConduits[runId];

const definitionFor = (runId: TransportRunId, phase: TransportPhase) =>
  TRANSPORT_RUNS[runId][phase];

export const setConduitCommand = (
  source: GameState,
  command: GameCommand & { type: "set_conduit" }
): CommandResult => {
  if (!["build", "prime"].includes(source.phase)) {
    return reject(source, "Conduit controls are locked during assault.");
  }
  if (!transportPhaseAvailable(source, command.runId, command.phase)) {
    return reject(source, `This ${command.phase} conduit has not been unlocked.`);
  }
  const conduit = conduitFor(source, command.runId, command.phase);
  if (!conduit.installed) return reject(source, `Build the ${command.phase} conduit first.`);
  const state = cloneGame(source);
  conduitFor(state, command.runId, command.phase).enabled = command.enabled;
  return accept(state);
};

export const buildTransportCommand = (
  source: GameState,
  command: GameCommand & { type: "build_transport" }
): CommandResult => {
  if (source.phase !== "build") {
    return reject(source, "Transport construction is available only while planning.");
  }
  if (!transportPhaseAvailable(source, command.runId, command.phase)) {
    return reject(source, `This ${command.phase} route has not been unlocked.`);
  }
  const definition = definitionFor(command.runId, command.phase);
  if (!definition) return reject(source, `No ${command.phase} conduit is authored here.`);
  const conduit = conduitFor(source, command.runId, command.phase);
  if (conduit.installed) return reject(source, `This ${command.phase} conduit is already built.`);
  if (source.matter < definition.buildCost) {
    return reject(
      source,
      `Building this ${command.phase} conduit requires ${definition.buildCost} matter.`
    );
  }
  const state = cloneGame(source);
  state.matter -= definition.buildCost;
  const next = conduitFor(state, command.runId, command.phase);
  next.installed = true;
  next.enabled = false;
  return accept(state);
};

const conduitEmpty = (source: GameState, runId: TransportRunId, phase: TransportPhase): boolean =>
  phase === "gas"
    ? gasAmountTotal(source.gasConduits[runId].gas) <= 0.001
    : liquidAmountTotal(source.liquidConduits[runId].liquid) <= 0.001;

export const dismantleTransportCommand = (
  source: GameState,
  command: GameCommand & { type: "dismantle_transport" }
): CommandResult => {
  if (source.phase !== "build") {
    return reject(source, "Transport can be dismantled only while planning.");
  }
  if (!transportPhaseAvailable(source, command.runId, command.phase)) {
    return reject(source, `This ${command.phase} conduit is unavailable.`);
  }
  const definition = definitionFor(command.runId, command.phase);
  if (!definition) return reject(source, `No ${command.phase} conduit exists here.`);
  const conduit = conduitFor(source, command.runId, command.phase);
  if (!conduit.installed) return reject(source, `This ${command.phase} conduit is not built.`);
  if (!conduitEmpty(source, command.runId, command.phase)) {
    return reject(source, "Isolate and empty the conserved conduit inventory before dismantling.");
  }
  const state = cloneGame(source);
  const next = conduitFor(state, command.runId, command.phase);
  next.installed = false;
  next.enabled = false;
  state.matter += Math.floor(definition.buildCost * 0.75);
  return accept(state);
};
