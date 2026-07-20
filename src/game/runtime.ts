import { DEFAULT_GAME_DEFINITION } from "./definition";
import type { GameDefinition, LevelDefinition, RoundDefinition } from "./definitionTypes";
import { levelDefinitionFor, roundDefinitionFor } from "./engine/campaign";
import { evaluateCommand } from "./engine/commandPolicy";
import { executeCommand } from "./engine/commands";
import { createInitialGame, createScenarioGame } from "./engine/scenarioState";
import { stepGame } from "./engine/step";
import { validateGameState, type StateValidationIssue } from "./engine/stateValidation";
import type { CommandDecision, CommandResult, GameCommand, GameState, LevelId } from "./types";
import { createGameQueries, type GameQueries } from "./queries";
import { decodeGame, encodeGame } from "./persistence/saveCodec";
import {
  defensivePosture,
  type DefensiveEnemyPosture,
  type DefensivePosture,
  type DefensiveRoomPosture,
} from "./engine/defensivePosture";
import {
  conduitDefensiveImpact,
  projectedDefensivePosture,
  type ConduitDefensiveImpact,
  type DefensiveRoomImpact,
} from "./engine/defensivePostureProjection";

export type {
  ConduitDefensiveImpact,
  DefensiveEnemyPosture,
  DefensivePosture,
  DefensiveRoomImpact,
  DefensiveRoomPosture,
};

export interface GameRuntime {
  readonly definition: GameDefinition;
  readonly queries: GameQueries;
  readonly save: {
    encode: (state: GameState) => string;
    decode: (raw: string) => GameState | null;
  };
  createInitial: () => GameState;
  createScenario: (levelId: LevelId, completedLevelIds?: LevelId[]) => GameState;
  evaluate: (state: GameState, command: GameCommand) => CommandDecision;
  execute: (state: GameState, command: GameCommand) => CommandResult;
  step: (state: GameState, dt: number) => GameState;
  validate: (state: GameState) => StateValidationIssue[];
  level: (state: GameState) => LevelDefinition;
  round: (state: GameState) => RoundDefinition;
  posture: {
    current: (state: GameState) => DefensivePosture;
    projected: (state: GameState, seconds?: number) => DefensivePosture;
    conduitImpact: (
      state: GameState,
      connectionId: Parameters<typeof conduitDefensiveImpact>[1],
      enabled: boolean,
      seconds?: number
    ) => ConduitDefensiveImpact;
  };
}

export const createGameRuntime = (definition: GameDefinition): GameRuntime =>
  Object.freeze({
    definition,
    queries: createGameQueries(definition),
    save: Object.freeze({
      encode: (state: GameState) => encodeGame(state, definition),
      decode: (raw: string) => decodeGame(raw, definition),
    }),
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
    posture: Object.freeze({
      current: (state: GameState) => defensivePosture(state, definition),
      projected: (state: GameState, seconds?: number) =>
        projectedDefensivePosture(state, definition, seconds),
      conduitImpact: (
        state: GameState,
        connectionId: Parameters<typeof conduitDefensiveImpact>[1],
        enabled: boolean,
        seconds?: number
      ) => conduitDefensiveImpact(state, connectionId, enabled, definition, seconds),
    }),
  });

export const DEFAULT_GAME_RUNTIME = createGameRuntime(DEFAULT_GAME_DEFINITION);
