import type { CombatDefinition } from "./types";
import type { EnemyType, TowerChassisId } from "../types";

export const towerDefinition = (
  definition: Pick<CombatDefinition, "towers">,
  id: TowerChassisId
) => {
  const tower = definition.towers[id];
  if (!tower) throw new Error(`Unknown encounter tower: ${id}`);
  return tower;
};

export const enemyDefinition = (definition: Pick<CombatDefinition, "enemies">, id: EnemyType) => {
  const enemy = definition.enemies[id];
  if (!enemy) throw new Error(`Unknown encounter enemy: ${id}`);
  return enemy;
};
