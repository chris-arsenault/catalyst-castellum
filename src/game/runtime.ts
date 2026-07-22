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
import { conduitRoomEffect, type ConduitRoomEffect } from "./engine/conduitRoomEffect";
import {
  reactionEngineDynamics,
  reactionEngineSample,
  type ReactionEngineDynamics,
  type ReactionEngineSample,
} from "./engine/reactionEngineDynamics";

export type { ConduitRoomEffect, ReactionEngineDynamics, ReactionEngineSample };

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
  roomEffect: {
    conduit: (
      state: GameState,
      connectionId: Parameters<typeof conduitRoomEffect>[1],
      enabled: boolean
    ) => ConduitRoomEffect;
  };
  reactionEngine: {
    sample: (state: GameState) => ReactionEngineSample;
    dynamics: (
      previous: ReactionEngineSample,
      current: ReactionEngineSample
    ) => ReactionEngineDynamics | null;
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
    roomEffect: Object.freeze({
      conduit: (
        state: GameState,
        connectionId: Parameters<typeof conduitRoomEffect>[1],
        enabled: boolean
      ) => conduitRoomEffect(state, connectionId, enabled, definition),
    }),
    reactionEngine: Object.freeze({
      sample: (state: GameState) => reactionEngineSample(state, definition),
      dynamics: reactionEngineDynamics,
    }),
  });

export const DEFAULT_GAME_RUNTIME = createGameRuntime(DEFAULT_GAME_DEFINITION);
