import type { GameDefinition } from "../definitionTypes";
import type {
  GameState,
  GasConduitState,
  GasJunctionState,
  LiquidConduitState,
  LiquidJunctionState,
  RoomDefinition,
  RoomState,
  TransportPhase,
} from "../types";
import type {
  GasTapDefinition,
  LiquidTapDefinition,
  ProcessLineConnection,
  ProcessLineKind,
} from "./map";
import { isProcessLine } from "./map";

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

/** Per-kind line ids are disjoint, so one lookup serves both conduit records. */
export const conduitState = (
  state: GameState,
  connectionId: string
): GasConduitState | LiquidConduitState => {
  const conduit = state.gasConduits[connectionId] ?? state.liquidConduits[connectionId];
  if (!conduit) throw new Error(`Unknown conduit instance: ${connectionId}`);
  return conduit;
};

export const gasJunctionState = (state: GameState, roomId: string): GasJunctionState =>
  instance(state.gasJunctions, roomId, "gas junction");

export const liquidJunctionState = (state: GameState, roomId: string): LiquidJunctionState =>
  instance(state.liquidJunctions, roomId, "liquid junction");

export const definitionRoom = (definition: GameDefinition, roomId: string): RoomDefinition =>
  instance(definition.rooms, roomId, "room definition");

/**
 * Per-phase process-line view (ADR-0005): the Map connection itself. Every engine/UI
 * read of a line's parameters goes through this seam.
 */
export type ProcessLineView = ProcessLineConnection;

const lineKindFor = (phase: TransportPhase): ProcessLineKind =>
  phase === "gas" ? "gas_line" : "liquid_line";

/** Tolerant lookup for command validation: unknown ids are null, not errors. */
export const maybeLineDefinition = (
  definition: GameDefinition,
  id: string,
  phase: TransportPhase
): ProcessLineView | null => {
  const connection = definition.map.connections[id];
  if (!connection || !isProcessLine(connection)) return null;
  return connection.kind === lineKindFor(phase) ? connection : null;
};

/** Loud on unknown connection ids; null when the connection is not a line of this phase. */
export const gasLineDefinition = (
  definition: GameDefinition,
  id: string
): ProcessLineView | null => {
  instance(definition.map.connections, id, "connection");
  return maybeLineDefinition(definition, id, "gas");
};

export const liquidLineDefinition = (
  definition: GameDefinition,
  id: string
): ProcessLineView | null => {
  instance(definition.map.connections, id, "connection");
  return maybeLineDefinition(definition, id, "liquid");
};

const lineIdCache = new WeakMap<GameDefinition, Record<ProcessLineKind, readonly string[]>>();

/** Canonical per-kind line ids in authored map order — iteration order is behavior. */
export const processLineIds = (
  definition: GameDefinition,
  kind: ProcessLineKind
): readonly string[] => {
  let cached = lineIdCache.get(definition);
  if (!cached) {
    const ids = (wanted: ProcessLineKind): readonly string[] =>
      Object.values(definition.map.connections)
        .filter((connection) => connection.kind === wanted)
        .map((connection) => connection.id);
    cached = { gas_line: ids("gas_line"), liquid_line: ids("liquid_line") };
    lineIdCache.set(definition, cached);
  }
  return cached[kind];
};

export const definitionGasJunction = (
  definition: GameDefinition,
  roomId: string
): GasTapDefinition => instance(definition.map.rooms, roomId, "map room").taps.gas;

export const definitionLiquidJunction = (
  definition: GameDefinition,
  roomId: string
): LiquidTapDefinition => instance(definition.map.rooms, roomId, "map room").taps.liquid;
