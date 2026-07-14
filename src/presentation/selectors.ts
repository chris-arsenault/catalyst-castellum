import { DEFAULT_GAME_RUNTIME, type GameRuntime } from "../game/runtime";
import type {
  CommandDecision,
  GameCommand,
  GameState,
  RoomAnalysis,
  RoomState,
} from "../game/types";
import { hazardLabel, roomEffects, type HazardLabel } from "./roomCopy";
import { DEFAULT_TRANSLATOR, type Translator } from "../localization/translator";

export interface RoomViewModel extends RoomAnalysis {
  hazardLabel: HazardLabel;
  effects: string[];
}

const commandKey = (command: GameCommand): string => JSON.stringify(command);

export const createPresentationSelectors = (
  runtime: GameRuntime,
  translator: Translator = DEFAULT_TRANSLATOR
) => {
  const roomAnalysisCache = new WeakMap<RoomState, RoomViewModel>();
  const commandDecisionCache = new WeakMap<GameState, Map<string, CommandDecision>>();

  return Object.freeze({
    roomAnalysis: (room: RoomState): RoomViewModel => {
      const cached = roomAnalysisCache.get(room);
      if (cached) return cached;
      const raw = runtime.queries.analyzeRoom
        ? runtime.queries.analyzeRoom(room)
        : (() => {
            throw new Error("Runtime queries are missing room analysis");
          })();
      const analysis = {
        ...raw,
        hazardLabel: hazardLabel(raw.hazard),
        effects: roomEffects(room, runtime.definition, runtime.queries, translator),
      };
      roomAnalysisCache.set(room, analysis);
      return analysis;
    },
    commandDecision: (state: GameState, command: GameCommand): CommandDecision => {
      let decisions = commandDecisionCache.get(state);
      if (!decisions) {
        decisions = new Map();
        commandDecisionCache.set(state, decisions);
      }
      const key = commandKey(command);
      const cached = decisions.get(key);
      if (cached) return cached;
      const decision = runtime.evaluate(state, command);
      decisions.set(key, decision);
      return decision;
    },
  });
};

export const DEFAULT_PRESENTATION_SELECTORS = createPresentationSelectors(DEFAULT_GAME_RUNTIME);
export const { roomAnalysis, commandDecision } = DEFAULT_PRESENTATION_SELECTORS;
