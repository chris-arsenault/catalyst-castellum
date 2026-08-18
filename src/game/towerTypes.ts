import type { HazardChannels } from "./gameStateTypes";
import {
  CONTROL_EFFECT_KINDS,
  TOWER_ATTACK_STRATEGIES,
  TOWER_CHASSIS_IDS,
  TOWER_MOUNT_FACES,
  TOWER_ORIENTATIONS,
  TOWER_TARGET_POLICIES,
  TOWER_UPGRADE_IDS,
} from "./identifiers";
import type {
  DamageSourceId,
  EnemyType,
  GasType,
  GridCell,
  LiquidType,
  SpeciesId,
  WorldPoint,
} from "./types";

export type TowerChassisId = (typeof TOWER_CHASSIS_IDS)[number];
export type TowerUpgradeId = (typeof TOWER_UPGRADE_IDS)[number];
export type TowerAttackStrategy = (typeof TOWER_ATTACK_STRATEGIES)[number];
export type TowerTargetPolicy = (typeof TOWER_TARGET_POLICIES)[number];
export type TowerMountFace = (typeof TOWER_MOUNT_FACES)[number];
export type TowerOrientation = (typeof TOWER_ORIENTATIONS)[number];
export type ControlEffectKind = (typeof CONTROL_EFFECT_KINDS)[number];
/** Opaque durable tower identity; alias retained for instance-keyed signatures. */
// eslint-disable-next-line sonarjs/redundant-type-aliases
export type TowerInstanceId = string;

export interface TowerFootprint {
  width: number;
  height: number;
}

export interface TowerPlacement {
  anchor: GridCell;
  mountFace: TowerMountFace;
  orientation: TowerOrientation;
  occupiedCells: readonly GridCell[];
  supportCells: readonly GridCell[];
  firingOrigin: WorldPoint;
}

export interface TowerDamagePacketDefinition {
  sourceId: DamageSourceId;
  channels: HazardChannels;
}

export interface TowerControlEffectDefinition {
  kind: ControlEffectKind;
  magnitude: number;
  duration: number;
  stacking: "strongest" | "additive";
  refresh: "replace" | "extend";
  floor: number;
}

export interface TowerSupplyRequirement {
  port: "gas" | "liquid";
  acceptedSpecies: readonly SpeciesId[];
  rate: number;
  localCapacity: number;
  insufficientFlow: "pause" | "reduced_cadence" | "direct_mode";
}

export interface TowerAttackDefinition {
  strategy: TowerAttackStrategy;
  projectileSpeed: number;
  radius: number;
  packets: readonly TowerDamagePacketDefinition[];
  controlEffects: readonly TowerControlEffectDefinition[];
}

export interface TowerUpgradeDefinition {
  id: TowerUpgradeId;
  cost: number;
  requires: readonly TowerUpgradeId[];
  damageMultiplier: number;
  cadenceMultiplier: number;
  rangeDelta: number;
  targetCapDelta: number;
  arcDelta: number;
  supplyMode: "unchanged" | "enabled";
}

export interface TowerDefinition {
  id: TowerChassisId;
  role: "single_target" | "rapid_service" | "area" | "control" | "upper" | "support";
  buildCost: number;
  recoveryRatio: number;
  footprint: TowerFootprint;
  mountFaces: readonly TowerMountFace[];
  orientations: readonly TowerOrientation[];
  range: number;
  minimumRange: number;
  firingArc: number;
  lineOfSight: "required" | "lobbed" | "fixed_projection";
  cadence: number;
  targetCap: number;
  eligibleLayers: readonly ("ground" | "flying")[];
  targetPolicies: readonly TowerTargetPolicy[];
  attack: TowerAttackDefinition;
  upgrades: readonly TowerUpgradeDefinition[];
  supply: TowerSupplyRequirement | null;
  color: string;
}

export interface TowerLocalResources {
  gas: Partial<Record<GasType, number>>;
  liquid: Partial<Record<LiquidType, number>>;
}

export interface TowerDowntimeTelemetry {
  noTarget: number;
  cooldown: number;
  supply: number;
}

export interface TowerCombatTelemetry {
  engagedSeconds: number;
  targetsServiced: number;
  overkillDamage: number;
  controlApplications: number;
  downtime: TowerDowntimeTelemetry;
}

export interface TowerInstance {
  id: TowerInstanceId;
  chassisId: TowerChassisId;
  placement: TowerPlacement;
  provenance: "site" | "hull";
  upgrades: TowerUpgradeId[];
  targetPolicy: TowerTargetPolicy;
  cooldown: number;
  localResources: TowerLocalResources;
  currentTargetIds: number[];
  damageDealt: number;
  kills: number;
  shots: number;
  totalMatterSpent: number;
  downtimeReason: "none" | "no_target" | "cooldown" | "supply";
  telemetry: TowerCombatTelemetry;
}

export interface TowerRoundReport {
  chassisId: TowerChassisId;
  damageDealt: number;
  kills: number;
  shots: number;
  overkillDamage: number;
  engagedSeconds: number;
  targetsServiced: number;
  controlApplications: number;
  matterInvested: number;
  downtime: TowerDowntimeTelemetry;
}

export interface EnemyControlEffect {
  sourceTowerId: TowerInstanceId;
  kind: ControlEffectKind;
  magnitude: number;
  remaining: number;
  stacking: "strongest" | "additive";
  floor: number;
}

export interface TowerAttackEvent {
  id: number;
  towerId: TowerInstanceId;
  strategy: TowerAttackStrategy;
  source: WorldPoint;
  target: WorldPoint;
  targetEnemyIds: number[];
  startedAt: number;
  expiresAt: number;
  damage: number;
  killedEnemyIds: number[];
}

export interface EnvironmentalField {
  id: string;
  sourceId: string;
  effect: "visibility" | "cadence" | "movement" | "damage" | "reveal";
  roomId: string;
  zone: "lower" | "upper" | "both";
  intensity: number;
  remaining: number;
  decayPerSecond: number;
  stacking: "strongest" | "additive";
  species: SpeciesId | null;
}

export interface TowerSupplyStatus {
  towerId: TowerInstanceId;
  destinationRoomId: string;
  connectionIds: string[];
  availableRate: number;
  demandedRate: number;
  storedAmount: number;
  capacity: number;
  limitingSpecies: SpeciesId | null;
  mode: "assisted" | "direct" | "reduced" | "paused";
  modifier: number;
}

export interface TowerThreatProfile {
  enemyTypes: readonly EnemyType[];
}
