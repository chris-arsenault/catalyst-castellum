import { facilityModelForMap } from "../world/derivedModel";
import type { GameDefinition } from "../definitionTypes";
import type { EnemyDefinition, EnemyPathStep, EnemyState, GameState, GridCell } from "../types";
import { enemyPathTransitionIsLegal } from "./navigation";
import type { StateValidationIssue } from "./stateValidation";

const navigationIssue = (
  issues: StateValidationIssue[],
  path: string,
  message: string,
  code: StateValidationIssue["code"] = "enemy_navigation_invalid"
): void => {
  issues.push({ code, path, message });
};

const sameCell = (left: GridCell | undefined, right: GridCell | undefined): boolean =>
  Boolean(left && right && left.column === right.column && left.elevation === right.elevation);

const adjacent = (left: GridCell, right: GridCell): boolean =>
  Math.abs(left.column - right.column) + Math.abs(left.elevation - right.elevation) === 1;

const validatePathStep = (
  step: EnemyPathStep,
  previous: EnemyPathStep | undefined,
  stepPath: string,
  enemyDefinition: EnemyDefinition,
  definition: GameDefinition,
  issues: StateValidationIssue[]
): void => {
  if (!facilityModelForMap(definition.map).inBounds(step.cell)) {
    navigationIssue(issues, `${stepPath}.cell`, "Enemy path leaves the facility bounds.");
    return;
  }
  const cell = facilityModelForMap(definition.map).cellDefinition(step.cell);
  if (["solid", "platform", "core_shell"].includes(cell.terrain))
    navigationIssue(issues, `${stepPath}.cell`, "Enemy path occupies non-navigable terrain.");
  if (step.portalId !== cell.portalId)
    navigationIssue(issues, `${stepPath}.portalId`, "Enemy path portal identity is inconsistent.");
  if (previous && !adjacent(previous.cell, step.cell)) {
    navigationIssue(issues, stepPath, "Enemy path contains a non-adjacent step.");
    return;
  }
  if (
    previous &&
    !enemyPathTransitionIsLegal({ flying: enemyDefinition.flying, previous, step }, definition.map)
  )
    navigationIssue(issues, stepPath, "Enemy path violates locomotion rules.");
};

const validateEnemyPath = (
  enemy: EnemyState,
  enemyIndex: number,
  enemyDefinition: EnemyDefinition,
  definition: GameDefinition,
  issues: StateValidationIssue[]
): void => {
  const path = `enemies.${enemyIndex}.path`;
  if (enemy.pathIndex >= enemy.path.length)
    navigationIssue(issues, `${path}Index`, "Enemy path cursor is out of range.");
  for (const [stepIndex, step] of enemy.path.entries()) {
    validatePathStep(
      step,
      enemy.path[stepIndex - 1],
      `${path}.${stepIndex}`,
      enemyDefinition,
      definition,
      issues
    );
  }
  if (!sameCell(enemy.path.at(-1)?.cell, definition.map.coreBreachCell))
    navigationIssue(issues, path, "Enemy path does not reach the Core threshold.");
};

export const validateEnemyNavigation = (
  state: GameState,
  issues: StateValidationIssue[],
  definition: GameDefinition
): void => {
  for (const [enemyIndex, enemy] of state.enemies.entries()) {
    const enemyDefinition = definition.enemies[enemy.type];
    if (!enemyDefinition) {
      navigationIssue(
        issues,
        `enemies.${enemyIndex}.type`,
        "Enemy type is not authored.",
        "identity_mismatch"
      );
      continue;
    }
    validateEnemyPath(enemy, enemyIndex, enemyDefinition, definition, issues);
  }
};
