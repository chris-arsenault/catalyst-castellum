import type { GameDefinition } from "../definitionTypes";
import {
  GAS_TYPES,
  LIQUID_TYPES,
  type FlowCause,
  type GameState,
  type GasType,
  type LiquidType,
  type RoomId,
  type SpeciesId,
  type TransportPhase,
  type TransportRunId,
} from "../types";

const FLOW_EPSILON = 0.0005;

export interface SpeciesRate {
  species: SpeciesId;
  rate: number;
}

export interface TransportChannelTelemetry {
  id: string;
  name: string;
  phase: TransportPhase;
  fromRoom: RoomId;
  toRoom: RoomId;
  rate: number;
  speciesRates: SpeciesRate[];
  cause: FlowCause;
  blocked: boolean;
  enabled: boolean;
}

export interface MaterialRunFlow {
  forward: number;
  reverse: number;
  net: number;
  blocked: boolean;
  priming: boolean;
}

export interface TransportPhaseStatus {
  installed: boolean;
  configured: boolean;
  active: boolean;
  blocked: boolean;
  priming: boolean;
  rate: number;
}

const phaseChannel = (
  state: GameState,
  runId: TransportRunId,
  phase: TransportPhase,
  gameDefinition: GameDefinition
): TransportChannelTelemetry | null => {
  const definition = gameDefinition.transportRuns[runId][phase];
  if (!definition) return null;
  const conduit = phase === "gas" ? state.gasConduits[runId] : state.liquidConduits[runId];
  const speciesRates: SpeciesRate[] =
    phase === "gas"
      ? GAS_TYPES.filter(
          (species) => Math.abs(state.gasConduits[runId].lastSpeciesFlow[species]) > FLOW_EPSILON
        ).map((species) => ({
          species,
          rate: Math.abs(state.gasConduits[runId].lastSpeciesFlow[species]),
        }))
      : LIQUID_TYPES.filter(
          (species) => Math.abs(state.liquidConduits[runId].lastSpeciesFlow[species]) > FLOW_EPSILON
        ).map((species) => ({
          species,
          rate: Math.abs(state.liquidConduits[runId].lastSpeciesFlow[species]),
        }));
  return {
    id: `${runId}:${phase}`,
    name: definition.name,
    phase,
    fromRoom: definition.direction[0],
    toRoom: definition.direction[1],
    rate: Math.abs(conduit.lastFlow),
    speciesRates,
    cause: conduit.flowCause,
    blocked: conduit.blocked,
    enabled: conduit.enabled,
  };
};

export const transportRunChannels = (
  state: GameState,
  runId: TransportRunId,
  definition: GameDefinition
): TransportChannelTelemetry[] =>
  (["gas", "liquid"] as const).flatMap((phase) => {
    const channel = phaseChannel(state, runId, phase, definition);
    return channel ? [channel] : [];
  });

export const transportRunMaterialFlow = (
  state: GameState,
  runId: TransportRunId,
  species: SpeciesId,
  gameDefinition: GameDefinition
): MaterialRunFlow => {
  const phase: TransportPhase = GAS_TYPES.includes(species as GasType) ? "gas" : "liquid";
  const definition = gameDefinition.transportRuns[runId][phase];
  if (!definition) {
    return { forward: 0, reverse: 0, net: 0, blocked: false, priming: false };
  }
  const conduit = phase === "gas" ? state.gasConduits[runId] : state.liquidConduits[runId];
  const rate =
    phase === "gas"
      ? state.gasConduits[runId].lastSpeciesFlow[species as GasType]
      : state.liquidConduits[runId].lastSpeciesFlow[species as LiquidType];
  const oriented =
    definition.direction[0] === gameDefinition.transportRuns[runId].rooms[0] ? rate : -rate;
  return {
    forward: Math.max(0, oriented),
    reverse: Math.max(0, -oriented),
    net: oriented,
    blocked: conduit.blocked,
    priming: conduit.flowCause === "priming" && Math.abs(rate) > FLOW_EPSILON,
  };
};

export const transportRunPhaseStatus = (
  state: GameState,
  runId: TransportRunId,
  phase: TransportPhase,
  definition: GameDefinition
): TransportPhaseStatus => {
  const conduit = phase === "gas" ? state.gasConduits[runId] : state.liquidConduits[runId];
  const exists = definition.transportRuns[runId][phase] !== null;
  if (!exists) {
    return {
      installed: false,
      configured: false,
      active: false,
      blocked: false,
      priming: false,
      rate: 0,
    };
  }
  return {
    installed: conduit.installed,
    configured: conduit.installed && conduit.enabled,
    active: Math.abs(conduit.lastFlow) > FLOW_EPSILON,
    blocked: conduit.blocked,
    priming: conduit.flowCause === "priming" && conduit.lastFlow > FLOW_EPSILON,
    rate: Math.abs(conduit.lastFlow),
  };
};
