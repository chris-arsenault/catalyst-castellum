import type { GameDefinition } from "../definitionTypes";
import type { GameState, TransportPhase, TransportRunId } from "../types";
import { gasConduitState, liquidConduitState } from "../world/instances";
import { maybeLineDefinition } from "../world/instances";

export const transportPhaseInstalled = (
  state: GameState,
  runId: TransportRunId,
  phase: TransportPhase
): boolean =>
  phase === "gas"
    ? gasConduitState(state, runId).installed
    : liquidConduitState(state, runId).installed;

export const transportPhaseEnabled = (
  state: GameState,
  runId: TransportRunId,
  phase: TransportPhase
): boolean =>
  phase === "gas"
    ? gasConduitState(state, runId).enabled
    : liquidConduitState(state, runId).enabled;

export const transportPhaseExists = (
  runId: TransportRunId,
  phase: TransportPhase,
  definition: GameDefinition
): boolean => maybeLineDefinition(definition, runId, phase) !== null;
