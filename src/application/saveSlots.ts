import type { GameState } from "../game/types";
import type { GuideEvidence } from "../tutorial/guideModel";

export const SAVE_SLOT_IDS = ["slot-1", "slot-2", "slot-3"] as const;

export type SaveSlotId = (typeof SAVE_SLOT_IDS)[number];

/** Guidance state belongs to the run, not the simulation. */
export interface TutorialSession {
  dismissedGuideIds: string[];
  guidanceEnabled: boolean;
  guideEvidence: GuideEvidence;
}

export interface SaveSlotRecord extends TutorialSession {
  id: SaveSlotId;
  game: GameState;
  savedAt: number;
}

export interface UnavailableSaveSlot {
  id: SaveSlotId;
  status: "incompatible" | "damaged";
}

export type SavedSlot = SaveSlotRecord | UnavailableSaveSlot;
export const isReadySaveSlot = (slot: SavedSlot): slot is SaveSlotRecord => "game" in slot;
export type SaveSlotCatalog = Record<SaveSlotId, SavedSlot | null>;

export const emptySaveSlotCatalog = (): SaveSlotCatalog => ({
  "slot-1": null,
  "slot-2": null,
  "slot-3": null,
});
