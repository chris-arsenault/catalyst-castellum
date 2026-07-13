import { TRANSPORT_RUNS } from "../config";
import type { GameState, TransportPhase, TransportRunId } from "../types";

export const transportPhaseInstalled = (
  state: GameState,
  runId: TransportRunId,
  phase: TransportPhase
): boolean =>
  phase === "gas" ? state.gasConduits[runId].installed : state.liquidConduits[runId].installed;

export const transportPhaseEnabled = (
  state: GameState,
  runId: TransportRunId,
  phase: TransportPhase
): boolean =>
  phase === "gas" ? state.gasConduits[runId].enabled : state.liquidConduits[runId].enabled;

export const transportPhaseExists = (runId: TransportRunId, phase: TransportPhase): boolean =>
  TRANSPORT_RUNS[runId][phase] !== null;
