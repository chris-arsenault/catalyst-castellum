import type { PipePreview, PipePreviewOption } from "../application/storeTypes";
import type { GameState, RoomId } from "../game/types";
import { evaluateCommand } from "../game/simulation";
import { isProcessLine, processLineId, type ProcessLineKind } from "../game/world/map";
import { DEFAULT_GAME_DEFINITION as PACK } from "./defaultGame";
import { plannedLineConnection } from "../game/world/mapEdits";

const KINDS: readonly ProcessLineKind[] = ["gas_line", "liquid_line"];

const previewOption = (
  game: GameState,
  kind: ProcessLineKind,
  fromRoomId: RoomId,
  toRoomId: RoomId
): PipePreviewOption | null => {
  const connectionId = processLineId(kind, fromRoomId, toRoomId);
  const existing = game.map.connections[connectionId];
  const line =
    existing && isProcessLine(existing)
      ? existing
      : plannedLineConnection(PACK, game.map, kind, fromRoomId, toRoomId);
  if (!line) return null;
  const decision = evaluateCommand(game, {
    type: "build_connection",
    kind,
    fromRoomId,
    toRoomId,
  });
  return {
    kind,
    connectionId,
    route: line.route,
    cost: line.buildCost,
    buildable: decision.allowed,
    reason: decision.allowed ? null : (decision.code ?? null),
  };
};

/**
 * The routed proposal a drag opens (M3 decision: preview then confirm). Nothing is
 * built here — the Build action dispatches `build_connection`, which re-derives the
 * identical route from the same frozen map.
 */
export const planPipePreview = (
  game: GameState,
  fromRoomId: RoomId,
  toRoomId: RoomId,
  anchor: { x: number; y: number }
): PipePreview | null => {
  if (fromRoomId === toRoomId) return null;
  const options = KINDS.flatMap((kind) => {
    const option = previewOption(game, kind, fromRoomId, toRoomId);
    return option ? [option] : [];
  });
  if (options.length === 0) return null;
  return { fromRoomId, toRoomId, anchor, options };
};
