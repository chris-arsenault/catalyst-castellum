import type { GameDefinition } from "../definitionTypes";
import type { GameState } from "../types";
import { cloneGame } from "../engine/roomState";
import { decodeGame, encodeGame } from "./saveCodec";

const CHECKPOINT_TIMESTAMP = "operation-checkpoint";

/** Capture the exact pre-assault build through the same codec used by browser saves. */
export const captureOperationCheckpoint = (state: GameState, definition: GameDefinition): void => {
  const snapshot = cloneGame(state);
  snapshot.campaign.operationCheckpoint = null;
  state.campaign.operationCheckpoint = encodeGame(snapshot, definition, CHECKPOINT_TIMESTAMP);
};

/** Decode and semantically validate a checkpoint before retry commits it. */
export const restoreOperationCheckpoint = (
  checkpoint: string,
  definition: GameDefinition
): GameState | null => decodeGame(checkpoint, definition);
