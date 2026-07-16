/* eslint-disable complexity -- Portal fallbacks intentionally combine persisted and authored state. */
import type { GameDefinition } from "../definitionTypes";
import type {
  CommandDecision,
  CommandRejectionCode,
  FacilityPortalState,
  GameCommand,
  GameState,
} from "../types";
import { architecturalConnections, isArchitectural, type WorldMap } from "../world/map";
import { withHullCellEdit, withHullPortalConfiguration } from "../world/mapEdits";
import { findEnemyPath, findEnemyPathBetween } from "./navigation";

const decision = (allowed: boolean, code: CommandRejectionCode | null): CommandDecision => ({
  allowed,
  code,
  parameters: {},
  amount: 0,
  cost: 0,
  refund: 0,
});

const allow = (): CommandDecision => decision(true, null);
const reject = (code: CommandRejectionCode): CommandDecision => decision(false, code);

export const portalStatesForMap = (
  state: GameState,
  map: WorldMap,
  override?: { connectionId: string; open: boolean }
): Record<string, FacilityPortalState> =>
  Object.fromEntries(
    architecturalConnections(map).map((connection) => {
      const persisted = state.portalStates[connection.id];
      const overridden = override?.connectionId === connection.id;
      return [
        connection.id,
        {
          open: overridden
            ? (override?.open ?? false)
            : (persisted?.open ?? connection.defaultOpen),
          sealed: persisted?.sealed ?? connection.defaultSealed,
          lastGasFlow: persisted?.lastGasFlow ?? 0,
          lastLiquidFlow: persisted?.lastLiquidFlow ?? 0,
        },
      ];
    })
  );

export const topologyHasRoutes = (
  state: GameState,
  map: WorldMap,
  portalStates: Readonly<Record<string, FacilityPortalState>>,
  definition: GameDefinition
): boolean => {
  if (findEnemyPath({ flying: false, portalStates }, map).length === 0) return false;
  return state.enemies.every((enemy) => {
    const current = enemy.path[Math.min(enemy.pathIndex, enemy.path.length - 1)];
    if (!current) return true;
    return (
      findEnemyPathBetween(
        {
          flying: definition.enemies[enemy.type].flying,
          portalStates,
          start: current.cell,
          goal: map.coreBreachCell,
        },
        map
      ).length > 0
    );
  });
};

export const evaluateHullCellEdit = (
  state: GameState,
  command: Extract<GameCommand, { type: "edit_hull_cell" }>,
  definition: GameDefinition
): CommandDecision => {
  if (state.phase !== "level_complete") return reject("invalid_phase");
  try {
    const map = withHullCellEdit(
      state.map,
      command.roomId,
      command.cell,
      command.terrain,
      command.present
    );
    return topologyHasRoutes(state, map, portalStatesForMap(state, map), definition)
      ? allow()
      : reject("route_unavailable");
  } catch {
    return reject("placement");
  }
};

export const evaluateHullPortalConfiguration = (
  state: GameState,
  command: Extract<GameCommand, { type: "configure_hull_portal" }>,
  definition: GameDefinition
): CommandDecision => {
  if (state.phase !== "level_complete") return reject("invalid_phase");
  try {
    const map = withHullPortalConfiguration(
      state.map,
      command.connectionId,
      command.kind,
      command.open
    );
    const open = command.kind === "passage" || command.open;
    const states = portalStatesForMap(state, map, { connectionId: command.connectionId, open });
    return topologyHasRoutes(state, map, states, definition)
      ? allow()
      : reject("route_unavailable");
  } catch {
    return reject("placement");
  }
};

export const evaluateSetPortal = (
  state: GameState,
  command: Extract<GameCommand, { type: "set_portal" }>,
  definition: GameDefinition
): CommandDecision => {
  const connection = state.map.connections[command.connectionId];
  const portal = state.portalStates[command.connectionId];
  if (
    !connection ||
    !isArchitectural(connection) ||
    (connection.kind !== "door" && connection.kind !== "trapdoor") ||
    !portal ||
    portal.sealed
  )
    return reject("placement");
  const states = portalStatesForMap(state, state.map, {
    connectionId: command.connectionId,
    open: command.open,
  });
  return topologyHasRoutes(state, state.map, states, definition)
    ? allow()
    : reject("route_unavailable");
};
