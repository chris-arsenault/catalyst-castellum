import type {
  CommandDecision,
  ConnectionId,
  EnemyState,
  EquipmentDefinition,
  EquipmentId,
  EquipmentLoadout,
  EquipmentSocketId,
  GasAmounts,
  GasConduitState,
  GasJunctionState,
  GasSourceState,
  GasZone,
  LiquidAmounts,
  LiquidConduitState,
  LiquidJunctionState,
  LiquidSourceState,
  ReactionDefinition,
  ReactionId,
  RoomState,
  RoomId,
  SiteSupplyDefinition,
  SpeciesDefinition,
  SpeciesId,
  StationaryAmounts,
  TowerInstance,
  TowerSupplyStatus,
} from "../types";
import type { LineSpecs, ProcessLineConnection, WorldMap } from "../world/map";
import type { EncounterCommand, EncounterContext, EncounterState, EncounterTower } from "./types";

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

export interface EnvironmentHazardRules {
  gasTemperature: { threshold: number; rate: number };
  staticPressure: { ratioThreshold: number; rate: number };
}

export interface HazardBurst {
  roomId: RoomId;
  zone: GasZone | null;
  sourceId: "hydrogen_oxygen_combustion";
  reactionExtent: number;
  pressureImpulse: number;
  heatDelta: number;
}

export interface ProcessDefinition {
  readonly species: Readonly<Record<SpeciesId, SpeciesDefinition>>;
  readonly reactions: Readonly<Record<ReactionId, ReactionDefinition>>;
  readonly equipment: Readonly<Record<EquipmentId, EquipmentDefinition>>;
  readonly ambientGas: GasAmounts;
  readonly environmentHazards: EnvironmentHazardRules;
  readonly lineBlueprints: Readonly<Record<string, ProcessLineConnection>>;
  readonly lineSpecs: LineSpecs;
  /** The campaign adapter resolves round-based availability before constructing an encounter. */
  readonly supplies: readonly SiteSupplyDefinition[];
  readonly availableSupplyIds: readonly string[];
  readonly loadout: FacilityLoadout;
}

/** Geometry-bound catalog view used by retained room chemistry and transport calculations. */
export type ProcessPhysicsDefinition = Pick<
  ProcessDefinition,
  "species" | "reactions" | "equipment" | "ambientGas" | "environmentHazards"
> & { readonly map: WorldMap };

export type ProcessSimulationDefinition = ProcessDefinition & { readonly map: WorldMap };

export interface ProcessState {
  rooms: Record<string, RoomState>;
  gasSources: Record<string, GasSourceState>;
  liquidSources: Record<string, LiquidSourceState>;
  gasJunctions: Record<string, GasJunctionState>;
  liquidJunctions: Record<string, LiquidJunctionState>;
  gasConduits: Record<string, GasConduitState>;
  liquidConduits: Record<string, LiquidConduitState>;
  gasVent: GasAmounts;
  liquidDrain: LiquidAmounts;
  towerResources: Record<string, TowerInstance["localResources"]>;
  towerSupply: Record<string, TowerSupplyStatus>;
}

export type ProcessEncounterState = EncounterState & { process: ProcessState };
export type ProcessEncounterContext = EncounterContext & {
  definition: EncounterContext["definition"] & { process: ProcessDefinition };
  process: ProcessBridge;
};

export interface ProcessShotSupply {
  damageMultiplier: number;
  consumed: Partial<Record<SpeciesId, number>>;
}

export interface ProcessBridge {
  create: (definition: ProcessDefinition, map: WorldMap) => ProcessState;
  clone: (state: ProcessState) => ProcessState;
  validate: (state: ProcessEncounterState, context: ProcessEncounterContext) => readonly string[];
  evaluateCommand: (
    state: ProcessEncounterState,
    command: EncounterCommand,
    context: ProcessEncounterContext
  ) => CommandDecision | null;
  executeCommand: (
    state: ProcessEncounterState,
    command: EncounterCommand,
    decision: CommandDecision,
    context: ProcessEncounterContext
  ) => void;
  /** Transport, equipment, tower replenishment, then stratification in their existing order. */
  beforeSpawn: (state: ProcessEncounterState, dt: number, context: ProcessEncounterContext) => void;
  emitEnemy: (
    state: ProcessEncounterState,
    enemy: EnemyState,
    dt: number,
    context: ProcessEncounterContext
  ) => void;
  towerSupply: (
    state: ProcessEncounterState,
    tower: EncounterTower,
    context: ProcessEncounterContext
  ) => TowerSupplyStatus | null;
  consumeTowerSupply: (
    state: ProcessEncounterState,
    tower: EncounterTower,
    context: ProcessEncounterContext
  ) => ProcessShotSupply;
  afterTowerShot: (
    state: ProcessEncounterState,
    tower: EncounterTower,
    supply: ProcessShotSupply,
    context: ProcessEncounterContext
  ) => void;
  enemyDeath: (
    state: ProcessEncounterState,
    enemy: EnemyState,
    roomId: string,
    context: ProcessEncounterContext
  ) => void;
  movementMultiplier: (
    state: ProcessEncounterState,
    enemy: EnemyState,
    roomId: string,
    context: ProcessEncounterContext
  ) => number;
  /** Reactions execute after attacks; the kernel records their returned bursts afterward. */
  afterTowers: (
    state: ProcessEncounterState,
    dt: number,
    context: ProcessEncounterContext
  ) => readonly HazardBurst[];
}
