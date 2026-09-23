import { enemyWorldPosition } from "../engine/enemyPosition";
import { clamp } from "../engine/math";
import type { EnemyState, WorldPoint, TowerPlacement, TowerChassisId } from "../types";
import { enemyDefinition } from "./catalogs";
import { hasCombatLineOfSight } from "./projectiles";
import type {
  CatalystFieldSample,
  CatalystRules,
  FieldDeviceDefinition,
  FieldPreview,
  FrozenFieldInfluence,
  FieldMode,
  FieldRouteArrow,
} from "./catalystTypes";
import type { EncounterContext, EncounterState, EncounterTower } from "./types";

const distance = (left: WorldPoint, right: WorldPoint): number =>
  Math.hypot(right.x - left.x, right.elevation - left.elevation);

const fieldTargets = (
  state: EncounterState,
  tower: EncounterTower,
  field: FieldDeviceDefinition,
  context: EncounterContext
): EnemyState[] =>
  state.enemies
    .filter((enemy) => {
      if (enemy.health <= 0 || (state.catalyst?.chargeByEnemy[String(enemy.id)]?.amount ?? 0) <= 0)
        return false;
      const layer = enemyDefinition(context.combat, enemy.type).flying ? "flying" : "ground";
      const position = enemyWorldPosition(enemy);
      return (
        field.eligibleLayers.includes(layer) &&
        distance(position, tower.placement.firingOrigin) <= field.radius &&
        hasCombatLineOfSight(state.map, tower.placement.firingOrigin, position)
      );
    })
    .sort((left, right) => {
      const charge =
        state.catalyst!.chargeByEnemy[String(right.id)]!.amount -
        state.catalyst!.chargeByEnemy[String(left.id)]!.amount;
      const range =
        distance(enemyWorldPosition(left), tower.placement.firingOrigin) -
        distance(enemyWorldPosition(right), tower.placement.firingOrigin);
      return charge || range || left.id - right.id;
    })
    .slice(0, field.targetCap);

const freezeInfluence = (
  state: EncounterState,
  tower: EncounterTower,
  enemy: EnemyState,
  field: FieldDeviceDefinition,
  sign: number,
  capacity: number
): FrozenFieldInfluence => {
  const position = enemyWorldPosition(enemy);
  const origin = tower.placement.firingOrigin;
  const length = distance(position, origin);
  const charge = state.catalyst!.chargeByEnemy[String(enemy.id)]!.amount;
  return {
    sourceId: tower.id,
    towardProjector:
      length > 0
        ? {
            x: (origin.x - position.x) / length,
            elevation: (origin.elevation - position.elevation) / length,
          }
        : { x: 0, elevation: 0 },
    weightedStrength:
      sign * field.strength * (charge / capacity) * Math.max(0, 1 - length / field.radius),
  };
};

export const sampleCatalystFields = (
  state: EncounterState,
  context: EncounterContext
): CatalystFieldSample => {
  const byEnemy: Record<string, FrozenFieldInfluence[]> = {};
  const servicedByDevice: Record<string, number[]> = {};
  const mechanics = context.combat.mechanics;
  if (!state.catalyst || mechanics.kind !== "catalyst") return { byEnemy, servicedByDevice };
  for (const tower of Object.values(state.towers).sort((left, right) =>
    left.id.localeCompare(right.id)
  )) {
    const active = activeField(state, tower, context);
    if (!active) continue;
    const { field, device } = active;
    const targets = fieldTargets(state, tower, field, context);
    servicedByDevice[tower.id] = targets.map((enemy) => enemy.id);
    for (const enemy of targets) {
      const influence = freezeInfluence(
        state,
        tower,
        enemy,
        field,
        device.mode === "attract" ? 1 : -1,
        mechanics.rules.chargeCapacity
      );
      byEnemy[String(enemy.id)] ??= [];
      byEnemy[String(enemy.id)]!.push(influence);
    }
  }
  return { byEnemy, servicedByDevice };
};

const activeField = (state: EncounterState, tower: EncounterTower, context: EncounterContext) => {
  const mechanics = context.combat.mechanics;
  if (!state.catalyst || mechanics.kind !== "catalyst") return null;
  const field = mechanics.devices[tower.chassisId];
  const device = state.catalyst.devices[tower.id];
  if (
    field?.kind !== "field" ||
    device?.kind !== "field" ||
    device.activatesAt > state.elapsed + 1e-9
  )
    return null;
  return { field, device };
};

/** Record the committed assault sample once; presentation queries never call this recorder. */
export const recordCatalystFieldService = (
  state: EncounterState,
  sample: CatalystFieldSample,
  dt: number
): void => {
  if (!state.catalyst) return;
  for (const [sourceId, ids] of Object.entries(sample.servicedByDevice)) {
    const account = (state.catalyst.fieldByDevice[sourceId] ??= {
      activeSeconds: 0,
      servicedEnemySeconds: 0,
    });
    account.activeSeconds += dt;
    account.servicedEnemySeconds += ids.length * dt;
  }
};

export const projectCatalystMovement = (
  sample: CatalystFieldSample,
  enemyId: number,
  from: WorldPoint,
  to: WorldPoint,
  playerMultiplier: number,
  rules: CatalystRules
): number => {
  const length = distance(from, to);
  const tangent =
    length > 0
      ? { x: (to.x - from.x) / length, elevation: (to.elevation - from.elevation) / length }
      : { x: 0, elevation: 0 };
  const field = (sample.byEnemy[String(enemyId)] ?? []).reduce(
    (total, input) =>
      total +
      input.weightedStrength *
        (input.towardProjector.x * tangent.x + input.towardProjector.elevation * tangent.elevation),
    0
  );
  return clamp(playerMultiplier + field, rules.movementFloor, rules.movementCeiling);
};

const previewArrows = (
  state: EncounterState,
  ids: readonly number[],
  sample: CatalystFieldSample,
  rules: CatalystRules
): FieldPreview["arrows"] =>
  state.enemies
    .filter((enemy) => ids.includes(enemy.id))
    .flatMap((enemy) => {
      const from = enemy.path[enemy.pathIndex]?.cell;
      const to = enemy.path[enemy.pathIndex + 1]?.cell;
      if (!from || !to) return [];
      const length = Math.hypot(to.column - from.column, to.elevation - from.elevation);
      return [
        {
          enemyId: enemy.id,
          origin: enemyWorldPosition(enemy),
          tangent: {
            x: (to.column - from.column) / length,
            elevation: (to.elevation - from.elevation) / length,
          },
          multiplier: projectCatalystMovement(
            sample,
            enemy.id,
            { x: from.column, elevation: from.elevation },
            { x: to.column, elevation: to.elevation },
            1,
            rules
          ),
        },
      ];
    });

export const previewCatalystField = (
  state: EncounterState,
  towerId: string,
  context: EncounterContext
): FieldPreview | null => {
  const tower = state.towers[towerId];
  const mechanics = context.combat.mechanics;
  if (!tower || !state.catalyst || mechanics.kind !== "catalyst") return null;
  const field = mechanics.devices[tower.chassisId];
  const device = state.catalyst.devices[towerId];
  if (field?.kind !== "field" || device?.kind !== "field") return null;
  const sample = sampleCatalystFields(state, context);
  const ids = sample.servicedByDevice[towerId] ?? [];
  return {
    sourceId: towerId,
    mode: device.mode,
    activationRemaining: Math.max(0, device.activatesAt - state.elapsed),
    targetCap: field.targetCap,
    radius: field.radius,
    servicedEnemyIds: ids,
    arrows: previewArrows(state, ids, sample, mechanics.rules),
    routeArrows: previewCatalystPlacement(
      state,
      tower.placement,
      device.mode,
      tower.chassisId,
      context
    ),
  };
};

export const previewCatalystPlacement = (
  state: Pick<EncounterState, "map">,
  placement: TowerPlacement,
  mode: FieldMode,
  chassisId: TowerChassisId,
  context: EncounterContext
): FieldRouteArrow[] => {
  const mechanics = context.combat.mechanics;
  if (mechanics.kind !== "catalyst") return [];
  const field = mechanics.devices[chassisId];
  if (field?.kind !== "field") return [];
  const seen = new Set<string>();
  return Object.values(state.map.routeGraph.edges).flatMap((edge) => {
    if (edge.eligibility !== "all" && !field.eligibleLayers.includes(edge.eligibility)) return [];
    return edge.cells.slice(1).flatMap((to, index) => {
      const from = edge.cells[index]!;
      const key = `${from.column}:${from.elevation}:${to.column}:${to.elevation}`;
      if (seen.has(key)) return [];
      seen.add(key);
      return previewRouteSegment(
        state,
        placement,
        mode,
        field,
        mechanics.rules,
        { x: from.column + 0.5, elevation: from.elevation + 0.5 },
        { x: to.column + 0.5, elevation: to.elevation + 0.5 }
      );
    });
  });
};

const previewRouteSegment = (
  state: Pick<EncounterState, "map">,
  placement: TowerPlacement,
  mode: FieldMode,
  field: FieldDeviceDefinition,
  rules: CatalystRules,
  from: WorldPoint,
  to: WorldPoint
): FieldRouteArrow[] => {
  const origin = { x: (from.x + to.x) / 2, elevation: (from.elevation + to.elevation) / 2 };
  const length = distance(origin, placement.firingOrigin);
  if (length > field.radius || !hasCombatLineOfSight(state.map, origin, placement.firingOrigin))
    return [];
  const routeLength = distance(from, to);
  if (routeLength <= 0) return [];
  const tangent = {
    x: (to.x - from.x) / routeLength,
    elevation: (to.elevation - from.elevation) / routeLength,
  };
  const dot =
    length > 0
      ? ((placement.firingOrigin.x - origin.x) * tangent.x +
          (placement.firingOrigin.elevation - origin.elevation) * tangent.elevation) /
        length
      : 0;
  const effect =
    dot * field.strength * Math.max(0, 1 - length / field.radius) * (mode === "attract" ? 1 : -1);
  return [
    { origin, tangent, multiplier: clamp(1 + effect, rules.movementFloor, rules.movementCeiling) },
  ];
};
