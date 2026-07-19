import type { HazardChannels } from "./gameStateTypes";
import { ENEMY_LOCOMOTION_MODES } from "./identifiers";
import type {
  DamageLedger,
  DamageReceipt,
  EnemyRouteId,
  EnemyType,
  GasType,
  GridCell,
} from "./types";

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
  behavior: EnemyBehaviorDefinition;
  presentation: {
    appearance: EnemyAppearanceArchetype;
  };
}

export type EnemyBehaviorDefinition =
  | { kind: "standard" }
  | {
      kind: "ladder_runner";
      locomotionMultipliers: Record<EnemyLocomotionMode, number>;
    }
  | {
      kind: "armored_molt";
      shellHealth: number;
      exposedSpeedMultiplier: number;
      exposedLocomotionMultipliers: Record<EnemyLocomotionMode, number>;
    }
  | {
      kind: "shared_field";
      capacity: number;
      rechargePerSecond: number;
      activationFraction: number;
    }
  | {
      kind: "gas_emitter";
      species: GasType;
      reservoir: number;
      emissionRate: number;
    };

export type EnemyAppearanceArchetype =
  | "deckmouth"
  | "flintjack"
  | "shear_jelly"
  | "splitback"
  | "redlung"
  | "clatter"
  | "anchor"
  | "glowbag";

export type EnemyBehaviorState =
  | { kind: "standard" }
  | { kind: "ladder_runner" }
  | {
      kind: "armored_molt";
      phase: "armored" | "exposed";
      transitionHealth: number;
    }
  | {
      kind: "shared_field";
      charge: number;
      maximumCharge: number;
      active: boolean;
    }
  | {
      kind: "gas_emitter";
      reservoir: number;
      initialReservoir: number;
    };

export interface EnemyState {
  id: number;
  type: EnemyType;
  level: number;
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
  behavior: EnemyBehaviorState;
}

export type EnemyLocomotionMode = (typeof ENEMY_LOCOMOTION_MODES)[number];

export interface EnemyPathStep {
  cell: GridCell;
  mode: EnemyLocomotionMode;
  portalId: string | null;
}
