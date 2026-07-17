import type { GameDefinition } from "../definitionTypes";
import type { CommandResult, FacilityPortalState, GameCommand, GameState } from "../types";
import { isArchitectural } from "../world/map";
import {
  plannedHullConnection,
  withHullCellEdit,
  withHullCellEdits,
  withHullPortalConfiguration,
  withoutHullConnection,
} from "../world/mapEdits";
import { acceptCommand } from "./commandResult";
import { replaceStateMap } from "./mapEditState";
import { findEnemyPathBetween } from "./navigation";
import { cloneGame } from "./roomState";

const repathLiveEnemies = (state: GameState, definition: GameDefinition): void => {
  for (const enemy of state.enemies) {
    const current = enemy.path[Math.min(enemy.pathIndex, enemy.path.length - 1)];
    if (!current) continue;
    const path = findEnemyPathBetween(
      {
        flying: definition.enemies[enemy.type].flying,
        portalStates: state.portalStates,
        start: current.cell,
        goal: state.map.coreBreachCell,
      },
      state.map
    );
    if (path.length === 0) continue;
    enemy.path = path;
    enemy.pathIndex = 0;
    enemy.progress = 0;
    enemy.mode = path[0]?.mode ?? "walking";
  }
};

export const editHullCellCommand = (
  source: GameState,
  command: Extract<GameCommand, { type: "edit_hull_cell" }>
): CommandResult => {
  const state = cloneGame(source);
  replaceStateMap(
    state,
    withHullCellEdit(state.map, command.roomId, command.cell, command.terrain, command.present)
  );
  return acceptCommand(state);
};

export const editHullCellsCommand = (
  source: GameState,
  command: Extract<GameCommand, { type: "edit_hull_cells" }>
): CommandResult => {
  const state = cloneGame(source);
  replaceStateMap(
    state,
    withHullCellEdits(state.map, command.roomId, command.cells, command.terrain)
  );
  return acceptCommand(state);
};

export const connectHullRoomsCommand = (
  source: GameState,
  command: Extract<GameCommand, { type: "connect_hull_rooms" }>
): CommandResult => {
  const state = cloneGame(source);
  const plan = plannedHullConnection(state.map, command.fromRoomId, command.toRoomId);
  if (!plan) throw new Error("Hull connection plan vanished before execution.");
  replaceStateMap(state, plan.map);
  state.portalStates[plan.connection.id] = {
    open: true,
    sealed: false,
    lastGasFlow: 0,
    lastLiquidFlow: 0,
  };
  return acceptCommand(state);
};

export const removeHullConnectionCommand = (
  source: GameState,
  command: Extract<GameCommand, { type: "remove_hull_connection" }>
): CommandResult => {
  const state = cloneGame(source);
  replaceStateMap(state, withoutHullConnection(state.map, command.connectionId));
  return acceptCommand(state);
};

export const configureHullPortalCommand = (
  source: GameState,
  command: Extract<GameCommand, { type: "configure_hull_portal" }>
): CommandResult => {
  const state = cloneGame(source);
  replaceStateMap(
    state,
    withHullPortalConfiguration(state.map, command.connectionId, command.kind, command.open)
  );
  const portal = state.portalStates[command.connectionId] ?? {
    lastGasFlow: 0,
    lastLiquidFlow: 0,
  };
  state.portalStates[command.connectionId] = {
    ...portal,
    open: command.kind === "passage" ? true : command.open,
    sealed: false,
  } satisfies FacilityPortalState;
  return acceptCommand(state);
};

export const setPortalCommand = (
  source: GameState,
  command: Extract<GameCommand, { type: "set_portal" }>,
  definition: GameDefinition
): CommandResult => {
  const state = cloneGame(source);
  const connection = state.map.connections[command.connectionId];
  if (!connection || !isArchitectural(connection))
    throw new Error(`Portal ${command.connectionId} vanished before execution.`);
  const portal = state.portalStates[command.connectionId];
  if (!portal) throw new Error(`Portal state ${command.connectionId} vanished before execution.`);
  portal.open = command.open;
  portal.sealed = false;
  repathLiveEnemies(state, definition);
  return acceptCommand(state);
};
