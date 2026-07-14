import type {
  GameState,
  GamePhase,
  ProcessId,
  RoomId,
  TransportPhase,
  TransportRunId,
} from "../game/types";

export type GuideCondition =
  | { kind: "all"; conditions: readonly GuideCondition[] }
  | { kind: "any"; conditions: readonly GuideCondition[] }
  | { kind: "phase_is"; phase: GamePhase }
  | { kind: "phase_is_after_build" }
  | { kind: "equipment_active"; roomId: RoomId; equipmentId: string }
  | { kind: "transport_enabled"; runId: TransportRunId; phase: TransportPhase }
  | { kind: "process_total"; processId: ProcessId; minimum: number }
  | { kind: "level_resolved" };

export const evaluateGuideCondition = (condition: GuideCondition, game: GameState): boolean => {
  switch (condition.kind) {
    case "all":
      return condition.conditions.every((child) => evaluateGuideCondition(child, game));
    case "any":
      return condition.conditions.some((child) => evaluateGuideCondition(child, game));
    case "phase_is":
      return game.phase === condition.phase;
    case "phase_is_after_build":
      return game.phase !== "level_briefing" && game.phase !== "build";
    case "equipment_active":
      return Object.values(game.rooms[condition.roomId].equipment).some(
        (instance) => instance?.equipmentId === condition.equipmentId && instance.enabled
      );
    case "transport_enabled": {
      const conduit =
        condition.phase === "gas"
          ? game.gasConduits[condition.runId]
          : game.liquidConduits[condition.runId];
      return conduit.installed && conduit.enabled;
    }
    case "process_total":
      return game.processes[condition.processId].totalProcessed >= condition.minimum;
    case "level_resolved":
      return game.phase === "level_complete" || game.phase === "victory";
  }
};

export const guideCondition =
  (condition: GuideCondition) =>
  (game: GameState): boolean =>
    evaluateGuideCondition(condition, game);
