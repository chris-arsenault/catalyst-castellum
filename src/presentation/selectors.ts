import { evaluateCommand } from "../game/engine/commandPolicy";
import { analyzeRoom } from "../game/engine/roomState";
import type {
  CommandDecision,
  GameCommand,
  GameState,
  RoomAnalysis,
  RoomState,
} from "../game/types";
import { hazardLabel, roomEffects, type HazardLabel } from "./roomCopy";

export interface RoomViewModel extends RoomAnalysis {
  hazardLabel: HazardLabel;
  effects: string[];
}

const roomAnalysisCache = new WeakMap<RoomState, RoomViewModel>();
const commandDecisionCache = new WeakMap<GameState, Map<string, CommandDecision>>();

export const roomAnalysis = (room: RoomState): RoomViewModel => {
  const cached = roomAnalysisCache.get(room);
  if (cached) return cached;
  const raw = analyzeRoom(room);
  const analysis = { ...raw, hazardLabel: hazardLabel(raw.hazard), effects: roomEffects(room) };
  roomAnalysisCache.set(room, analysis);
  return analysis;
};

const commandKey = (command: GameCommand): string => JSON.stringify(command);

export const commandDecision = (state: GameState, command: GameCommand): CommandDecision => {
  let decisions = commandDecisionCache.get(state);
  if (!decisions) {
    decisions = new Map();
    commandDecisionCache.set(state, decisions);
  }
  const key = commandKey(command);
  const cached = decisions.get(key);
  if (cached) return cached;
  const decision = evaluateCommand(state, command);
  decisions.set(key, decision);
  return decision;
};
