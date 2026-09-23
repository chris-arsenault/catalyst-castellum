import type { GameDefinition } from "../definitionTypes";
import type { CommandResult, GameCommand, GameState } from "../types";
import { dismantleModuleCommand, graftModuleCommand } from "./graftCommands";
import { cloneGame } from "./gameState";
import { evaluateCommand } from "./commandPolicy";
import { acceptCommand, rejectCommand } from "./commandResult";
import {
  beginLevelCommand,
  dockAtSiteCommand,
  continueRoundCommand,
  retryLevelCommand,
  startNextLevelCommand,
} from "./campaignCommands";
import {
  configureHullPortalCommand,
  connectHullRoomsCommand,
  editHullCellCommand,
  editHullCellsCommand,
  removeHullConnectionCommand,
} from "./hullCommands";
import { captureOperationCheckpoint } from "../persistence/operationCheckpoint";
import { createEncounterRuntime } from "../encounter/runtime";
import { campaignEncounterContext } from "./campaignEncounter";
import { transitionPhase } from "./phaseModel";

/* eslint-disable complexity -- Exhaustive dispatch delegates each command to its owning subsystem. */
export const executeCommand = (
  source: GameState,
  command: GameCommand,
  definition: GameDefinition
): CommandResult => {
  const decision = evaluateCommand(source, command, definition);
  if (!decision.allowed)
    return rejectCommand(source, decision.code ?? "invalid_phase", decision.parameters);
  switch (command.type) {
    case "graft_module":
      return graftModuleCommand(source, command, decision, definition);
    case "dismantle_module":
      return dismantleModuleCommand(source, command, decision);
    case "edit_hull_cell":
      return editHullCellCommand(source, command);
    case "edit_hull_cells":
      return editHullCellsCommand(source, command);
    case "connect_hull_rooms":
      return connectHullRoomsCommand(source, command);
    case "remove_hull_connection":
      return removeHullConnectionCommand(source, command);
    case "configure_hull_portal":
      return configureHullPortalCommand(source, command);
    case "begin_level":
      return beginLevelCommand(source);
    case "continue_round":
      return continueRoundCommand(source, definition);
    case "start_next_level":
      return startNextLevelCommand(source, definition);
    case "dock_at_site":
      return dockAtSiteCommand(source, definition);
    case "retry_level":
      return retryLevelCommand(source, definition);
    case "toggle_pause":
    case "set_pause":
    case "set_speed":
      return rejectCommand(source, "invalid_phase", {});
    default: {
      const state = cloneGame(source);
      if (command.type === "start_assault") captureOperationCheckpoint(state, definition);
      const encounter = state.encounter;
      const result = createEncounterRuntime(campaignEncounterContext(state, definition)).execute(
        encounter,
        {
          tick: encounter.tick,
          sequence:
            encounter.commandCursor.tick === encounter.tick
              ? encounter.commandCursor.sequence + 1
              : 0,
          command,
        }
      );
      if (!result.state.process) throw new Error("Campaign encounter lost its process state");
      state.encounter = { ...result.state, process: result.state.process };
      if (command.type === "start_assault") transitionPhase(state, "assault");
      return acceptCommand(state);
    }
  }
};
