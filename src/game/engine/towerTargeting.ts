import type { CombatDefinition, EncounterState, EncounterTower } from "../encounter/types";
import { enemyDefinition, towerDefinition } from "../encounter/catalogs";
type TargetingState = Pick<EncounterState, "map" | "enemies" | "environmentalFields">;
import type { EnemyState, TowerTargetPolicy, WorldPoint } from "../types";
import { facilityModelForMap } from "../world/derivedModel";
import { enemyRouteDistance } from "../world/routes";
import { enemyWorldPosition } from "./enemyPosition";
import { effectiveTowerStats } from "./towerStats";

const distance = (left: WorldPoint, right: WorldPoint): number =>
  Math.hypot(right.x - left.x, right.elevation - left.elevation);

const orientationVector = (orientation: EncounterTower["placement"]["orientation"]): WorldPoint => {
  if (orientation === "left") return { x: -1, elevation: 0 };
  if (orientation === "right") return { x: 1, elevation: 0 };
  if (orientation === "up") return { x: 0, elevation: 1 };
  return { x: 0, elevation: -1 };
};

const withinArc = (tower: EncounterTower, target: WorldPoint, firingArc: number): boolean => {
  if (firingArc >= 359) return true;
  const source = tower.placement.firingOrigin;
  const vector = orientationVector(tower.placement.orientation);
  const dx = target.x - source.x;
  const dy = target.elevation - source.elevation;
  const length = Math.hypot(dx, dy);
  if (length <= 0.001) return true;
  const dot = (dx * vector.x + dy * vector.elevation) / length;
  return dot >= Math.cos((firingArc * Math.PI) / 360);
};

const hasLineOfSight = (state: TargetingState, source: WorldPoint, target: WorldPoint): boolean => {
  const steps = Math.max(1, Math.ceil(distance(source, target) * 3));
  const model = facilityModelForMap(state.map);
  for (let index = 1; index < steps; index += 1) {
    const fraction = index / steps;
    const cell = {
      column: Math.floor(source.x + (target.x - source.x) * fraction),
      elevation: Math.floor(source.elevation + (target.elevation - source.elevation) * fraction),
    };
    const terrain = model.cellDefinition(cell).terrain;
    if (terrain === "solid" || terrain === "platform" || terrain === "core_shell") return false;
  }
  return true;
};

const targetEligible = (
  state: TargetingState,
  tower: EncounterTower,
  enemy: EnemyState,
  definition: Pick<CombatDefinition, "towers" | "enemies">
): boolean => {
  const layer = enemyDefinition(definition, enemy.type).flying ? "flying" : "ground";
  return towerCoversPoint(state, tower, enemyWorldPosition(enemy), layer, definition);
};

export const towerCoversPoint = (
  state: TargetingState,
  tower: EncounterTower,
  target: WorldPoint,
  layer: "ground" | "flying",
  definition: Pick<CombatDefinition, "towers" | "enemies">
): boolean => {
  const chassis = towerDefinition(definition, tower.chassisId);
  const stats = effectiveTowerStats(tower, definition, state);
  const range = distance(tower.placement.firingOrigin, target);
  if (range < stats.minimumRange || range > stats.range) return false;
  if (!withinArc(tower, target, stats.firingArc)) return false;
  if (!chassis.eligibleLayers.includes(layer)) return false;
  return (
    chassis.lineOfSight === "lobbed" || hasLineOfSight(state, tower.placement.firingOrigin, target)
  );
};

const supportRank = (enemy: EnemyState): number => {
  if (enemy.behavior.kind === "shared_field") return 2;
  if (enemy.behavior.kind === "gas_emitter") return 1;
  return 0;
};

const armoredRank = (enemy: EnemyState): number =>
  enemy.behavior.kind === "armored_molt" && enemy.behavior.phase === "armored" ? 1 : 0;

const flyingRank = (
  enemy: EnemyState,
  definition: Pick<CombatDefinition, "towers" | "enemies">
): number => (enemyDefinition(definition, enemy.type).flying ? 1 : 0);

const policyValue = (
  policy: TowerTargetPolicy,
  enemy: EnemyState,
  tower: EncounterTower,
  definition: Pick<CombatDefinition, "towers" | "enemies">
): number => {
  if (policy === "first") return -enemyRouteDistance(enemy).remaining;
  if (policy === "last") return enemyRouteDistance(enemy).remaining;
  if (policy === "nearest")
    return -distance(tower.placement.firingOrigin, enemyWorldPosition(enemy));
  if (policy === "strongest") return enemy.health;
  if (policy === "weakest") return -enemy.health;
  if (policy === "armored") return armoredRank(enemy) * 1_000_000 + enemy.health;
  if (policy === "flying")
    return flyingRank(enemy, definition) * 1_000_000 - enemyRouteDistance(enemy).remaining;
  return supportRank(enemy) * 1_000_000 - enemyRouteDistance(enemy).remaining;
};

export const acquireTowerTargets = (
  state: TargetingState,
  tower: EncounterTower,
  definition: Pick<CombatDefinition, "towers" | "enemies">
): EnemyState[] => {
  const cap = effectiveTowerStats(tower, definition, state).targetCap;
  return state.enemies
    .filter((enemy) => enemy.health > 0 && targetEligible(state, tower, enemy, definition))
    .sort((left, right) => {
      const order =
        policyValue(tower.targetPolicy, right, tower, definition) -
        policyValue(tower.targetPolicy, left, tower, definition);
      return order !== 0 ? order : left.id - right.id;
    })
    .slice(0, cap);
};

export const resolveTowerAttackTargets = (
  state: TargetingState,
  tower: EncounterTower,
  primary: readonly EnemyState[],
  definition: Pick<CombatDefinition, "towers" | "enemies">
): EnemyState[] => {
  const chassis = towerDefinition(definition, tower.chassisId);
  const first = primary[0];
  // Acquisition already applies the cone's arc, range, layers, and sight lines to each target.
  if (!first || chassis.attack.strategy === "cone" || chassis.attack.radius <= 0)
    return [...primary];
  const center = enemyWorldPosition(first);
  const cap = effectiveTowerStats(tower, definition, state).targetCap;
  const secondary = state.enemies
    .filter((enemy) => {
      if (enemy.id === first.id || enemy.health <= 0) return false;
      const layer = enemyDefinition(definition, enemy.type).flying ? "flying" : "ground";
      const position = enemyWorldPosition(enemy);
      return (
        chassis.eligibleLayers.includes(layer) &&
        distance(center, position) <= chassis.attack.radius &&
        hasLineOfSight(state, center, position)
      );
    })
    .sort((left, right) => left.id - right.id);
  return [first, ...secondary].slice(0, cap);
};
