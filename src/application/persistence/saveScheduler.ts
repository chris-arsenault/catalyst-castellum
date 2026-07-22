import type { GameState } from "../../game/types";
import type { SaveSlotId, TutorialSession } from "../saveSlots";
import { saveGameSlot } from "./browserStorage";

const SAVE_DELAY_MS = 750;

interface PendingSave {
  slotId: SaveSlotId;
  game: GameState;
  session: TutorialSession;
}

let latestSave: PendingSave | null = null;
let saveTimer: number | null = null;

const clearTimer = (): void => {
  if (typeof window !== "undefined" && saveTimer !== null) window.clearTimeout(saveTimer);
  saveTimer = null;
};

export const flushScheduledGameSave = (): void => {
  if (latestSave === null) return;
  clearTimer();
  saveGameSlot(latestSave.slotId, latestSave.game, latestSave.session);
  latestSave = null;
};

export const scheduleGameSave = (
  slotId: SaveSlotId,
  game: GameState,
  session: TutorialSession
): void => {
  if (typeof window === "undefined") return;
  if (latestSave && latestSave.slotId !== slotId) flushScheduledGameSave();
  latestSave = { slotId, game, session };
  if (saveTimer !== null) return;
  saveTimer = window.setTimeout(flushScheduledGameSave, SAVE_DELAY_MS);
};

export const cancelScheduledGameSave = (slotId: SaveSlotId): void => {
  if (latestSave?.slotId !== slotId) return;
  clearTimer();
  latestSave = null;
};
