import type { GameDefinition } from "../definitionTypes";
import { LOCOMOTION_SPEED } from "../engine/enemyMovementRules";
import { ENEMY_TYPES, type EnemyType } from "../types";

export type EnemyBehaviorBalanceProfile =
  | { enemyType: EnemyType; kind: "standard" }
  | {
      enemyType: EnemyType;
      kind: "ladder_runner";
      walkingRate: number;
      climbingRate: number;
      authoredWalkingMultiplier: number;
      authoredClimbingMultiplier: number;
    }
  | {
      enemyType: EnemyType;
      kind: "armored_molt";
      totalHealth: number;
      shellHealth: number;
      exposedHealth: number;
      shellFraction: number;
      exposedSpeed: number;
    }
  | {
      enemyType: EnemyType;
      kind: "shared_field";
      capacity: number;
      rechargePerSecond: number;
      fullRechargeSeconds: number;
      activationCharge: number;
      deckmouthHealthEquivalents: number;
    }
  | {
      enemyType: EnemyType;
      kind: "gas_emitter";
      species: string;
      reservoir: number;
      emissionRate: number;
      dischargeSeconds: number;
      ignitionChargeCount: number;
    };

export const enemyBehaviorProfiles = (definition: GameDefinition): EnemyBehaviorBalanceProfile[] =>
  ENEMY_TYPES.map((enemyType) => {
    const enemy = definition.enemies[enemyType];
    const behavior = enemy.behavior;
    switch (behavior.kind) {
      case "standard":
        return { enemyType, kind: "standard" };
      case "ladder_runner":
        return {
          enemyType,
          kind: "ladder_runner",
          walkingRate: LOCOMOTION_SPEED.walking * behavior.locomotionMultipliers.walking,
          climbingRate: LOCOMOTION_SPEED.climbing * behavior.locomotionMultipliers.climbing,
          authoredWalkingMultiplier: behavior.locomotionMultipliers.walking,
          authoredClimbingMultiplier: behavior.locomotionMultipliers.climbing,
        };
      case "armored_molt":
        return {
          enemyType,
          kind: "armored_molt",
          totalHealth: enemy.health,
          shellHealth: behavior.shellHealth,
          exposedHealth: enemy.health - behavior.shellHealth,
          shellFraction: behavior.shellHealth / enemy.health,
          exposedSpeed: enemy.speed * behavior.exposedSpeedMultiplier,
        };
      case "shared_field":
        return {
          enemyType,
          kind: "shared_field",
          capacity: behavior.capacity,
          rechargePerSecond: behavior.rechargePerSecond,
          fullRechargeSeconds: behavior.capacity / behavior.rechargePerSecond,
          activationCharge: behavior.capacity * behavior.activationFraction,
          deckmouthHealthEquivalents: behavior.capacity / definition.enemies.deckmouth.health,
        };
      case "gas_emitter": {
        const ignition = definition.reactions.hydrogen_oxygen_combustion.behavior;
        const hydrogenPerIgnition =
          ignition.kind === "flash" ? ignition.ignitionExtent * 2 : Infinity;
        return {
          enemyType,
          kind: "gas_emitter",
          species: behavior.species,
          reservoir: behavior.reservoir,
          emissionRate: behavior.emissionRate,
          dischargeSeconds: behavior.reservoir / behavior.emissionRate,
          ignitionChargeCount: behavior.reservoir / hydrogenPerIgnition,
        };
      }
    }
  });
