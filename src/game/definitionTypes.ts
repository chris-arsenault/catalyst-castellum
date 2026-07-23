import type {
  ConnectionId,
  EnemyDefinition,
  EnemyType,
  EquipmentDefinition,
  EquipmentId,
  EquipmentLoadout,
  EquipmentSocketId,
  FacilityPortalState,
  FacilityRing,
  FacilityTerrainKind,
  GasAmounts,
  GridCell,
  LevelId,
  LiquidAmounts,
  ReactionDefinition,
  ProcessFamilyId,
  ReactionId,
  RoomGeometryDefinition,
  RoomId,
  ScenarioAvailability,
  SpeciesDefinition,
  SpeciesId,
  StationaryAmounts,
  SiteSupplyDefinition,
  WaveEntry,
  WorldPoint,
} from "./types";
import type {
  ArchitecturalConnection,
  LineSpecs,
  ProcessLineConnection,
  WorldMap,
} from "./world/map";
import type { ModuleId, ModuleTemplate } from "./world/modules";
import type { GeneratedLevelSite } from "./world/siteGeneratorTypes";

export type ScenarioRoomEquipment = Partial<
  Record<RoomId, Partial<Record<EquipmentSocketId, EquipmentLoadout>>>
>;

export interface GasConduitLoadout {
  enabled: boolean;
  gas: Partial<GasAmounts> | null;
}

export interface LiquidConduitLoadout {
  enabled: boolean;
  liquid: Partial<LiquidAmounts> | null;
}

export interface FacilityLoadout {
  equipment: ScenarioRoomEquipment;
  initialTemperatures: Partial<Record<RoomId, number>>;
  /** Presence in either conduit record means the physical line begins installed. */
  gasConduits: Partial<Record<ConnectionId, GasConduitLoadout>>;
  liquidConduits: Partial<Record<ConnectionId, LiquidConduitLoadout>>;
  /** Room-bound solids seeded into authored rooms. */
  stationary: Partial<Record<RoomId, Partial<StationaryAmounts>>>;
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
  /** The site's chemistry palette: 1–3 process families its supplies, seeds, and vessels draw from (ADR-0008). */
  palette: readonly ProcessFamilyId[];
  /** The site's baseline enemy level; wave entries may apply small authored offsets. */
  enemyLevel: number;
  focusRoomId: RoomId;
  featuredReactionIds: readonly ReactionId[];
  startingMatter: number;
  startingCoreIntegrity: number;
  assaultTheme: "standard" | "boss";
  /** Physical feedstock reservoirs and their site-specific economy. */
  supplies: readonly SiteSupplyDefinition[];
  loadout: FacilityLoadout;
  rounds: RoundDefinition[];
  /** Null levels use the pack's authored map; generated sites use a fixed tutorial seed. */
  site: GeneratedLevelSite | null;
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
  /** Optional construction templates; these are not physical map connections. */
  readonly lineBlueprints: Readonly<Record<ConnectionId, ProcessLineConnection>>;
  readonly lineSpecs: LineSpecs;
  readonly modules: Readonly<Record<ModuleId, ModuleTemplate>>;
  readonly levelOrder: readonly LevelId[];
  readonly species: Readonly<Record<SpeciesId, SpeciesDefinition>>;
  readonly reactions: Readonly<Record<ReactionId, ReactionDefinition>>;
  readonly equipment: Readonly<Record<EquipmentId, EquipmentDefinition>>;
  readonly enemies: Readonly<Record<EnemyType, EnemyDefinition>>;
  readonly levels: Readonly<Record<LevelId, LevelDefinition>>;
  readonly ambientGas: GasAmounts;
  readonly environmentHazards: EnvironmentHazardRules;
}

/** Compiled pack contract; geometry derives on demand via world/derivedModel (plan M2). */
// eslint-disable-next-line sonarjs/redundant-type-aliases
export type GameDefinition = GameDefinitionSource;

/** @deprecated Use GamePackSource for authored input. */
export type GameDefinitionSource = GamePackSource;
