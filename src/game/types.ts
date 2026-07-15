import type { HazardChannels } from "./gameStateTypes";
import type { RoomEquipment } from "./facilityTypes";
import {
  DAMAGE_SOURCE_IDS,
  ENEMY_LOCOMOTION_MODES,
  ENEMY_TYPES,
  EQUIPMENT_IDS,
  EQUIPMENT_LEVELS,
  EQUIPMENT_SOCKET_IDS,
  FLOW_CAUSES,
  GAME_EVENT_CODES,
  GAS_BUFFER_IDS,
  GAS_SOURCE_IDS,
  GAS_TYPES,
  GAS_ZONES,
  LEVEL_IDS,
  LIQUID_BUFFER_IDS,
  LIQUID_SOURCE_IDS,
  LIQUID_TYPES,
  LIMIT_CONDITION_CODES,
  PROCESS_IDS,
  REACTION_IDS,
  ROOM_REACTION_IDS,
  TRANSPORT_PHASES,
} from "./identifiers";

export * from "./gameStateTypes";
export * from "./facilityTypes";
export * from "./identifiers";

export type GasType = (typeof GAS_TYPES)[number];
export type GasZone = (typeof GAS_ZONES)[number];
export type LiquidType = (typeof LIQUID_TYPES)[number];
export type SpeciesId = GasType | LiquidType;
export type EnemyType = (typeof ENEMY_TYPES)[number];
/** Opaque enemy-route instance id (ADR-0002); alias kept for signature readability. */
// eslint-disable-next-line sonarjs/redundant-type-aliases
export type EnemyRouteId = string;
export type GasSourceId = (typeof GAS_SOURCE_IDS)[number];
export type LiquidSourceId = (typeof LIQUID_SOURCE_IDS)[number];
export type GasBufferId = (typeof GAS_BUFFER_IDS)[number];
export type LiquidBufferId = (typeof LIQUID_BUFFER_IDS)[number];
/** Opaque transport-connection instance id (ADR-0002); alias kept for signature readability. */
// eslint-disable-next-line sonarjs/redundant-type-aliases
export type TransportRunId = string;
export type EquipmentId = (typeof EQUIPMENT_IDS)[number];
export type EquipmentSocketId = (typeof EQUIPMENT_SOCKET_IDS)[number];
export type EquipmentLevel = (typeof EQUIPMENT_LEVELS)[number];
export type TransportPhase = (typeof TRANSPORT_PHASES)[number];
export type ProcessId = (typeof PROCESS_IDS)[number];
export type ReactionId = (typeof REACTION_IDS)[number];
export type RoomReactionId = (typeof ROOM_REACTION_IDS)[number];
export type LevelId = (typeof LEVEL_IDS)[number];
export type DamageSourceId = (typeof DAMAGE_SOURCE_IDS)[number];
export type LimitConditionCode = (typeof LIMIT_CONDITION_CODES)[number];

export type GasAmounts = Record<GasType, number>;
export type GasLayers = Record<GasZone, GasAmounts>;
export type GasTemperatures = Record<GasZone, number>;
export type LiquidAmounts = Record<LiquidType, number>;
export type ElementalComposition = Record<string, number>;

/** Opaque room instance id (ADR-0002); alias kept for signature readability. */
// eslint-disable-next-line sonarjs/redundant-type-aliases
export type RoomId = string;

export interface Point {
  x: number;
  y: number;
}

export interface WorldPoint {
  x: number;
  elevation: number;
}

export interface GridCell {
  column: number;
  elevation: number;
}

export interface RoomGeometryDefinition {
  x: number;
  floorElevation: number;
  width: number;
  height: number;
}

export type ActuatorKind = "fan" | "pump" | "passive";

export interface LiquidSourceDefinition {
  id: LiquidSourceId;
  formula: string;
  substance: LiquidType;
  capacity: number;
  initialAmount: number;
  chargeAmount: number;
  chargeCost: number;
  hostRoomId: RoomId;
  accent: string;
}

export interface GasSourceDefinition {
  id: GasSourceId;
  formula: string;
  capacity: number;
  /** Infinite sources hold their initial mixture forever; draws never deplete them. */
  infinite: boolean;
  initialGas: Partial<GasAmounts>;
  chargeGas: Partial<GasAmounts>;
  chargeCost: number;
  hostRoomId: RoomId;
  accent: string;
}

export interface GasBufferDefinition {
  id: GasBufferId;
  capacity: number;
  accent: string;
}

export interface LiquidBufferDefinition {
  id: LiquidBufferId;
  capacity: number;
  accent: string;
}

export interface ProcessDefinition {
  id: ProcessId;
  reactionId: ReactionId;
  equipmentId: EquipmentId;
  executor: "electrolysis";
  outputs: readonly ProcessOutputDefinition[];
  separatorBackflow: SeparatorBackflowDefinition | null;
  accent: string;
}

export type ProcessOutputDefinition =
  | {
      phase: "gas";
      speciesId: GasType;
      bufferId: GasBufferId;
      limitCode: "anode_headroom" | "cathode_headroom";
    }
  | {
      phase: "liquid";
      speciesId: LiquidType;
      bufferId: LiquidBufferId;
      limitCode: "outlet_headroom";
    };

export interface SeparatorBackflowDefinition {
  leftBufferId: GasBufferId;
  rightBufferId: GasBufferId;
  leftSpeciesId: GasType;
  rightSpeciesId: GasType;
  activationDifference: number;
  flowOffset: number;
  rate: number;
}

export interface SpeciesDefinition {
  id: SpeciesId;
  formula: string;
  phase: "gas" | "liquid";
  elements: ElementalComposition;
  molarMass: number;
  referenceDensity: number;
  color: string;
  hazards: readonly SpeciesHazardRule[];
}

export interface SpeciesHazardRule {
  basis: "gas_partial_ratio" | "liquid_strength";
  direction: "above" | "below";
  threshold: number;
  rate: number;
  channel: keyof HazardChannels;
  exposure: "all" | "oxygen_breathers" | "floor_contact";
}

export interface ReactionParticipant {
  species: SpeciesId;
  coefficient: number;
}

export interface ReactionDefinition {
  id: ReactionId;
  code: string;
  kind: "chemical" | "physical";
  equation: string;
  reactants: ReactionParticipant[];
  products: ReactionParticipant[];
  behavior: ReactionBehaviorDefinition;
}

export type ReactionBehaviorDefinition =
  | {
      kind: "electrolysis";
      maximumRate: number;
      roomHeatPerExtent: number;
    }
  | {
      kind: "flash";
      ignitionExtent: number;
      maximumExtent: number;
      minimumHydrogenFraction: number;
      minimumOxygenFraction: number;
      cooldownSeconds: number;
      pressurePulseBase: number;
      pressurePulsePerExtent: number;
      gasHeatPerExtent: number;
      roomHeatPerExtent: number;
      pressureDamageBase: number;
      pressureDamagePerExtent: number;
      heatDamagePerExtent: number;
    }
  | {
      kind: "gas_recombination";
      maximumRate: number;
      activationTemperature: number;
      activationRange: number;
      gasHeatPerExtent: number;
      roomHeatPerExtent: number;
      event?: ReactionEventTrigger;
    }
  | {
      kind: "absorption";
      maximumRate: number;
      solventInventoryScale: number;
      maximumProductFraction: number;
    }
  | {
      kind: "mixed_contact";
      maximumRate: number;
      mixingInventoryScale: number;
      roomHeatPerExtent: number;
      headroom?: "gas" | "liquid";
      event?: ReactionEventTrigger;
    };

export interface ReactionEventTrigger {
  code: (typeof GAME_EVENT_CODES)[number];
  roomId: RoomId;
}

export interface ReactionTelemetry {
  lastRate: number;
  limitingFactor: LimitingFactor;
}

export type LimitingFactor =
  | { kind: "species"; speciesId: SpeciesId; zone: GasZone | null }
  | { kind: "condition"; code: LimitConditionCode; zone: GasZone | null }
  | { kind: "legacy"; label: string };

export interface RoomState {
  id: RoomId;
  gas: GasLayers;
  gasTemperature: GasTemperatures;
  liquid: LiquidAmounts;
  temperature: number;
  residue: number;
  reactionIntensity: number;
  pressurePulse: number;
  flashCooldown: Record<GasZone, number>;
  combustionCount: number;
  reactions: Record<RoomReactionId, ReactionTelemetry>;
  equipment: RoomEquipment;
}

export interface GasSourceState {
  gas: GasAmounts;
}

export interface LiquidSourceState {
  liquid: LiquidAmounts;
}

export interface GasBufferState {
  gas: GasAmounts;
}

export interface LiquidBufferState {
  liquid: LiquidAmounts;
}

export interface GasConduitState {
  installed: boolean;
  enabled: boolean;
  route: GridCell[];
  gas: GasAmounts;
  lastFlow: number;
  lastSpeciesFlow: GasAmounts;
  blocked: boolean;
  flowCause: FlowCause;
  temperature: number;
}

export interface LiquidConduitState {
  installed: boolean;
  enabled: boolean;
  route: GridCell[];
  liquid: LiquidAmounts;
  lastFlow: number;
  lastSpeciesFlow: LiquidAmounts;
  blocked: boolean;
  flowCause: FlowCause;
}

export interface GasJunctionState {
  gas: GasAmounts;
  temperature: number;
}

export interface LiquidJunctionState {
  liquid: LiquidAmounts;
}

export type FlowCause = (typeof FLOW_CAUSES)[number];

export interface ProcessState {
  setting: number;
  lastRate: number;
  totalProcessed: number;
  limitingFactor: LimitingFactor;
  powerDraw: number;
  separatorLeakTotal: number;
}

export type DamageLedger = Record<DamageSourceId, HazardChannels>;

export interface DamageReceipt {
  sourceId: DamageSourceId;
  channels: HazardChannels;
  amount: number;
  elapsed: number;
}

export interface EnemyDefinition {
  type: EnemyType;
  health: number;
  speed: number;
  coreDamage: number;
  needsOxygen: boolean;
  flying: boolean;
  hazardMultipliers: HazardChannels;
  color: string;
  residueOnDeath: number;
  matterYield: number;
  presentation: {
    appearance: EnemyAppearanceArchetype;
    manualIcon: EnemyManualIcon;
  };
}

export type EnemyAppearanceArchetype = "crawler" | "skimmer" | "floater" | "shell" | "bellows";
export type EnemyManualIcon = "bug" | "wind" | "bird" | "shield" | "snail";

export interface EnemyState {
  id: number;
  type: EnemyType;
  health: number;
  maxHealth: number;
  routeId: EnemyRouteId;
  path: EnemyPathStep[];
  pathIndex: number;
  progress: number;
  mode: EnemyLocomotionMode;
  facing: -1 | 1;
  spawnAge: number;
  damageTaken: number;
  damageBySource: DamageLedger;
  lastDamage: DamageReceipt | null;
}

export type EnemyLocomotionMode = (typeof ENEMY_LOCOMOTION_MODES)[number];

export interface EnemyPathStep {
  cell: GridCell;
  mode: EnemyLocomotionMode;
  portalId: string | null;
}

export interface WaveEntry {
  at: number;
  type: EnemyType;
  routeId: EnemyRouteId;
  /** Multiplies the enemy's base health at spawn; 1 is a standard unit, above 1 is a veteran. */
  healthScale: number;
}
