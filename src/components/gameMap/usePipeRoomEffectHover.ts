import { useCallback, useEffect, useEffectEvent, useState } from "react";
import { useGamePresentation } from "../../application/presentationContext";
import { useGameStore } from "../../application/store";
import type { RoomEffectPreview } from "../../application/storeTypes";
import type { ConnectionId, GameState } from "../../game/types";
import type { GamePresentation } from "../../presentation/services";

type RunHoverHandler = (runId: ConnectionId | null) => void;

/** The room marker for the action a click on this installed line would perform. */
export const pipeRoomEffectPreview = (
  game: GameState,
  runId: ConnectionId,
  presentation: GamePresentation
): RoomEffectPreview | null => {
  const conduit = game.gasConduits[runId] ?? game.liquidConduits[runId];
  if (!conduit) return null;

  const enabled = !conduit.enabled;
  const command = { type: "set_conduit", connectionId: runId, enabled } as const;
  if (!presentation.selectors.commandDecision(game, command).allowed) return null;

  const effect = presentation.roomEffect.conduit(game, runId, enabled);
  return {
    connectionId: runId,
    rooms: Object.fromEntries(effect.rooms.map((room) => [room.roomId, room.tone])),
  };
};

/** Couples immediate map-line hover to both lane emphasis and target-room posture feedback. */
export const usePipeRoomEffectHover = (
  game: GameState,
  onHoverRun: RunHoverHandler
): RunHoverHandler => {
  const presentation = useGamePresentation();
  const setRoomEffectPreview = useGameStore((state) => state.setRoomEffectPreview);
  const [hoveredRunId, setHoveredRunId] = useState<ConnectionId | null>(null);
  const conduit = hoveredRunId
    ? (game.gasConduits[hoveredRunId] ?? game.liquidConduits[hoveredRunId])
    : null;
  const refreshPreview = useEffectEvent((runId: ConnectionId | null) => {
    setRoomEffectPreview(runId ? pipeRoomEffectPreview(game, runId, presentation) : null);
  });

  useEffect(() => () => setRoomEffectPreview(null), [setRoomEffectPreview]);
  useEffect(() => {
    refreshPreview(hoveredRunId);
  }, [conduit?.blocked, conduit?.enabled, game.mapRevision, game.phase, hoveredRunId]);

  return useCallback(
    (runId: ConnectionId | null) => {
      onHoverRun(runId);
      setHoveredRunId(runId);
    },
    [onHoverRun]
  );
};
