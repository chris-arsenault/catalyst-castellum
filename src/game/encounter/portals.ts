import { findEnemyPathBetween } from "../engine/navigation";
import type { CommandDecision, FacilityPortalState } from "../types";
import { isArchitectural, type WorldMap } from "../world/map";
import { routePathForEnemy } from "../world/routes";
import { enemyDefinition } from "./catalogs";
import type {
  CombatDefinition,
  EncounterCommand,
  EncounterContext,
  EncounterState,
  EncounterSpawn,
} from "./types";

type PortalCommand = Extract<EncounterCommand, { type: "set_portal" }>;

const decision = (code: CommandDecision["code"]): CommandDecision => ({
  allowed: code === null,
  code,
  parameters: {},
  amount: 0,
  cost: 0,
  refund: 0,
});

export const encounterTopologyHasRoutes = (
  state: Pick<EncounterState, "enemies">,
  map: WorldMap,
  portalStates: Readonly<Record<string, FacilityPortalState>>,
  combat: Pick<CombatDefinition, "enemies">,
  wave: readonly EncounterSpawn[]
): boolean => {
  if (wave.some((spawn) => !routePathForEnemy(spawn, map, portalStates, combat).length))
    return false;
  return state.enemies.every((enemy) => {
    const current = enemy.path[Math.min(enemy.pathIndex, enemy.path.length - 1)];
    if (!current) return false;
    return (
      findEnemyPathBetween(
        {
          flying: enemyDefinition(combat, enemy.type).flying,
          portalStates,
          start: current.cell,
          goal: map.coreBreachCell,
        },
        map
      ).length > 0
    );
  });
};

export const evaluateEncounterPortal = (
  state: EncounterState,
  command: PortalCommand,
  context: EncounterContext
): CommandDecision => {
  if (state.phase !== "build" && state.phase !== "assault") return decision("invalid_phase");
  const connection = state.map.connections[command.connectionId];
  const portal = state.portalStates[command.connectionId];
  if (!connection || !isArchitectural(connection) || !portal || portal.sealed)
    return decision("placement");
  if (connection.kind !== "door" && connection.kind !== "trapdoor") return decision("placement");
  const portals = {
    ...state.portalStates,
    [command.connectionId]: { ...portal, open: command.open },
  };
  return decision(
    encounterTopologyHasRoutes(
      state,
      state.map,
      portals,
      context.combat,
      context.definition.wave.slice(state.spawnCursor)
    )
      ? null
      : "route_unavailable"
  );
};

export const executeEncounterPortal = (
  state: EncounterState,
  command: PortalCommand,
  context: EncounterContext
): void => {
  const portal = state.portalStates[command.connectionId];
  if (!portal) throw new Error(`Portal state ${command.connectionId} vanished before execution`);
  portal.open = command.open;
  portal.sealed = false;
  for (const enemy of state.enemies) {
    const current = enemy.path[Math.min(enemy.pathIndex, enemy.path.length - 1)];
    if (!current) continue;
    const path = findEnemyPathBetween(
      {
        flying: enemyDefinition(context.combat, enemy.type).flying,
        portalStates: state.portalStates,
        start: current.cell,
        goal: state.map.coreBreachCell,
      },
      state.map
    );
    if (!path.length) throw new Error("Accepted portal command disconnected an active enemy");
    enemy.path = path;
    enemy.pathIndex = 0;
    enemy.progress = 0;
    enemy.mode = path[0]?.mode ?? "walking";
  }
};
