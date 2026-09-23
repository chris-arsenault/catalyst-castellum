/* eslint-disable complexity -- Portal fallbacks intentionally combine persisted and authored state. */
import type { GameDefinition } from "../definitionTypes";
import type {
  CommandDecision,
  CommandRejectionCode,
  FacilityPortalState,
  GameCommand,
  GameState,
} from "../types";
import { architecturalConnections, type WorldMap } from "../world/map";
import {
  plannedHullConnection,
  withHullCellEdit,
  withHullCellEdits,
  withHullPortalConfiguration,
  withoutHullConnection,
} from "../world/mapEdits";
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
      const persisted = state.encounter.portalStates[connection.id];
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
  return state.encounter.enemies.every((enemy) => {
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
      state.encounter.map,
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

export const evaluateHullCellEdits = (
  state: GameState,
  command: Extract<GameCommand, { type: "edit_hull_cells" }>,
  definition: GameDefinition
): CommandDecision => {
  if (state.phase !== "level_complete") return reject("invalid_phase");
  try {
    const map = withHullCellEdits(
      state.encounter.map,
      command.roomId,
      command.cells,
      command.terrain
    );
    return topologyHasRoutes(state, map, portalStatesForMap(state, map), definition)
      ? allow()
      : reject("route_unavailable");
  } catch {
    return reject("placement");
  }
};

export const evaluateConnectHullRooms = (
  state: GameState,
  command: Extract<GameCommand, { type: "connect_hull_rooms" }>,
  definition: GameDefinition
): CommandDecision => {
  if (state.phase !== "level_complete") return reject("invalid_phase");
  const plan = plannedHullConnection(state.encounter.map, command.fromRoomId, command.toRoomId);
  if (!plan) return reject("placement");
  return topologyHasRoutes(state, plan.map, portalStatesForMap(state, plan.map), definition)
    ? allow()
    : reject("route_unavailable");
};

export const evaluateRemoveHullConnection = (
  state: GameState,
  command: Extract<GameCommand, { type: "remove_hull_connection" }>,
  definition: GameDefinition
): CommandDecision => {
  if (state.phase !== "level_complete") return reject("invalid_phase");
  try {
    const map = withoutHullConnection(state.encounter.map, command.connectionId);
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
      state.encounter.map,
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
