import type { GameDefinition } from "../definitionTypes";
import type {
  ConduitDestinationKind,
  GameState,
  GasConduitState,
  GasJunctionDefinition,
  GasJunctionState,
  GridCell,
  LiquidConduitState,
  LiquidJunctionDefinition,
  LiquidJunctionState,
  RoomDefinition,
  RoomId,
  RoomState,
  TransportPhase,
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

/**
 * Per-phase process-line view in the destination connection shape (ADR-0005). Every
 * engine/UI read of a line's parameters goes through this seam so the backing store
 * can move from the paired run catalog to Map connections without touching call sites.
 */
export interface ProcessLineView {
  readonly rooms: readonly [RoomId, RoomId];
  readonly direction: readonly [RoomId, RoomId];
  readonly destinationKind: ConduitDestinationKind;
  readonly actuator: "fan" | "pump" | "passive";
  readonly actuatorHead: number;
  readonly maxFlow: number;
  readonly volumePerCell: number;
  readonly buildCost: number;
  readonly route: readonly GridCell[];
}

type LineViews = Record<TransportPhase, ReadonlyMap<string, ProcessLineView>>;
const lineViewCache = new WeakMap<GameDefinition, LineViews>();

const lineViewsFor = (definition: GameDefinition): LineViews => {
  const cached = lineViewCache.get(definition);
  if (cached) return cached;
  const gas = new Map<string, ProcessLineView>();
  const liquid = new Map<string, ProcessLineView>();
  for (const run of Object.values(definition.transportRuns)) {
    for (const [phase, views] of [
      ["gas", gas],
      ["liquid", liquid],
    ] as const) {
      const authored = run[phase];
      if (!authored) continue;
      views.set(run.id, {
        rooms: run.rooms,
        direction: authored.direction,
        destinationKind: authored.destinationKind,
        actuator: authored.actuator,
        actuatorHead: authored.actuatorHead,
        maxFlow: authored.maxFlow,
        volumePerCell: authored.volumePerCell,
        buildCost: authored.buildCost,
        route: authored.blueprint,
      });
    }
  }
  const views: LineViews = { gas, liquid };
  lineViewCache.set(definition, views);
  return views;
};

/** Tolerant lookup for command validation: unknown ids are null, not errors. */
export const maybeLineDefinition = (
  definition: GameDefinition,
  id: string,
  phase: TransportPhase
): ProcessLineView | null => lineViewsFor(definition)[phase].get(id) ?? null;

/** Loud on unknown connection ids; null when the pair has no line of this phase. */
export const gasLineDefinition = (
  definition: GameDefinition,
  id: string
): ProcessLineView | null => {
  definitionTransportRun(definition, id);
  return maybeLineDefinition(definition, id, "gas");
};

export const liquidLineDefinition = (
  definition: GameDefinition,
  id: string
): ProcessLineView | null => {
  definitionTransportRun(definition, id);
  return maybeLineDefinition(definition, id, "liquid");
};

export const definitionGasJunction = (
  definition: GameDefinition,
  roomId: string
): GasJunctionDefinition => instance(definition.gasJunctions, roomId, "gas junction definition");

export const definitionLiquidJunction = (
  definition: GameDefinition,
  roomId: string
): LiquidJunctionDefinition =>
  instance(definition.liquidJunctions, roomId, "liquid junction definition");
