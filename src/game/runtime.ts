import type { LevelDefinition, RoundDefinition } from "./content/campaign";
import { DEFAULT_GAME_DEFINITION, type GameDefinition } from "./definition";
import { levelDefinitionFor, roundDefinitionFor } from "./engine/campaign";
import { evaluateCommand } from "./engine/commandPolicy";
import { executeCommand } from "./engine/commands";
import { createInitialGame, createScenarioGame } from "./engine/scenarioState";
import { stepGame } from "./engine/step";
import { validateGameState, type StateValidationIssue } from "./engine/stateValidation";
import type { CommandDecision, CommandResult, GameCommand, GameState, LevelId } from "./types";

export interface GameRuntime {
  readonly definition: GameDefinition;
  createInitial: () => GameState;
  createScenario: (levelId: LevelId, completedLevelIds?: LevelId[]) => GameState;
  evaluate: (state: GameState, command: GameCommand) => CommandDecision;
  execute: (state: GameState, command: GameCommand) => CommandResult;
  step: (state: GameState, dt: number) => GameState;
  validate: (state: GameState) => StateValidationIssue[];
  level: (state: GameState) => LevelDefinition;
  round: (state: GameState) => RoundDefinition;
}

export const createGameRuntime = (definition: GameDefinition): GameRuntime =>
  Object.freeze({
    definition,
    createInitial: () => createInitialGame(definition),
    createScenario: (levelId: LevelId, completedLevelIds: LevelId[] = []) =>
      createScenarioGame(levelId, completedLevelIds, definition),
    evaluate: (state: GameState, command: GameCommand) =>
      evaluateCommand(state, command, definition),
    execute: (state: GameState, command: GameCommand) => executeCommand(state, command, definition),
    step: (state: GameState, dt: number) => stepGame(state, dt, definition),
    validate: (state: GameState) => validateGameState(state, definition),
    level: (state: GameState) => levelDefinitionFor(state, definition),
    round: (state: GameState) => roundDefinitionFor(state, definition),
  });

export const DEFAULT_GAME_RUNTIME = createGameRuntime(DEFAULT_GAME_DEFINITION);
