import type { GameState } from "../game/types";

export const SAVE_SLOT_IDS = ["slot-1", "slot-2", "slot-3"] as const;

export type SaveSlotId = (typeof SAVE_SLOT_IDS)[number];

/** Guidance state belongs to the run, not the simulation. */
export interface TutorialSession {
  dismissedGuideIds: string[];
  guidanceEnabled: boolean;
}

export interface SaveSlotRecord extends TutorialSession {
  id: SaveSlotId;
  game: GameState;
  savedAt: number;
}

export type SaveSlotCatalog = Record<SaveSlotId, SaveSlotRecord | null>;

export const emptySaveSlotCatalog = (): SaveSlotCatalog => ({
  "slot-1": null,
  "slot-2": null,
  "slot-3": null,
});
