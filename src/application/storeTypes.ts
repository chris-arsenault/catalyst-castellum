import type { StoreApi } from "zustand";
import type { GameCommand, GameState, RoomId } from "../game/types";
import type { SaveSlotCatalog, SaveSlotId } from "./saveSlots";

export interface ApplicationLifecycleSlice {
  initialized: boolean;
  activeSlotId: SaveSlotId | null;
  saveSlots: SaveSlotCatalog;
  initialize: () => void;
  selectSaveSlot: (slotId: SaveSlotId) => void;
  startNewGame: (slotId: SaveSlotId) => void;
  deleteSaveSlot: (slotId: SaveSlotId) => void;
  returnToMainMenu: () => void;
  reset: () => void;
}

export interface GameSessionSlice {
  game: GameState;
  dispatch: (command: GameCommand) => boolean;
  tick: (dt: number) => void;
}

export interface UiSlice {
  selectedRoomId: RoomId;
  showHelp: boolean;
  notice: string | null;
  dismissedGuideIds: string[];
  tutorialSessionRevision: number;
  selectRoom: (roomId: RoomId) => void;
  setShowHelp: (show: boolean) => void;
  dismissTutorialGuide: () => void;
  restartTutorialGuide: () => void;
  clearNotice: () => void;
}

export type GameStore = ApplicationLifecycleSlice & GameSessionSlice & UiSlice;

export interface GameStoreDependencies {
  loadSlots: () => SaveSlotCatalog;
  clearSlot: (slotId: SaveSlotId) => void;
  scheduleSave: (slotId: SaveSlotId, game: GameState, dismissedGuideIds: string[]) => void;
  cancelSave: (slotId: SaveSlotId) => void;
  flushSave: () => void;
}

export type StoreSet = StoreApi<GameStore>["setState"];
export type StoreGet = StoreApi<GameStore>["getState"];
