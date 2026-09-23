import { resolveTowerPlacement, towerPlacementIssue } from "../engine/towerPlacement";
import { worldCatalogsForMap } from "../world/catalogs";
import { architecturalConnections } from "../world/map";
import { validateWorldMap } from "../world/mapValidation";
import { encounterTopologyHasRoutes } from "./portals";
import type { EncounterContext, EncounterState, EncounterTower } from "./types";

const sameIds = (left: readonly string[], right: readonly string[]): boolean =>
  left.length === right.length && left.every((id, index) => id === right[index]);

const validateMapCatalogs = (state: EncounterState, issues: string[]): void => {
  if (!state.map.rooms.core) issues.push("Map requires its Core room");
  const world = worldCatalogsForMap(state.map);
  if (
    !sameIds(world.rooms, state.world.rooms) ||
    !sameIds(world.connections, state.world.connections)
  )
    issues.push("World catalog differs from the map's ordered identities");
  const portals = architecturalConnections(state.map)
    .map((portal) => portal.id)
    .sort();
  if (!sameIds(portals, Object.keys(state.portalStates).sort()))
    issues.push("Portal state identities differ from architectural connections");
};

const validateTowerGeometry = (
  state: EncounterState,
  tower: EncounterTower,
  context: EncounterContext,
  issues: string[]
): void => {
  if (!context.combat.towers[tower.chassisId]) return;
  const placement = tower.placement;
  const expected = resolveTowerPlacement(
    tower.chassisId,
    placement.anchor,
    placement.mountFace,
    placement.orientation,
    context.combat
  );
  const cells = (values: typeof placement.occupiedCells) =>
    values.map((cell) => `${cell.column}:${cell.elevation}`);
  if (
    !sameIds(cells(placement.occupiedCells), cells(expected.occupiedCells)) ||
    !sameIds(cells(placement.supportCells), cells(expected.supportCells)) ||
    Math.abs(placement.firingOrigin.x - expected.firingOrigin.x) > 1e-9 ||
    Math.abs(placement.firingOrigin.elevation - expected.firingOrigin.elevation) > 1e-9
  )
    issues.push(`towers.${tower.id}: placement cache differs from authored geometry`);
  const issue = towerPlacementIssue(state, tower.chassisId, expected, context.combat, tower.id);
  if (issue) issues.push(`towers.${tower.id}: ${issue}`);
};

const validateTowerPurchases = (
  tower: EncounterTower,
  context: EncounterContext,
  issues: string[]
): void => {
  const chassis = context.combat.towers[tower.chassisId];
  if (!chassis) return;
  if (!chassis.targetPolicies.includes(tower.targetPolicy))
    issues.push(`towers.${tower.id}: unavailable targeting policy`);
  if (new Set(tower.upgrades).size !== tower.upgrades.length)
    issues.push(`towers.${tower.id}: duplicate upgrade`);
  const upgrades = chassis.upgrades.filter((upgrade) => tower.upgrades.includes(upgrade.id));
  if (upgrades.some((upgrade) => upgrade.requires.some((id) => !tower.upgrades.includes(id))))
    issues.push(`towers.${tower.id}: missing upgrade prerequisite`);
  const spent = upgrades.reduce((total, upgrade) => total + upgrade.cost, chassis.buildCost);
  if (Math.abs(spent - tower.totalMatterSpent) > 1e-9)
    issues.push(`towers.${tower.id}: purchase value differs from installed chassis and upgrades`);
};

const validateEnemyPaths = (state: EncounterState, issues: string[]): void => {
  for (const enemy of state.enemies) {
    if (!state.map.routeGraph.routes[enemy.routeId])
      issues.push(`enemies.${enemy.id}: unknown route`);
    const end = enemy.path.at(-1)?.cell;
    if (
      !end ||
      end.column !== state.map.coreBreachCell.column ||
      end.elevation !== state.map.coreBreachCell.elevation
    )
      issues.push(`enemies.${enemy.id}: route does not end at Core`);
    const connected = enemy.path.every((step, index) => {
      const previous = enemy.path[index - 1];
      return (
        !previous ||
        Math.abs(previous.cell.column - step.cell.column) +
          Math.abs(previous.cell.elevation - step.cell.elevation) ===
          1
      );
    });
    if (!connected) issues.push(`enemies.${enemy.id}: disconnected path segment`);
  }
};

export const validateEncounterGeometry = (
  state: EncounterState,
  context: EncounterContext
): string[] => {
  const issues = validateWorldMap(state.map).map((issue) => `map.${issue.path}: ${issue.message}`);
  validateMapCatalogs(state, issues);
  for (const tower of Object.values(state.towers)) {
    validateTowerGeometry(state, tower, context, issues);
    validateTowerPurchases(tower, context, issues);
  }
  validateEnemyPaths(state, issues);
  if (
    !encounterTopologyHasRoutes(
      state,
      state.map,
      state.portalStates,
      context.combat,
      context.definition.wave.slice(state.spawnCursor)
    )
  )
    issues.push("Encounter routes do not reach Core");
  for (const field of state.environmentalFields)
    if (!state.map.rooms[field.roomId])
      issues.push(`environmentalFields.${field.id}: unknown room`);
  return issues;
};
