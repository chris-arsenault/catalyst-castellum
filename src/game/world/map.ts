import type {
  ConduitDestinationKind,
  ConnectionId,
  EquipmentSocketId,
  FacilityPortalKind,
  FacilityPortalLiquidMode,
  FacilityUtilityNodeId,
  GasSourceId,
  GridCell,
  LiquidSourceId,
  RoomId,
} from "../types";

/**
 * The simulation's entire world contract (ADR-0001): a 2D grid of rooms and routed
 * connections. Producers make WorldMaps before a level starts; the engine and UI read
 * everything spatial from one of these.
 */

export type RoomProvenance = "site" | "hull";

export interface CellRect {
  column: number;
  elevation: number;
  width: number;
  height: number;
}

export interface GasTapDefinition {
  capacity: number;
  includeRoomInventory: boolean;
  roomPortHeight: number;
  sourceIds: readonly GasSourceId[];
}

export interface LiquidTapDefinition {
  capacity: number;
  includeRoomInventory: boolean;
  roomPortHeight: number;
  sourceIds: readonly LiquidSourceId[];
}

export interface MapRoom {
  id: RoomId;
  /** Short display code (e.g. "R-02"); grafted rooms mint theirs from the module. */
  code: string;
  structure: "entry" | "room" | "core";
  ambientTemperature: number;
  socketCount: 0 | 2;
  bounds: CellRect;
  socketCells: Partial<Record<EquipmentSocketId, GridCell>>;
  /** Cells inside the room occupied by solid walkable platforms. */
  platformCells: readonly GridCell[];
  /** Atmospheric cells inside the room that support climbing. */
  ladderCells: readonly GridCell[];
  taps: { gas: GasTapDefinition; liquid: LiquidTapDefinition };
  provenance: RoomProvenance;
}

export type ProcessLineKind = "gas_line" | "liquid_line";
export type ArchitecturalConnectionKind = FacilityPortalKind;
export type ConnectionKind = ProcessLineKind | ArchitecturalConnectionKind;

/** A gas or liquid line: route geometry drives the physics (ADR-0005). */
export interface ProcessLineConnection {
  id: ConnectionId;
  kind: ProcessLineKind;
  rooms: readonly [RoomId, RoomId];
  direction: readonly [RoomId, RoomId];
  destinationKind: ConduitDestinationKind;
  actuator: "fan" | "pump" | "passive";
  actuatorHead: number;
  maxFlow: number;
  volumePerCell: number;
  buildCost: number;
  route: readonly GridCell[];
}

/** An architectural opening: today's portal data as first-class connection data. */
export interface ArchitecturalConnection {
  id: ConnectionId;
  kind: ArchitecturalConnectionKind;
  rooms: readonly [RoomId, RoomId];
  /** Cells cut through the otherwise-solid boundary between the two room regions. */
  connectorCells: readonly GridCell[];
  /** The adjacent atmospheric cells used to derive both navigation and reagent exchange. */
  endpoints: readonly [GridCell, GridCell];
  orientation: "horizontal" | "vertical";
  sillElevation: number;
  aperture: number;
  gasConductance: number;
  liquidConductance: number;
  liquidMode: FacilityPortalLiquidMode;
  defaultOpen: boolean;
  defaultSealed: boolean;
  sealGroupId: string | null;
  /** Connector atmospheric cells are assigned to this room for lumped exposure. */
  hostRoomId: RoomId;
}

export type MapConnection = ProcessLineConnection | ArchitecturalConnection;

export interface MapUtilityNode {
  cell: GridCell;
  hostRoomId: RoomId;
}

export interface WorldMap {
  width: number;
  height: number;
  cellSize: number;
  coreAnchor: GridCell;
  ringRadii: { inner: number; middle: number };
  entryCell: GridCell;
  coreBreachCell: GridCell;
  rooms: Record<RoomId, MapRoom>;
  connections: Record<ConnectionId, MapConnection>;
  /** Feedstock, vent, and drain ports present on this map, hosted by their rooms. */
  utilityNodes: Partial<Record<FacilityUtilityNodeId, MapUtilityNode>>;
}

/** Parameters for player-built lines of a kind; cost scales with routed length. */
export interface LineSpec {
  actuator: "fan" | "pump" | "passive";
  actuatorHead: number;
  maxFlow: number;
  volumePerCell: number;
  baseCost: number;
  costPerCell: number;
}

export type LineSpecs = Record<ProcessLineKind, LineSpec>;

export const isProcessLine = (connection: MapConnection): connection is ProcessLineConnection =>
  connection.kind === "gas_line" || connection.kind === "liquid_line";

export const isArchitectural = (connection: MapConnection): connection is ArchitecturalConnection =>
  !isProcessLine(connection);

/** Architectural openings in authored map order — iteration order is behavior. */
export const architecturalConnections = (map: WorldMap): ArchitecturalConnection[] =>
  Object.values(map.connections).filter(isArchitectural);

/**
 * Canonical process-line id for a room pair. Sorted so authored lines and M3's
 * player-built lines mint the same id for the same pair, regardless of direction.
 */
export const processLineId = (kind: ProcessLineKind, a: RoomId, b: RoomId): ConnectionId => {
  const [first, second] = a <= b ? [a, b] : [b, a];
  return `${kind === "gas_line" ? "gas" : "liquid"}:${first}__${second}`;
};

/** Inverse of processLineId; null when the id is not a canonical pair id. */
export const parseProcessLineId = (
  id: ConnectionId
): { kind: ProcessLineKind; rooms: readonly [RoomId, RoomId] } | null => {
  const match = /^(gas|liquid):([^_]+(?:_[^_]+)*)__(.+)$/.exec(id);
  if (!match) return null;
  const [, prefix, first, second] = match;
  if (!prefix || !first || !second) return null;
  return {
    kind: prefix === "gas" ? "gas_line" : "liquid_line",
    rooms: [first, second],
  };
};
