import { decodeGame, encodeGame } from "../../game/save";
import type { GameState } from "../../game/types";
import { clearDismissedGuideIds, loadDismissedGuideIds } from "../../tutorial/guideProgress";
import {
  SAVE_SLOT_IDS,
  emptySaveSlotCatalog,
  type SaveSlotCatalog,
  type SaveSlotId,
  type SaveSlotRecord,
} from "../saveSlots";

const SAVE_SLOT_FORMAT_VERSION = 1;
const saveSlotKey = (slotId: SaveSlotId): string =>
  `catalyst-castellum:save:${slotId}:v${SAVE_SLOT_FORMAT_VERSION}`;

export const LEGACY_UNSLOTTED_SAVE_KEYS = [
  "catalyst-castellum:save:v11",
  "catalyst-castellum:save:v10",
  "catalyst-castellum:save:v9",
  "catalyst-castellum:save:v8",
  "catalyst-castellum:save:v7",
] as const;

interface StoredSaveSlot {
  version: number;
  savedAt: number;
  game: string;
  dismissedGuideIds: string[];
}

const storage = (): Storage | null => (typeof window === "undefined" ? null : window.localStorage);

const decodeSaveSlot = (slotId: SaveSlotId, raw: string): SaveSlotRecord | null => {
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const stored = value as Partial<StoredSaveSlot>;
    if (
      stored.version !== SAVE_SLOT_FORMAT_VERSION ||
      typeof stored.savedAt !== "number" ||
      !Number.isFinite(stored.savedAt) ||
      typeof stored.game !== "string" ||
      !Array.isArray(stored.dismissedGuideIds)
    ) {
      return null;
    }
    const game = decodeGame(stored.game);
    if (!game) return null;
    return {
      id: slotId,
      game,
      savedAt: stored.savedAt,
      dismissedGuideIds: stored.dismissedGuideIds.filter(
        (entry): entry is string => typeof entry === "string"
      ),
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
  dismissedGuideIds: string[]
): void => {
  const browserStorage = storage();
  if (!browserStorage) return;
  const value: StoredSaveSlot = {
    version: SAVE_SLOT_FORMAT_VERSION,
    savedAt: Date.now(),
    game: encodeGame(game),
    dismissedGuideIds: [...new Set(dismissedGuideIds)],
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

const loadLegacyUnslottedGame = (): GameState | null => {
  const browserStorage = storage();
  if (!browserStorage) return null;
  for (const key of LEGACY_UNSLOTTED_SAVE_KEYS) {
    const raw = browserStorage.getItem(key);
    if (!raw) continue;
    const game = decodeGame(raw);
    if (game) return game;
  }
  return null;
};

const clearLegacyUnslottedState = (): void => {
  const browserStorage = storage();
  if (!browserStorage) return;
  for (const key of LEGACY_UNSLOTTED_SAVE_KEYS) browserStorage.removeItem(key);
  clearDismissedGuideIds();
};

const migrateLegacySave = (catalog: SaveSlotCatalog): SaveSlotCatalog => {
  if (SAVE_SLOT_IDS.some((slotId) => catalog[slotId])) return catalog;
  const game = loadLegacyUnslottedGame();
  if (!game) return catalog;
  const dismissedGuideIds = loadDismissedGuideIds();
  saveGameSlot("slot-1", game, dismissedGuideIds);
  clearLegacyUnslottedState();
  return {
    ...catalog,
    "slot-1": loadSaveSlot("slot-1"),
  };
};

export const loadSaveSlots = (): SaveSlotCatalog => {
  const catalog = emptySaveSlotCatalog();
  for (const slotId of SAVE_SLOT_IDS) catalog[slotId] = loadSaveSlot(slotId);
  return migrateLegacySave(catalog);
};
