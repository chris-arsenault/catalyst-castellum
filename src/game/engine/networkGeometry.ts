import { gridCellToWorldPoint } from "../spatial";
import type { GameDefinition } from "../definitionTypes";
import type {
  ConduitPhaseDefinition,
  GameState,
  GridCell,
  TransportPhase,
  TransportRunId,
  WorldPoint,
} from "../types";
import { gasConduitState, liquidConduitState } from "../world/instances";
import { definitionTransportRun } from "../world/instances";

const REFERENCE_ROUTE_LENGTH = 32;
const MINIMUM_LENGTH_FACTOR = 0.68;
const MAXIMUM_LENGTH_FACTOR = 1.3;

export const conduitDefinition = (
  runId: TransportRunId,
  phase: TransportPhase,
  definition: GameDefinition
): ConduitPhaseDefinition | null => definitionTransportRun(definition, runId)[phase];

export const conduitState = (state: GameState, runId: TransportRunId, phase: TransportPhase) =>
  phase === "gas" ? gasConduitState(state, runId) : liquidConduitState(state, runId);

export const conduitRoute = (
  state: GameState,
  runId: TransportRunId,
  phase: TransportPhase
): readonly GridCell[] => conduitState(state, runId, phase).route;

export const conduitWorldRoute = (
  state: GameState,
  runId: TransportRunId,
  phase: TransportPhase
): WorldPoint[] => conduitRoute(state, runId, phase).map(gridCellToWorldPoint);

export const gridRouteLength = (route: readonly GridCell[]): number => {
  let length = 0;
  for (let index = 1; index < route.length; index += 1) {
    const from = route[index - 1] as GridCell;
    const to = route[index] as GridCell;
    length += Math.hypot(to.column - from.column, to.elevation - from.elevation);
  }
  return length;
};

export const conduitLength = (
  state: GameState,
  runId: TransportRunId,
  phase: TransportPhase
): number => gridRouteLength(conduitRoute(state, runId, phase));

const lengthFactor = (length: number): number =>
  Math.min(
    MAXIMUM_LENGTH_FACTOR,
    Math.max(MINIMUM_LENGTH_FACTOR, Math.sqrt(REFERENCE_ROUTE_LENGTH / Math.max(1, length)))
  );

export const conduitCapacity = (
  state: GameState,
  runId: TransportRunId,
  phase: TransportPhase,
  definition: GameDefinition
): number => {
  const conduit = conduitDefinition(runId, phase, definition);
  return conduit ? conduitLength(state, runId, phase) * conduit.volumePerCell : 0;
};

export const conduitMaxFlow = (
  state: GameState,
  runId: TransportRunId,
  phase: TransportPhase,
  definition: GameDefinition
): number => {
  const conduit = conduitDefinition(runId, phase, definition);
  return conduit ? conduit.maxFlow * lengthFactor(conduitLength(state, runId, phase)) : 0;
};

export const conduitEndpoint = (
  state: GameState,
  runId: TransportRunId,
  phase: TransportPhase,
  endpoint: "from" | "to"
): WorldPoint => {
  const route = conduitRoute(state, runId, phase);
  const cell = (endpoint === "from" ? route[0] : route.at(-1)) as GridCell | undefined;
  if (!cell) throw new Error(`${runId} ${phase} conduit has no route`);
  return gridCellToWorldPoint(cell);
};

export const conduitCrestElevation = (
  state: GameState,
  runId: TransportRunId,
  phase: TransportPhase
): number =>
  Math.max(
    ...conduitRoute(state, runId, phase).map((cell) => gridCellToWorldPoint(cell).elevation)
  );
