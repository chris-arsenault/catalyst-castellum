import type { DamageApplication, DamagePacket } from "../damageTypes";
import type {
  DamageSourceId,
  EnemyState,
  EnemyType,
  HazardChannels,
  TowerChassisId,
  WorldPoint,
} from "../types";
import type { EncounterContext, EncounterState, EncounterTower } from "./types";

export type FieldMode = "attract" | "repel";
export type CombatLayer = "ground" | "flying";

export interface CatalystRules {
  chargeCapacity: number;
  chargeDecayPerSecond: number;
  chargeDecayDelaySeconds: number;
  movementFloor: number;
  movementCeiling: number;
}

export interface InductionDeviceDefinition {
  kind: "weapon";
  chargePerHit: number;
  lobHeight?: number;
  projectileRadius?: number;
}

export interface FieldDeviceDefinition {
  kind: "field";
  radius: number;
  targetCap: number;
  strength: number;
  eligibleLayers: readonly CombatLayer[];
  activationSeconds: number;
  defaultMode: FieldMode;
}

export interface DischargeDeviceDefinition {
  kind: "discharge";
  radius: number;
  seedThreshold: number;
  secondaryThreshold: number;
  linkDistance: number;
  targetCap: number;
  consumeCap: number;
  damagePerCharge: number;
  cooldownSeconds: number;
  channel: keyof HazardChannels;
  sourceId: DamageSourceId;
  eligibleLayers: readonly CombatLayer[];
}

export type CatalystDeviceDefinition =
  InductionDeviceDefinition | FieldDeviceDefinition | DischargeDeviceDefinition;
export type CombatMechanics =
  | { kind: "legacy" }
  | {
      kind: "catalyst";
      rules: CatalystRules;
      devices: Readonly<Partial<Record<TowerChassisId, CatalystDeviceDefinition>>>;
      susceptibility: Readonly<Partial<Record<EnemyType, number>>>;
    };

/** Stable installation identity remains available after its source is removed. */
export interface CatalystSource {
  id: string;
  towerId: string;
  chassisId: TowerChassisId;
  provenance: EncounterTower["provenance"];
}

export interface EnemyChargeState {
  enemyId: number;
  amount: number;
  contributions: Record<string, number>;
  lastInputTick: number;
  lastDischargeTick: number;
}

export interface ChargeAccount {
  input: number;
  accepted: number;
  overflow: number;
  decay: number;
  consumed: number;
  death: number;
  breach: number;
  cleanup: number;
}

export type ChargeLossReason = "decay" | "consumed" | "death" | "breach" | "cleanup";
export type CatalystDeviceState =
  | {
      kind: "field";
      mode: FieldMode;
      activatesAt: number;
    }
  | {
      kind: "discharge";
      /** Simulation elapsed time preserves readiness across wave-local tick resets. */
      readyAt: number;
    };

export interface DischargeDamageAccount {
  raw: number;
  actual: number;
  mitigation: number;
  overkill: number;
  kills: number;
}

export interface CatalystPulseTarget {
  enemyId: number;
  position: WorldPoint;
  consumed: number;
  contributions: Record<string, number>;
  damage: number;
}

export interface CatalystPulse {
  id: number;
  sourceId: string;
  elapsed: number;
  origin: WorldPoint;
  targets: CatalystPulseTarget[];
}

export interface CatalystState {
  sources: Record<string, CatalystSource>;
  chargeByEnemy: Record<string, EnemyChargeState>;
  devices: Record<string, CatalystDeviceState>;
  accounting: ChargeAccount;
  accountingBySource: Record<string, ChargeAccount>;
  damageByDevice: Record<string, DischargeDamageAccount>;
  fieldByDevice: Record<string, { activeSeconds: number; servicedEnemySeconds: number }>;
  directBySource: Record<
    string,
    { damage: number; kills: number; shots: number; overkill: number }
  >;
  pulses: CatalystPulse[];
  nextPulseId: number;
}

export interface FrozenFieldInfluence {
  sourceId: string;
  towardProjector: WorldPoint;
  weightedStrength: number;
}

/** A tick-local sample; never serialized or recomputed after charge transactions. */
export interface CatalystFieldSample {
  byEnemy: Readonly<Record<string, readonly FrozenFieldInfluence[]>>;
  servicedByDevice: Readonly<Record<string, readonly number[]>>;
}

export interface FieldPreview {
  sourceId: string;
  mode: FieldMode;
  activationRemaining: number;
  targetCap: number;
  radius: number;
  servicedEnemyIds: readonly number[];
  arrows: { enemyId: number; origin: WorldPoint; tangent: WorldPoint; multiplier: number }[];
  routeArrows: FieldRouteArrow[];
}

/** Hypothetical response of one fully charged target before other player control. */
export interface FieldRouteArrow {
  origin: WorldPoint;
  tangent: WorldPoint;
  multiplier: number;
}

export interface CatalystReport {
  sources: Record<string, CatalystSource>;
  accounting: ChargeAccount;
  accountingBySource: Record<string, ChargeAccount>;
  directBySource: CatalystState["directBySource"];
  damageByDevice: CatalystState["damageByDevice"];
  fieldByDevice: CatalystState["fieldByDevice"];
  remainingCharge: number;
}

export interface DischargePreview {
  sourceId: string;
  waitingReason: "acquiring_charge" | "awaiting_target" | "recharging" | "ready";
  readyIn: number;
  seedEnemyId: number | null;
  chainEnemyIds: number[];
  blockedLinks: { fromEnemyId: number; toEnemyId: number }[];
  seedThreshold: number;
  secondaryThreshold: number;
  targetCap: number;
  radius: number;
}

/** The shared hit resolver owns shields, mitigation, death, rewards, and damage statistics. */
export type CommitDischargeDamage = (
  state: EncounterState,
  enemy: EnemyState,
  source: CatalystSource,
  packet: DamagePacket,
  context: EncounterContext
) => DamageApplication;
