import type { GamePackSource } from "../definitionTypes";
import { ENEMY_LOCOMOTION_MODES, type EnemyLocomotionMode } from "../types";

export interface EnemyAuthoringIssue {
  path: string;
  message: string;
}

const add = (issues: EnemyAuthoringIssue[], path: string, message: string): void => {
  issues.push({ path, message });
};

const positive = (
  value: number,
  path: string,
  label: string,
  issues: EnemyAuthoringIssue[]
): void => {
  if (!Number.isFinite(value) || value <= 0) add(issues, path, `${label} must be positive.`);
};

const validateLocomotion = (
  multipliers: Record<EnemyLocomotionMode, number>,
  path: string,
  issues: EnemyAuthoringIssue[]
): void => {
  for (const mode of ENEMY_LOCOMOTION_MODES) {
    positive(multipliers[mode], `${path}.${mode}`, "Locomotion multiplier", issues);
  }
};

const validateMolt = (
  enemy: GamePackSource["enemies"][keyof GamePackSource["enemies"]],
  path: string,
  issues: EnemyAuthoringIssue[]
): void => {
  if (enemy.behavior.kind !== "armored_molt") return;
  positive(enemy.behavior.shellHealth, `${path}.shellHealth`, "Shell health", issues);
  if (enemy.behavior.shellHealth >= enemy.health) {
    add(issues, `${path}.shellHealth`, "Shell health must be less than total health.");
  }
  positive(
    enemy.behavior.exposedSpeedMultiplier,
    `${path}.exposedSpeedMultiplier`,
    "Exposed speed multiplier",
    issues
  );
  validateLocomotion(
    enemy.behavior.exposedLocomotionMultipliers,
    `${path}.exposedLocomotionMultipliers`,
    issues
  );
};

const validateField = (
  enemy: GamePackSource["enemies"][keyof GamePackSource["enemies"]],
  path: string,
  issues: EnemyAuthoringIssue[]
): void => {
  if (enemy.behavior.kind !== "shared_field") return;
  positive(enemy.behavior.capacity, `${path}.capacity`, "Field capacity", issues);
  positive(enemy.behavior.rechargePerSecond, `${path}.rechargePerSecond`, "Field recharge", issues);
  if (enemy.behavior.activationFraction <= 0 || enemy.behavior.activationFraction > 1) {
    add(
      issues,
      `${path}.activationFraction`,
      "Field activation fraction must be greater than zero and at most one."
    );
  }
};

const validateEmitter = (
  source: GamePackSource,
  enemy: GamePackSource["enemies"][keyof GamePackSource["enemies"]],
  path: string,
  issues: EnemyAuthoringIssue[]
): void => {
  if (enemy.behavior.kind !== "gas_emitter") return;
  if (source.species[enemy.behavior.species]?.phase !== "gas") {
    add(issues, `${path}.species`, "Emitted species must identify an authored gas.");
  }
  positive(enemy.behavior.reservoir, `${path}.reservoir`, "Emitter reservoir", issues);
  positive(enemy.behavior.emissionRate, `${path}.emissionRate`, "Emission rate", issues);
};

export const validateEnemyDefinitions = (source: GamePackSource): EnemyAuthoringIssue[] => {
  const issues: EnemyAuthoringIssue[] = [];
  for (const [enemyType, enemy] of Object.entries(source.enemies)) {
    const path = `enemies.${enemyType}`;
    if (enemyType !== enemy.type)
      add(issues, `${path}.type`, "Enemy type must match its record key.");
    positive(enemy.health, `${path}.health`, "Enemy health", issues);
    positive(enemy.speed, `${path}.speed`, "Enemy speed", issues);
    if (!Number.isFinite(enemy.coreDamage) || enemy.coreDamage < 0) {
      add(issues, `${path}.coreDamage`, "Core damage must be nonnegative.");
    }
    const behaviorPath = `${path}.behavior`;
    if (enemy.behavior.kind === "ladder_runner") {
      validateLocomotion(
        enemy.behavior.locomotionMultipliers,
        `${behaviorPath}.locomotionMultipliers`,
        issues
      );
    }
    validateMolt(enemy, behaviorPath, issues);
    validateField(enemy, behaviorPath, issues);
    validateEmitter(source, enemy, behaviorPath, issues);
  }
  return issues;
};
