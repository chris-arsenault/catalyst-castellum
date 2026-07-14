import type {
  EnemyDefinition,
  EnemyType,
  EquipmentDefinition,
  EquipmentId,
  EquipmentInstance,
  EquipmentSocketId,
  FacilityMapDefinition,
  FacilityPortalDefinition,
  FacilityPortalState,
  FacilityRing,
  FacilityTerrainKind,
  GameCommand,
  GasAmounts,
  GasBufferDefinition,
  GasBufferId,
  GasJunctionDefinition,
  GasSourceDefinition,
  GasSourceId,
  GridCell,
  LevelId,
  LiquidAmounts,
  LiquidBufferDefinition,
  LiquidBufferId,
  LiquidJunctionDefinition,
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
  TransportRunDefinition,
  TransportRunId,
  WaveEntry,
  WorldPoint,
} from "./types";

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
  gasConduits: Partial<Record<TransportRunId, GasConduitLoadout>>;
  liquidConduits: Partial<Record<TransportRunId, LiquidConduitLoadout>>;
  gasSourceGas: Partial<Record<GasSourceId, Partial<GasAmounts>>>;
  liquidSourceAmounts: Partial<Record<LiquidSourceId, number>>;
  gasBuffers: Partial<Record<GasBufferId, Partial<GasAmounts>>>;
  liquidBuffers: Partial<Record<LiquidBufferId, Partial<LiquidAmounts>>>;
}

export interface RoundDefinition {
  id: string;
  title: string;
  detail: string;
  objective: string;
  primeSeconds: number;
  wave: WaveEntry[];
  availability: ScenarioAvailability;
}

export interface LevelDefinition {
  id: LevelId;
  number: number;
  name: string;
  kicker: string;
  briefing: string;
  lesson: string;
  focusRoomId: RoomId;
  startingMatter: number;
  startingCoreIntegrity: number;
  assaultTheme: "standard" | "boss";
  loadout: FacilityLoadout;
  rounds: RoundDefinition[];
  playtestActions: GameCommand[];
}

export interface EnvironmentHazardRules {
  gasTemperature: { threshold: number; rate: number };
  staticPressure: { ratioThreshold: number; rate: number };
}

export interface FacilityModel {
  readonly map: FacilityMapDefinition;
  readonly roomGeometry: Record<RoomId, RoomGeometryDefinition>;
  portalDefinition(portalId: string): FacilityPortalDefinition;
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

export interface GameDefinitionSource {
  readonly id: string;
  readonly packId: string;
  readonly contentVersion: number;
  readonly facilityMap: FacilityMapDefinition;
  readonly roomOrder: readonly RoomId[];
  readonly rooms: Readonly<Record<RoomId, RoomDefinition>>;
  readonly levelOrder: readonly LevelId[];
  readonly species: Readonly<Record<SpeciesId, SpeciesDefinition>>;
  readonly reactions: Readonly<Record<ReactionId, ReactionDefinition>>;
  readonly equipment: Readonly<Record<EquipmentId, EquipmentDefinition>>;
  readonly processes: Readonly<Record<ProcessId, ProcessDefinition>>;
  readonly enemies: Readonly<Record<EnemyType, EnemyDefinition>>;
  readonly levels: Readonly<Record<LevelId, LevelDefinition>>;
  readonly transportRuns: Readonly<Record<TransportRunId, TransportRunDefinition>>;
  readonly gasSources: Readonly<Record<GasSourceId, GasSourceDefinition>>;
  readonly liquidSources: Readonly<Record<LiquidSourceId, LiquidSourceDefinition>>;
  readonly gasBuffers: Readonly<Record<GasBufferId, GasBufferDefinition>>;
  readonly liquidBuffers: Readonly<Record<LiquidBufferId, LiquidBufferDefinition>>;
  readonly gasJunctions: Readonly<Record<RoomId, GasJunctionDefinition>>;
  readonly liquidJunctions: Readonly<Record<RoomId, LiquidJunctionDefinition>>;
  readonly ambientGas: GasAmounts;
  readonly environmentHazards: EnvironmentHazardRules;
}

export interface GameDefinition extends GameDefinitionSource {
  readonly facility: FacilityModel;
}
