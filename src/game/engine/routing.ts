import type { GameDefinition } from "../definitionTypes";
import type { GameState, TransportPhase, ConnectionId } from "../types";
import { gasConduitState, liquidConduitState } from "../world/instances";

export const transportPhaseEnabled = (
  state: GameState,
  runId: ConnectionId,
  phase: TransportPhase
): boolean =>
  phase === "gas"
    ? gasConduitState(state, runId).enabled
    : liquidConduitState(state, runId).enabled;

export const transportPhaseExists = (
  runId: ConnectionId,
  phase: TransportPhase,
  definition: GameDefinition
): boolean => {
  const blueprint = definition.lineBlueprints[runId];
  return blueprint?.kind === (phase === "gas" ? "gas_line" : "liquid_line");
};
