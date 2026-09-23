import type { ProcessDefinition, ProcessEncounterState } from "../encounter/processTypes";
import type { TransportPhase, ConnectionId } from "../types";
import { gasConduitState, liquidConduitState } from "../world/instances";

export const transportPhaseEnabled = (
  state: ProcessEncounterState,
  runId: ConnectionId,
  phase: TransportPhase
): boolean =>
  phase === "gas"
    ? gasConduitState(state, runId).enabled
    : liquidConduitState(state, runId).enabled;

export const transportPhaseExists = (
  runId: ConnectionId,
  phase: TransportPhase,
  definition: Pick<ProcessDefinition, "lineBlueprints">
): boolean => {
  const blueprint = definition.lineBlueprints[runId];
  return blueprint?.kind === (phase === "gas" ? "gas_line" : "liquid_line");
};
