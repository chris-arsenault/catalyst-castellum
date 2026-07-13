import type { GameState } from "../../game/types";
import type { SaveSlotId } from "../saveSlots";
import { saveGameSlot } from "./browserStorage";

const SAVE_DELAY_MS = 750;

interface PendingSave {
  slotId: SaveSlotId;
  game: GameState;
  dismissedGuideIds: string[];
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
  saveGameSlot(latestSave.slotId, latestSave.game, latestSave.dismissedGuideIds);
  latestSave = null;
};

export const scheduleGameSave = (
  slotId: SaveSlotId,
  game: GameState,
  dismissedGuideIds: string[]
): void => {
  if (typeof window === "undefined") return;
  if (latestSave && latestSave.slotId !== slotId) flushScheduledGameSave();
  latestSave = { slotId, game, dismissedGuideIds };
  if (saveTimer !== null) return;
  saveTimer = window.setTimeout(flushScheduledGameSave, SAVE_DELAY_MS);
};

export const cancelScheduledGameSave = (slotId: SaveSlotId): void => {
  if (latestSave?.slotId !== slotId) return;
  clearTimer();
  latestSave = null;
};
