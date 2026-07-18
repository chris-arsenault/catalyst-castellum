import type { GameDefinition } from "../definitionTypes";
import type { EnemyState } from "../types";
import { enemyBehaviorDurabilityScale } from "./enemyLevel";

export interface EnemyBehaviorStateIssue {
  path: string;
  message: string;
}

const nearlyEqual = (left: number, right: number): boolean =>
  Math.abs(left - right) <= Math.max(1e-6, Math.abs(right) * 1e-6);

const validateMoltState = (
  enemy: EnemyState,
  definition: GameDefinition,
  path: string
): EnemyBehaviorStateIssue[] => {
  const authored = definition.enemies[enemy.type].behavior;
  const runtime = enemy.behavior;
  if (runtime.kind !== "armored_molt" || authored.kind !== "armored_molt") return [];
  const expected =
    (definition.enemies[enemy.type].health - authored.shellHealth) *
    enemyBehaviorDurabilityScale(enemy.level);
  const phaseMatchesHealth =
    runtime.phase === "armored"
      ? enemy.health > runtime.transitionHealth + 0.001
      : enemy.health <= runtime.transitionHealth + 0.001;
  const issues: EnemyBehaviorStateIssue[] = [];
  if (!nearlyEqual(runtime.transitionHealth, expected)) {
    issues.push({
      path: `${path}.transitionHealth`,
      message: "Molt threshold must match the leveled definition.",
    });
  }
  if (!phaseMatchesHealth) {
    issues.push({ path: `${path}.phase`, message: "Molt phase must match current health." });
  }
  return issues;
};

const validateFieldState = (
  enemy: EnemyState,
  definition: GameDefinition,
  path: string
): EnemyBehaviorStateIssue[] => {
  const authored = definition.enemies[enemy.type].behavior;
  const runtime = enemy.behavior;
  if (runtime.kind !== "shared_field" || authored.kind !== "shared_field") return [];
  const expected = authored.capacity * enemyBehaviorDurabilityScale(enemy.level);
  if (nearlyEqual(runtime.maximumCharge, expected) && runtime.charge <= runtime.maximumCharge) {
    return [];
  }
  return [{ path, message: "Field charge must remain within its leveled capacity." }];
};

const validateEmitterState = (
  enemy: EnemyState,
  definition: GameDefinition,
  path: string
): EnemyBehaviorStateIssue[] => {
  const authored = definition.enemies[enemy.type].behavior;
  const runtime = enemy.behavior;
  if (runtime.kind !== "gas_emitter" || authored.kind !== "gas_emitter") return [];
  if (
    nearlyEqual(runtime.initialReservoir, authored.reservoir) &&
    runtime.reservoir <= runtime.initialReservoir
  ) {
    return [];
  }
  return [{ path, message: "Emitter inventory must remain within its authored reservoir." }];
};

export const validateEnemyBehaviorState = (
  enemy: EnemyState,
  definition: GameDefinition,
  path: string
): EnemyBehaviorStateIssue[] => {
  if (definition.enemies[enemy.type].behavior.kind !== enemy.behavior.kind) {
    return [{ path, message: "Enemy behavior state must match its definition." }];
  }
  return [
    ...validateMoltState(enemy, definition, path),
    ...validateFieldState(enemy, definition, path),
    ...validateEmitterState(enemy, definition, path),
  ];
};
