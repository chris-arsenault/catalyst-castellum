import type {
  EquipmentId,
  EquipmentLevel,
  EquipmentSocketId,
  GasBufferId,
  GasSourceId,
  GridCell,
  LiquidBufferId,
  LiquidSourceId,
  RoomId,
  TransportRunId,
} from "./types";

export type FacilityRing = "outer" | "middle" | "inner" | "core";
export type RoomFeatureId = "separated_cell_manifold";

export interface RoomDefinition {
  id: RoomId;
  name: string;
  code: string;
  structure: "entry" | "room" | "core";
  ambientTemperature: number;
  socketCount: 0 | 2;
  features: readonly RoomFeatureId[];
  blurb: string;
}

export interface EquipmentGradeDefinition {
  level: EquipmentLevel;
  effect: string;
  occupiedVolume: number;
}

export interface EquipmentDefinition {
  id: EquipmentId;
  name: string;
  description: string;
  accent: string;
  buildCost: number;
  upgradeCosts: readonly [number, number];
  allowedRings: readonly FacilityRing[];
  requiredFeature: RoomFeatureId | null;
  unique: boolean;
  grades: readonly [EquipmentGradeDefinition, EquipmentGradeDefinition, EquipmentGradeDefinition];
}

export interface EquipmentInstance {
  equipmentId: EquipmentId;
  level: EquipmentLevel;
  enabled: boolean;
}

export type RoomEquipment = Record<EquipmentSocketId, EquipmentInstance | null>;

export interface CellRect {
  column: number;
  elevation: number;
  width: number;
  height: number;
}

export interface FacilityRoomGeometry {
  bounds: CellRect;
  socketCells: Partial<Record<EquipmentSocketId, GridCell>>;
  /** Cells inside the room occupied by solid walkable platforms. */
  platformCells: readonly GridCell[];
  /** Atmospheric cells inside the room that support climbing. */
  ladderCells: readonly GridCell[];
}

export type FacilityTerrainKind =
  "solid" | "room" | "platform" | "ladder" | "passage" | "door" | "trapdoor" | "core_shell";

export interface FacilityCellDefinition {
  cell: GridCell;
  terrain: FacilityTerrainKind;
  roomId: RoomId | null;
  portalId: string | null;
}

export type FacilityPortalKind =
  "passage" | "ladder_shaft" | "floor_hole" | "door" | "trapdoor" | "core_door";

export type FacilityPortalLiquidMode = "spill" | "drain" | "blocked";

export interface FacilityPortalDefinition {
  id: string;
  rooms: readonly [RoomId, RoomId];
  kind: FacilityPortalKind;
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

export interface FacilityPortalState {
  open: boolean;
  sealed: boolean;
  lastGasFlow: number;
  lastLiquidFlow: number;
}

export type FacilityUtilityNodeId =
  GasSourceId | LiquidSourceId | GasBufferId | LiquidBufferId | "gas_vent" | "liquid_drain";

export interface FacilityUtilityNodeDefinition {
  cell: GridCell;
  hostRoomId: RoomId;
}

export type ConduitDestinationKind = "room" | "gas_vent" | "liquid_recovery";

export interface ConduitPhaseDefinition {
  name: string;
  description: string;
  direction: readonly [RoomId, RoomId];
  destinationKind: ConduitDestinationKind;
  actuator: "fan" | "pump" | "passive";
  actuatorHead: number;
  maxFlow: number;
  volumePerCell: number;
  buildCost: number;
  blueprint: readonly GridCell[];
}

export interface TransportRunDefinition {
  id: TransportRunId;
  rooms: readonly [RoomId, RoomId];
  gas: ConduitPhaseDefinition | null;
  liquid: ConduitPhaseDefinition | null;
}

export interface GasJunctionDefinition {
  capacity: number;
  includeRoomInventory: boolean;
  roomPortHeight: number;
  sourceIds: readonly GasSourceId[];
  bufferIds: readonly GasBufferId[];
}

export interface LiquidJunctionDefinition {
  capacity: number;
  includeRoomInventory: boolean;
  roomPortHeight: number;
  sourceIds: readonly LiquidSourceId[];
  bufferIds: readonly LiquidBufferId[];
}

export interface FacilityMapDefinition {
  width: number;
  height: number;
  cellSize: number;
  coreAnchor: GridCell;
  ringRadii: { inner: number; middle: number };
  entryCell: GridCell;
  coreBreachCell: GridCell;
  rooms: Record<RoomId, FacilityRoomGeometry>;
  portals: readonly FacilityPortalDefinition[];
  utilityNodes: Record<FacilityUtilityNodeId, FacilityUtilityNodeDefinition>;
}
