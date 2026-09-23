import { decodeGame, encodeGame, inspectGameSave } from "../../game/save";
import type { GameState } from "../../game/types";
import type { GuideEvidence } from "../../tutorial/guideModel";
import {
  SAVE_SLOT_IDS,
  emptySaveSlotCatalog,
  type SaveSlotCatalog,
  type SaveSlotId,
  type SaveSlotRecord,
  type TutorialSession,
  type SavedSlot,
} from "../saveSlots";

const SAVE_SLOT_FORMAT_VERSION = 3;
const saveSlotKey = (slotId: SaveSlotId): string =>
  `catalyst-castellum:save:${slotId}:v${SAVE_SLOT_FORMAT_VERSION}`;

interface StoredSaveSlot {
  version: number;
  savedAt: number;
  game: string;
  dismissedGuideIds: string[];
  guidanceEnabled: boolean;
  guideEvidence: GuideEvidence;
}

const storage = (): Storage | null => (typeof window === "undefined" ? null : window.localStorage);

const isGuideEvidence = (value: unknown): value is GuideEvidence =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.values(value).every((progress: unknown) => {
    if (!progress || typeof progress !== "object") return false;
    return (
      "steps" in progress &&
      Array.isArray(progress.steps) &&
      progress.steps.every((step: unknown) => typeof step === "string") &&
      "tasks" in progress &&
      Array.isArray(progress.tasks) &&
      progress.tasks.every((task: unknown) => typeof task === "string")
    );
  });

const isStoredSaveSlot = (value: unknown): value is StoredSaveSlot => {
  if (!value || typeof value !== "object") return false;
  const stored = value as Partial<StoredSaveSlot>;
  return (
    stored.version === SAVE_SLOT_FORMAT_VERSION &&
    typeof stored.savedAt === "number" &&
    Number.isFinite(stored.savedAt) &&
    typeof stored.game === "string" &&
    Array.isArray(stored.dismissedGuideIds) &&
    typeof stored.guidanceEnabled === "boolean" &&
    isGuideEvidence(stored.guideEvidence)
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
      guideEvidence: stored.guideEvidence,
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
    guideEvidence: session.guideEvidence,
  };
  try {
    browserStorage.setItem(saveSlotKey(slotId), JSON.stringify(value));
  } catch {
    // A full or blocked storage area should never interrupt the live simulation.
  }
};

export const clearSaveSlot = (slotId: SaveSlotId): void => {
  const browserStorage = storage();
  if (!browserStorage) return;
  for (const key of slotKeys(browserStorage, slotId)) browserStorage.removeItem(key);
};

const slotKeys = (browserStorage: Storage, slotId: SaveSlotId): string[] => {
  const prefix = `catalyst-castellum:save:${slotId}:v`;
  return Array.from({ length: browserStorage.length }, (_, index) =>
    browserStorage.key(index)
  ).filter(
    (key): key is string =>
      key !== null && key.startsWith(prefix) && /^\d+$/.test(key.slice(prefix.length))
  );
};

const unavailableSlot = (slotId: SaveSlotId, raw: string): SavedSlot => {
  try {
    const value: unknown = JSON.parse(raw);
    if (
      value &&
      typeof value === "object" &&
      "version" in value &&
      value.version !== SAVE_SLOT_FORMAT_VERSION
    )
      return { id: slotId, status: "incompatible" };
    if (isStoredSaveSlot(value) && inspectGameSave(value.game).status === "incompatible")
      return { id: slotId, status: "incompatible" };
  } catch {
    /* Malformed data remains visible until explicitly replaced or deleted. */
  }
  return { id: slotId, status: "damaged" };
};

export const loadSaveSlots = (): SaveSlotCatalog => {
  const catalog = emptySaveSlotCatalog();
  const browserStorage = storage();
  if (!browserStorage) return catalog;
  for (const slotId of SAVE_SLOT_IDS) {
    const raw = browserStorage.getItem(saveSlotKey(slotId));
    if (raw !== null) catalog[slotId] = decodeSaveSlot(slotId, raw) ?? unavailableSlot(slotId, raw);
    else if (slotKeys(browserStorage, slotId).length > 0)
      catalog[slotId] = { id: slotId, status: "incompatible" };
  }
  return catalog;
};
