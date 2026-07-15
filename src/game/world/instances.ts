import type { GameDefinition } from "../definitionTypes";
import type {
  GameState,
  GasConduitState,
  GasJunctionDefinition,
  GasJunctionState,
  LiquidConduitState,
  LiquidJunctionDefinition,
  LiquidJunctionState,
  RoomDefinition,
  RoomState,
  TransportRunDefinition,
} from "../types";

/**
 * Instance-keyed world access (ADR-0002). In a dynamic world a missing instance id is
 * a programming error, so lookups are loud: they return the instance or throw with the
 * id and kind. Never index world records directly.
 */
export const instance = <Value>(
  record: Readonly<Partial<Record<string, Value>>>,
  id: string,
  kind: string
): Value => {
  const value = record[id];
  if (value === undefined) throw new Error(`Unknown ${kind} instance: ${id}`);
  return value;
};

export const roomState = (state: GameState, roomId: string): RoomState =>
  instance(state.rooms, roomId, "room");

export const gasConduitState = (state: GameState, runId: string): GasConduitState =>
  instance(state.gasConduits, runId, "gas conduit");

export const liquidConduitState = (state: GameState, runId: string): LiquidConduitState =>
  instance(state.liquidConduits, runId, "liquid conduit");

export const gasJunctionState = (state: GameState, roomId: string): GasJunctionState =>
  instance(state.gasJunctions, roomId, "gas junction");

export const liquidJunctionState = (state: GameState, roomId: string): LiquidJunctionState =>
  instance(state.liquidJunctions, roomId, "liquid junction");

export const definitionRoom = (definition: GameDefinition, roomId: string): RoomDefinition =>
  instance(definition.rooms, roomId, "room definition");

export const definitionTransportRun = (
  definition: GameDefinition,
  runId: string
): TransportRunDefinition => instance(definition.transportRuns, runId, "transport run");

export const definitionGasJunction = (
  definition: GameDefinition,
  roomId: string
): GasJunctionDefinition => instance(definition.gasJunctions, roomId, "gas junction definition");

export const definitionLiquidJunction = (
  definition: GameDefinition,
  roomId: string
): LiquidJunctionDefinition =>
  instance(definition.liquidJunctions, roomId, "liquid junction definition");
