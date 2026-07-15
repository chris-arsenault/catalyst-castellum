import type {
  ConnectionId,
  EnemyDefinition,
  EnemyType,
  EquipmentDefinition,
  EquipmentId,
  EquipmentInstance,
  EquipmentSocketId,
  FacilityPortalState,
  FacilityRing,
  FacilityTerrainKind,
  GasAmounts,
  GasBufferDefinition,
  GasBufferId,
  GasSourceDefinition,
  GasSourceId,
  GridCell,
  LevelId,
  LiquidAmounts,
  LiquidBufferDefinition,
  LiquidBufferId,
  LiquidSourceDefinition,
  LiquidSourceId,
  ProcessDefinition,
  ProcessId,
  ReactionDefinition,
  ReactionId,
  RoomDefinition,
  RoomGeometryDefinition,
  RoomId,
  ScenarioAvailability,
  SpeciesDefinition,
  SpeciesId,
  WaveEntry,
  WorldPoint,
} from "./types";
import type { ArchitecturalConnection, LineSpecs, WorldMap } from "./world/map";

export type ScenarioRoomEquipment = Partial<
  Record<RoomId, Partial<Record<EquipmentSocketId, EquipmentInstance>>>
>;

export interface GasConduitLoadout {
  installed: boolean;
  enabled: boolean;
  gas: Partial<GasAmounts> | null;
}

export interface LiquidConduitLoadout {
  installed: boolean;
  enabled: boolean;
  liquid: Partial<LiquidAmounts> | null;
}

export interface FacilityLoadout {
  equipment: ScenarioRoomEquipment;
  initialTemperatures: Partial<Record<RoomId, number>>;
  gasConduits: Partial<Record<ConnectionId, GasConduitLoadout>>;
  liquidConduits: Partial<Record<ConnectionId, LiquidConduitLoadout>>;
  gasSourceGas: Partial<Record<GasSourceId, Partial<GasAmounts>>>;
  liquidSourceAmounts: Partial<Record<LiquidSourceId, number>>;
  gasBuffers: Partial<Record<GasBufferId, Partial<GasAmounts>>>;
  liquidBuffers: Partial<Record<LiquidBufferId, Partial<LiquidAmounts>>>;
}

export interface RoundDefinition {
  id: string;
  primeSeconds: number;
  wave: WaveEntry[];
  availability: ScenarioAvailability;
}

export interface LevelDefinition {
  id: LevelId;
  number: number;
  focusRoomId: RoomId;
  featuredReactionIds: readonly ReactionId[];
  startingMatter: number;
  startingCoreIntegrity: number;
  assaultTheme: "standard" | "boss";
  loadout: FacilityLoadout;
  rounds: RoundDefinition[];
}

export interface EnvironmentHazardRules {
  gasTemperature: { threshold: number; rate: number };
  staticPressure: { ratioThreshold: number; rate: number };
}

export interface FacilityModel {
  readonly map: WorldMap;
  readonly roomGeometry: Record<RoomId, RoomGeometryDefinition>;
  portalDefinition(portalId: string): ArchitecturalConnection;
  initialPortalStates(): Record<string, FacilityPortalState>;
  inBounds(gridCell: GridCell): boolean;
  cellDefinition(gridCell: GridCell): {
    cell: GridCell;
    terrain: FacilityTerrainKind;
    roomId: RoomId | null;
    portalId: string | null;
  };
  cells(): readonly ReturnType<FacilityModel["cellDefinition"]>[];
  cellIsTraversable(
    gridCell: GridCell,
    portalStates?: Readonly<Record<string, FacilityPortalState>>
  ): boolean;
  cellHasSupport(
    gridCell: GridCell,
    portalStates?: Readonly<Record<string, FacilityPortalState>>
  ): boolean;
  roomAtmosphericCells(roomId: RoomId): readonly GridCell[];
  roomCenterWorld(roomId: RoomId): WorldPoint;
  roomContainsWorldPoint(roomId: RoomId, point: WorldPoint): boolean;
  roomAtWorldPoint(point: WorldPoint): RoomId | null;
  ringForRoom(roomId: RoomId): FacilityRing;
  roomVolume(roomId: RoomId): number;
  roomLiquidSurfaceElevation(roomId: RoomId, liquidVolume: number): number;
  roomPortHeight(roomId: RoomId, elevation: number): number;
}

export interface GamePackSource {
  readonly id: string;
  readonly packId: string;
  readonly contentVersion: number;
  readonly map: WorldMap;
  readonly lineSpecs: LineSpecs;
  readonly roomOrder: readonly RoomId[];
  readonly rooms: Readonly<Record<RoomId, RoomDefinition>>;
  readonly levelOrder: readonly LevelId[];
  readonly species: Readonly<Record<SpeciesId, SpeciesDefinition>>;
  readonly reactions: Readonly<Record<ReactionId, ReactionDefinition>>;
  readonly equipment: Readonly<Record<EquipmentId, EquipmentDefinition>>;
  readonly processes: Readonly<Record<ProcessId, ProcessDefinition>>;
  readonly enemies: Readonly<Record<EnemyType, EnemyDefinition>>;
  readonly levels: Readonly<Record<LevelId, LevelDefinition>>;
  readonly gasSources: Readonly<Record<GasSourceId, GasSourceDefinition>>;
  readonly liquidSources: Readonly<Record<LiquidSourceId, LiquidSourceDefinition>>;
  readonly gasBuffers: Readonly<Record<GasBufferId, GasBufferDefinition>>;
  readonly liquidBuffers: Readonly<Record<LiquidBufferId, LiquidBufferDefinition>>;
  readonly ambientGas: GasAmounts;
  readonly environmentHazards: EnvironmentHazardRules;
}

/** Compiled pack contract; geometry derives on demand via world/derivedModel (plan M2). */
// eslint-disable-next-line sonarjs/redundant-type-aliases
export type GameDefinition = GameDefinitionSource;

/** @deprecated Use GamePackSource for authored input. */
export type GameDefinitionSource = GamePackSource;
