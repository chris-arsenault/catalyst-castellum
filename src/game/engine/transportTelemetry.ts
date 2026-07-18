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
  type ConnectionId,
} from "../types";
import { gasConduitState, liquidConduitState } from "../world/instances";
import { maybeLineDefinition } from "../world/instances";

const FLOW_EPSILON = 0.0005;

export interface SpeciesRate {
  species: SpeciesId;
  rate: number;
}

export interface TransportChannelTelemetry {
  id: string;
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
  configured: boolean;
  active: boolean;
  blocked: boolean;
  priming: boolean;
  rate: number;
}

const phaseChannel = (
  state: GameState,
  runId: ConnectionId,
  phase: TransportPhase,
  gameDefinition: GameDefinition
): TransportChannelTelemetry | null => {
  const definition = maybeLineDefinition(state, runId, phase);
  if (!definition) return null;
  const conduit =
    phase === "gas" ? gasConduitState(state, runId) : liquidConduitState(state, runId);
  const speciesRates: SpeciesRate[] =
    phase === "gas"
      ? GAS_TYPES.filter(
          (species) =>
            Math.abs(gasConduitState(state, runId).lastSpeciesFlow[species]) > FLOW_EPSILON
        ).map((species) => ({
          species,
          rate: Math.abs(gasConduitState(state, runId).lastSpeciesFlow[species]),
        }))
      : LIQUID_TYPES.filter(
          (species) =>
            Math.abs(liquidConduitState(state, runId).lastSpeciesFlow[species]) > FLOW_EPSILON
        ).map((species) => ({
          species,
          rate: Math.abs(liquidConduitState(state, runId).lastSpeciesFlow[species]),
        }));
  return {
    id: `${runId}:${phase}`,
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
  runId: ConnectionId,
  definition: GameDefinition
): TransportChannelTelemetry[] =>
  (["gas", "liquid"] as const).flatMap((phase) => {
    const channel = phaseChannel(state, runId, phase, definition);
    return channel ? [channel] : [];
  });

export const transportRunMaterialFlow = (
  state: GameState,
  runId: ConnectionId,
  species: SpeciesId,
  gameDefinition: GameDefinition
): MaterialRunFlow => {
  const phase: TransportPhase = GAS_TYPES.includes(species as GasType) ? "gas" : "liquid";
  const definition = maybeLineDefinition(state, runId, phase);
  if (!definition) {
    return { forward: 0, reverse: 0, net: 0, blocked: false, priming: false };
  }
  const conduit =
    phase === "gas" ? gasConduitState(state, runId) : liquidConduitState(state, runId);
  const rate =
    phase === "gas"
      ? gasConduitState(state, runId).lastSpeciesFlow[species as GasType]
      : liquidConduitState(state, runId).lastSpeciesFlow[species as LiquidType];
  const oriented = definition.direction[0] === definition.rooms[0] ? rate : -rate;
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
  runId: ConnectionId,
  phase: TransportPhase,
  definition: GameDefinition
): TransportPhaseStatus => {
  const exists = maybeLineDefinition(state, runId, phase) !== null;
  if (!exists) {
    return {
      configured: false,
      active: false,
      blocked: false,
      priming: false,
      rate: 0,
    };
  }
  const conduit =
    phase === "gas" ? gasConduitState(state, runId) : liquidConduitState(state, runId);
  return {
    configured: conduit.enabled,
    active: Math.abs(conduit.lastFlow) > FLOW_EPSILON,
    blocked: conduit.blocked,
    priming: conduit.flowCause === "priming" && conduit.lastFlow > FLOW_EPSILON,
    rate: Math.abs(conduit.lastFlow),
  };
};
