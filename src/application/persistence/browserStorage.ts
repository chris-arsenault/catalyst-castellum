import { decodeGame, encodeGame } from "../../game/save";
import type { GameState } from "../../game/types";
import {
  SAVE_SLOT_IDS,
  emptySaveSlotCatalog,
  type SaveSlotCatalog,
  type SaveSlotId,
  type SaveSlotRecord,
  type TutorialSession,
} from "../saveSlots";

const SAVE_SLOT_FORMAT_VERSION = 2;
const saveSlotKey = (slotId: SaveSlotId): string =>
  `catalyst-castellum:save:${slotId}:v${SAVE_SLOT_FORMAT_VERSION}`;

interface StoredSaveSlot {
  version: number;
  savedAt: number;
  game: string;
  dismissedGuideIds: string[];
  guidanceEnabled: boolean;
}

const storage = (): Storage | null => (typeof window === "undefined" ? null : window.localStorage);

const isStoredSaveSlot = (value: unknown): value is StoredSaveSlot => {
  if (!value || typeof value !== "object") return false;
  const stored = value as Partial<StoredSaveSlot>;
  return (
    stored.version === SAVE_SLOT_FORMAT_VERSION &&
    typeof stored.savedAt === "number" &&
    Number.isFinite(stored.savedAt) &&
    typeof stored.game === "string" &&
    Array.isArray(stored.dismissedGuideIds) &&
    typeof stored.guidanceEnabled === "boolean"
  );
};

const decodeSaveSlot = (slotId: SaveSlotId, raw: string): SaveSlotRecord | null => {
  try {
    const stored: unknown = JSON.parse(raw);
    if (!isStoredSaveSlot(stored)) return null;
    const game = decodeGame(stored.game);
    if (!game) return null;
    return {
      id: slotId,
      game,
      savedAt: stored.savedAt,
      dismissedGuideIds: stored.dismissedGuideIds.filter(
        (entry): entry is string => typeof entry === "string"
      ),
      guidanceEnabled: stored.guidanceEnabled,
    };
  } catch {
    return null;
  }
};

export const loadSaveSlot = (slotId: SaveSlotId): SaveSlotRecord | null => {
  const browserStorage = storage();
  if (!browserStorage) return null;
  const raw = browserStorage.getItem(saveSlotKey(slotId));
  return raw ? decodeSaveSlot(slotId, raw) : null;
};

export const saveGameSlot = (
  slotId: SaveSlotId,
  game: GameState,
  session: TutorialSession
): void => {
  const browserStorage = storage();
  if (!browserStorage) return;
  const value: StoredSaveSlot = {
    version: SAVE_SLOT_FORMAT_VERSION,
    savedAt: Date.now(),
    game: encodeGame(game),
    dismissedGuideIds: [...new Set(session.dismissedGuideIds)],
    guidanceEnabled: session.guidanceEnabled,
  };
  try {
    browserStorage.setItem(saveSlotKey(slotId), JSON.stringify(value));
  } catch {
    // A full or blocked storage area should never interrupt the live simulation.
  }
};

export const clearSaveSlot = (slotId: SaveSlotId): void => {
  storage()?.removeItem(saveSlotKey(slotId));
};

export const loadSaveSlots = (): SaveSlotCatalog => {
  const catalog = emptySaveSlotCatalog();
  for (const slotId of SAVE_SLOT_IDS) catalog[slotId] = loadSaveSlot(slotId);
  return catalog;
};
