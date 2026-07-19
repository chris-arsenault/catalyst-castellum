import type { HazardChannels } from "./gameStateTypes";
import type { RoomEquipment } from "./facilityTypes";
import {
  DAMAGE_SOURCE_IDS,
  ENEMY_TYPES,
  EQUIPMENT_IDS,
  EQUIPMENT_LEVELS,
  EQUIPMENT_SOCKET_IDS,
  FLOW_CAUSES,
  GAME_EVENT_CODES,
  GAS_TYPES,
  GAS_ZONES,
  LEVEL_IDS,
  LIQUID_TYPES,
  LIMIT_CONDITION_CODES,
  EQUIPMENT_OUTPUT_IDS,
  REACTION_IDS,
  ROOM_REACTION_IDS,
  STATIONARY_TYPES,
  TRANSPORT_PHASES,
} from "./identifiers";

export * from "./gameStateTypes";
export * from "./facilityTypes";
export * from "./geometryTypes";
export * from "./identifiers";
export * from "./enemyTypes";
import type { GridCell } from "./geometryTypes";

export type GasType = (typeof GAS_TYPES)[number];
export type GasZone = (typeof GAS_ZONES)[number];
export type LiquidType = (typeof LIQUID_TYPES)[number];
export type StationaryType = (typeof STATIONARY_TYPES)[number];
export type SpeciesId = GasType | LiquidType | StationaryType;
export type EnemyType = (typeof ENEMY_TYPES)[number];
/** Opaque enemy-route instance id (ADR-0002); alias kept for signature readability. */
// eslint-disable-next-line sonarjs/redundant-type-aliases
export type EnemyRouteId = string;
/** Opaque site-authored gas-reservoir instance ID. */
// eslint-disable-next-line sonarjs/redundant-type-aliases
export type GasSourceId = string;
/** Opaque site-authored liquid-reservoir instance ID. */
// eslint-disable-next-line sonarjs/redundant-type-aliases
export type LiquidSourceId = string;
export type EquipmentOutputId = (typeof EQUIPMENT_OUTPUT_IDS)[number];
/** Opaque transport-connection instance id (ADR-0002); alias kept for signature readability. */
// eslint-disable-next-line sonarjs/redundant-type-aliases
export type ConnectionId = string;
export type EquipmentId = (typeof EQUIPMENT_IDS)[number];
export type EquipmentSocketId = (typeof EQUIPMENT_SOCKET_IDS)[number];
export type EquipmentLevel = (typeof EQUIPMENT_LEVELS)[number];
export type TransportPhase = (typeof TRANSPORT_PHASES)[number];
export type ReactionId = (typeof REACTION_IDS)[number];
export type RoomReactionId = (typeof ROOM_REACTION_IDS)[number];
export type LevelId = (typeof LEVEL_IDS)[number];
export type DamageSourceId = (typeof DAMAGE_SOURCE_IDS)[number];
export type LimitConditionCode = (typeof LIMIT_CONDITION_CODES)[number];

export type GasAmounts = Record<GasType, number>;
export type GasLayers = Record<GasZone, GasAmounts>;
export type GasTemperatures = Record<GasZone, number>;
export type LiquidAmounts = Record<LiquidType, number>;
export type StationaryAmounts = Record<StationaryType, number>;
export type ElementalComposition = Record<string, number>;

/** Opaque room instance id (ADR-0002); alias kept for signature readability. */
// eslint-disable-next-line sonarjs/redundant-type-aliases
export type RoomId = string;

export type ActuatorKind = "fan" | "pump" | "passive";

export interface LiquidSupplyDefinition {
  id: LiquidSourceId;
  code: string;
  phase: "liquid";
  capacity: number;
  initial: Partial<LiquidAmounts>;
  availableFromRound: string;
  replenishment:
    | { kind: "unlimited"; contents: Partial<LiquidAmounts> }
    | { kind: "matter"; contents: Partial<LiquidAmounts>; cost: number };
  accent: string;
}

export interface GasSupplyDefinition {
  id: GasSourceId;
  code: string;
  phase: "gas";
  capacity: number;
  initial: Partial<GasAmounts>;
  availableFromRound: string;
  replenishment:
    | { kind: "unlimited"; contents: Partial<GasAmounts> }
    | { kind: "matter"; contents: Partial<GasAmounts>; cost: number };
  accent: string;
}

export type SiteSupplyDefinition = GasSupplyDefinition | LiquidSupplyDefinition;

export interface SpeciesDefinition {
  id: SpeciesId;
  formula: string;
  phase: "gas" | "liquid" | "stationary";
  elements: ElementalComposition;
  molarMass: number;
  referenceDensity: number;
  color: string;
  /** Combat attribution for every hazard rule owned by this species. */
  damageSourceId: DamageSourceId | null;
  hazards: readonly SpeciesHazardRule[];
}

export interface SpeciesHazardRule {
  basis: "gas_partial_ratio" | "liquid_strength" | "stationary_inventory";
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

export interface ReactionRateOrder {
  species: SpeciesId;
  order: number;
}

export interface MassActionDirectionDefinition {
  rateConstant: number;
  rateOrders: readonly ReactionRateOrder[];
  activationTemperature: number;
  fullActivationTemperature: number;
  /** Rate begins falling here and reaches zero at inactiveTemperature. */
  deactivationTemperature?: number;
  inactiveTemperature?: number;
  minimumPressureRatio?: number;
  fullPressureRatio?: number;
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
    }
  | {
      /** Simultaneous, snapshot-based room chemistry with authored first/second-order rate laws. */
      kind: "mass_action";
      maximumRate: number;
      halfSaturation: number;
      contact: "gas" | "liquid";
      forward: MassActionDirectionDefinition;
      reverse?: MassActionDirectionDefinition;
      catalyst?: { species: StationaryType; halfSaturation: number };
      inhibitors?: readonly { species: SpeciesId; halfInhibition: number }[];
      gasHeatPerExtent: number;
      roomHeatPerExtent: number;
    };

export interface ReactionEventTrigger {
  code: (typeof GAME_EVENT_CODES)[number];
  roomId: RoomId;
}

export interface ReactionTelemetry {
  lastRate: number;
  direction: "forward" | "reverse" | "idle";
  limitingFactor: LimitingFactor;
}

export type LimitingFactor =
  | { kind: "species"; speciesId: SpeciesId; zone: GasZone | null }
  | { kind: "condition"; code: LimitConditionCode; zone: GasZone | null };

export interface RoomState {
  id: RoomId;
  gas: GasLayers;
  gasTemperature: GasTemperatures;
  liquid: LiquidAmounts;
  stationary: StationaryAmounts;
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

export interface GasConduitState {
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

export type DamageLedger = Record<DamageSourceId, HazardChannels>;

export interface DamageReceipt {
  sourceId: DamageSourceId;
  channels: HazardChannels;
  amount: number;
  elapsed: number;
}

export interface WaveEntry {
  at: number;
  type: EnemyType;
  routeId: EnemyRouteId;
  /** Added to the site's authored base level; positive values create veterans. */
  levelOffset: number;
}
