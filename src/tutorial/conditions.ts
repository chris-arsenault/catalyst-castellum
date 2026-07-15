import type {
  GameState,
  GamePhase,
  ProcessId,
  RoomId,
  TransportPhase,
  ConnectionId,
} from "../game/types";
import { gasConduitState, liquidConduitState, roomState } from "../game/world/instances";

export type GuideCondition =
  | { kind: "all"; conditions: readonly GuideCondition[] }
  | { kind: "any"; conditions: readonly GuideCondition[] }
  | { kind: "phase_is"; phase: GamePhase }
  | { kind: "phase_is_after_build" }
  | { kind: "equipment_active"; roomId: RoomId; equipmentId: string }
  | { kind: "transport_enabled"; runId: ConnectionId; phase: TransportPhase }
  | { kind: "process_total"; processId: ProcessId; minimum: number }
  | { kind: "level_resolved" };

type GuideLeafCondition = Exclude<GuideCondition, { kind: "all" | "any" }>;

const phaseIsAfterBuild = (phase: GamePhase): boolean =>
  phase !== "level_briefing" && phase !== "build";

const equipmentIsActive = (
  game: GameState,
  condition: Extract<GuideCondition, { kind: "equipment_active" }>
): boolean =>
  Object.values(roomState(game, condition.roomId).equipment).some(
    (instance) => instance?.equipmentId === condition.equipmentId && instance.enabled
  );

const transportIsEnabled = (
  game: GameState,
  condition: Extract<GuideCondition, { kind: "transport_enabled" }>
): boolean => {
  const conduit =
    condition.phase === "gas"
      ? gasConduitState(game, condition.runId)
      : liquidConduitState(game, condition.runId);
  return conduit.installed && conduit.enabled;
};

const evaluateGuideLeaf = (condition: GuideLeafCondition, game: GameState): boolean => {
  switch (condition.kind) {
    case "phase_is":
      return game.phase === condition.phase;
    case "phase_is_after_build":
      return phaseIsAfterBuild(game.phase);
    case "equipment_active":
      return equipmentIsActive(game, condition);
    case "transport_enabled":
      return transportIsEnabled(game, condition);
    case "process_total":
      return game.processes[condition.processId].totalProcessed >= condition.minimum;
    case "level_resolved":
      return game.phase === "level_complete" || game.phase === "victory";
  }
};

export const evaluateGuideCondition = (condition: GuideCondition, game: GameState): boolean => {
  if (condition.kind === "all")
    return condition.conditions.every((child) => evaluateGuideCondition(child, game));
  if (condition.kind === "any")
    return condition.conditions.some((child) => evaluateGuideCondition(child, game));
  return evaluateGuideLeaf(condition, game);
};

export const guideCondition =
  (condition: GuideCondition) =>
  (game: GameState): boolean =>
    evaluateGuideCondition(condition, game);
