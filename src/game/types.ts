import type { HazardChannels } from "./gameStateTypes";
import type { RoomEquipment } from "./facilityTypes";

export * from "./gameStateTypes";
export * from "./facilityTypes";

export const GAS_TYPES = [
  "oxygen",
  "nitrogen",
  "carbon_dioxide",
  "chlorine",
  "hydrogen",
  "hydrogen_chloride",
  "steam",
] as const;

export const GAS_ZONES = ["lower", "upper"] as const;

export const LIQUID_TYPES = [
  "water",
  "sodium_chloride",
  "sodium_hydroxide",
  "sodium_hypochlorite",
  "hydrochloric_acid",
] as const;

export const ENEMY_TYPES = ["crawler", "skimmer", "floater", "shell", "bellows"] as const;
export const ENEMY_ROUTE_IDS = ["entry_to_core"] as const;

export const GAS_SOURCE_IDS = ["starter_gas_header"] as const;
export const LIQUID_SOURCE_IDS = ["water_tank", "sodium_chloride_tank"] as const;
export const GAS_BUFFER_IDS = ["anode_header", "cathode_header"] as const;
export const LIQUID_BUFFER_IDS = ["cell_liquor"] as const;

export const TRANSPORT_RUN_IDS = [
  "core_furnace",
  "cell_furnace",
  "core_cell",
  "cell_absorber",
  "furnace_return",
  "return_final",
  "return_outer",
  "core_final",
  "absorber_final",
  "core_absorber",
] as const;

export const EQUIPMENT_IDS = [
  "gas_agitator",
  "wet_contactor",
  "thermal_coil",
  "membrane_cell",
] as const;

export const EQUIPMENT_SOCKET_IDS = ["socket_a", "socket_b"] as const;

export const PROCESS_IDS = ["chlor_alkali_cell"] as const;

export const DAMAGE_SOURCE_IDS = [
  "atmospheric_exposure",
  "surface_corrosion",
  "thermal_exposure",
  "catastrophic_overpressure",
  "radiation_field",
  "hydrogen_oxygen_combustion",
  "legacy_unattributed",
] as const;

export const REACTION_IDS = [
  "chlor_alkali_electrolysis",
  "hydrogen_oxygen_combustion",
  "hydrogen_chlorine_recombination",
  "hydrogen_chloride_absorption",
  "acid_neutralization",
  "hypochlorite_formation",
  "acid_chlorine_release",
] as const;

export const LEVEL_IDS = [
  "flash_point",
  "make_the_reagent",
  "acid_line",
  "stored_chlorine",
  "commissioning_exam",
] as const;

export const ROOM_REACTION_IDS = [
  "hydrogen_oxygen_combustion",
  "hydrogen_chlorine_recombination",
  "hydrogen_chloride_absorption",
  "acid_neutralization",
  "hypochlorite_formation",
  "acid_chlorine_release",
] as const;

export type GasType = (typeof GAS_TYPES)[number];
export type GasZone = (typeof GAS_ZONES)[number];
export type LiquidType = (typeof LIQUID_TYPES)[number];
export type SpeciesId = GasType | LiquidType;
export type EnemyType = (typeof ENEMY_TYPES)[number];
export type EnemyRouteId = (typeof ENEMY_ROUTE_IDS)[number];
export type GasSourceId = (typeof GAS_SOURCE_IDS)[number];
export type LiquidSourceId = (typeof LIQUID_SOURCE_IDS)[number];
export type GasBufferId = (typeof GAS_BUFFER_IDS)[number];
export type LiquidBufferId = (typeof LIQUID_BUFFER_IDS)[number];
export type TransportRunId = (typeof TRANSPORT_RUN_IDS)[number];
export type EquipmentId = (typeof EQUIPMENT_IDS)[number];
export type EquipmentSocketId = (typeof EQUIPMENT_SOCKET_IDS)[number];
export type EquipmentLevel = 1 | 2 | 3;
export type TransportPhase = "gas" | "liquid";
export type ProcessId = (typeof PROCESS_IDS)[number];
export type ReactionId = (typeof REACTION_IDS)[number];
export type RoomReactionId = (typeof ROOM_REACTION_IDS)[number];
export type LevelId = (typeof LEVEL_IDS)[number];
export type DamageSourceId = (typeof DAMAGE_SOURCE_IDS)[number];

export type GasAmounts = Record<GasType, number>;
export type GasLayers = Record<GasZone, GasAmounts>;
export type GasTemperatures = Record<GasZone, number>;
export type LiquidAmounts = Record<LiquidType, number>;
export type ElementalComposition = Record<string, number>;

export type RoomId =
  | "west_intake"
  | "lower_intake"
  | "switchyard"
  | "furnace"
  | "reservoir"
  | "gallery"
  | "washlock"
  | "core";

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
  name: string;
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
  name: string;
  formula: string;
  capacity: number;
  initialGas: Partial<GasAmounts>;
  chargeGas: Partial<GasAmounts>;
  chargeCost: number;
  hostRoomId: RoomId;
  accent: string;
}

export interface GasBufferDefinition {
  id: GasBufferId;
  name: string;
  capacity: number;
  hostRoomId: RoomId;
  accent: string;
}

export interface LiquidBufferDefinition {
  id: LiquidBufferId;
  name: string;
  capacity: number;
  hostRoomId: RoomId;
  accent: string;
}

export interface ProcessDefinition {
  id: ProcessId;
  name: string;
  description: string;
  reactionId: ReactionId;
  equipmentId: EquipmentId;
  accent: string;
}

export interface SpeciesDefinition {
  id: SpeciesId;
  name: string;
  formula: string;
  phase: "gas" | "liquid";
  elements: ElementalComposition;
  molarMass: number;
  referenceDensity: number;
  color: string;
}

export interface ReactionParticipant {
  species: SpeciesId;
  coefficient: number;
}

export interface ReactionDefinition {
  id: ReactionId;
  code: string;
  name: string;
  kind: "chemical" | "physical";
  equation: string;
  reactants: ReactionParticipant[];
  products: ReactionParticipant[];
}

export interface ReactionTelemetry {
  lastRate: number;
  limitingReactant: string;
}

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

export type FlowCause =
  | "idle"
  | "priming"
  | "pressure"
  | "buoyancy"
  | "fan"
  | "gravity"
  | "siphon"
  | "pump"
  | "backpressure";

export interface ProcessState {
  setting: number;
  lastRate: number;
  totalProcessed: number;
  limitingReactant: string;
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
  name: string;
  description: string;
  health: number;
  speed: number;
  coreDamage: number;
  needsOxygen: boolean;
  flying: boolean;
  hazardMultipliers: HazardChannels;
  color: string;
  residueOnDeath: number;
  matterYield: number;
}

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

export type EnemyLocomotionMode = "walking" | "climbing" | "falling" | "door" | "flying";

export interface EnemyPathStep {
  cell: GridCell;
  mode: EnemyLocomotionMode;
  portalId: string | null;
}

export interface WaveEntry {
  at: number;
  type: EnemyType;
  routeId: EnemyRouteId;
}
