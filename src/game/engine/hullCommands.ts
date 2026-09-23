import type { CommandResult, FacilityPortalState, GameCommand, GameState } from "../types";
import {
  plannedHullConnection,
  withHullCellEdit,
  withHullCellEdits,
  withHullPortalConfiguration,
  withoutHullConnection,
} from "../world/mapEdits";
import { acceptCommand } from "./commandResult";
import { replaceStateMap } from "./mapEditState";
import { cloneGame } from "./gameState";

export const editHullCellCommand = (
  source: GameState,
  command: Extract<GameCommand, { type: "edit_hull_cell" }>
): CommandResult => {
  const state = cloneGame(source);
  replaceStateMap(
    state,
    withHullCellEdit(
      state.encounter.map,
      command.roomId,
      command.cell,
      command.terrain,
      command.present
    )
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
    withHullCellEdits(state.encounter.map, command.roomId, command.cells, command.terrain)
  );
  return acceptCommand(state);
};

export const connectHullRoomsCommand = (
  source: GameState,
  command: Extract<GameCommand, { type: "connect_hull_rooms" }>
): CommandResult => {
  const state = cloneGame(source);
  const plan = plannedHullConnection(state.encounter.map, command.fromRoomId, command.toRoomId);
  if (!plan) throw new Error("Hull connection plan vanished before execution.");
  replaceStateMap(state, plan.map);
  state.encounter.portalStates[plan.connection.id] = {
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
  replaceStateMap(state, withoutHullConnection(state.encounter.map, command.connectionId));
  return acceptCommand(state);
};

export const configureHullPortalCommand = (
  source: GameState,
  command: Extract<GameCommand, { type: "configure_hull_portal" }>
): CommandResult => {
  const state = cloneGame(source);
  replaceStateMap(
    state,
    withHullPortalConfiguration(
      state.encounter.map,
      command.connectionId,
      command.kind,
      command.open
    )
  );
  const portal = state.encounter.portalStates[command.connectionId] ?? {
    lastGasFlow: 0,
    lastLiquidFlow: 0,
  };
  state.encounter.portalStates[command.connectionId] = {
    ...portal,
    open: command.kind === "passage" ? true : command.open,
    sealed: false,
  } satisfies FacilityPortalState;
  return acceptCommand(state);
};
