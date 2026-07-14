import { create, type StateCreator } from "zustand";
import { DEFAULT_GAME_RUNTIME } from "../game/runtime";
import { clearSaveSlot, loadSaveSlots } from "./persistence/browserStorage";
import {
  cancelScheduledGameSave,
  flushScheduledGameSave,
  scheduleGameSave,
} from "./persistence/saveScheduler";
import { createGameSessionActions } from "./gameSessionSlice";
import { emptySaveSlotCatalog } from "./saveSlots";
import type {
  ApplicationLifecycleSlice,
  GameStore,
  GameStoreDependencies,
  StoreGet,
  StoreSet,
} from "./storeTypes";
import { createUiActions } from "./uiSlice";

export type { GameStore, GameStoreDependencies } from "./storeTypes";

const browserDependencies: GameStoreDependencies = {
  loadSlots: loadSaveSlots,
  clearSlot: clearSaveSlot,
  scheduleSave: scheduleGameSave,
  cancelSave: cancelScheduledGameSave,
  flushSave: flushScheduledGameSave,
};

const CLEAN_TUTORIAL_UI = {
  acknowledgedStageIntroIds: [],
  dismissedGuideIds: [],
  showHelp: false,
  manualSection: "operations" as const,
  equipmentBuildTarget: null,
  notice: null,
};

const createLifecycleActions = (
  set: StoreSet,
  get: StoreGet,
  dependencies: GameStoreDependencies
): Pick<
  ApplicationLifecycleSlice,
  "initialize" | "selectSaveSlot" | "startNewGame" | "deleteSaveSlot" | "returnToMainMenu" | "reset"
> => ({
  initialize: () => {
    if (get().initialized) return;
    set({
      initialized: true,
      activeSlotId: null,
      saveSlots: dependencies.loadSlots(),
      ...CLEAN_TUTORIAL_UI,
    });
  },
  selectSaveSlot: (slotId) => {
    const record = get().saveSlots[slotId];
    if (!record) {
      get().startNewGame(slotId);
      return;
    }
    set((state) => ({
      activeSlotId: slotId,
      game: record.game,
      selectedRoomId: DEFAULT_GAME_RUNTIME.level(record.game).focusRoomId,
      ...CLEAN_TUTORIAL_UI,
      dismissedGuideIds: record.dismissedGuideIds,
      tutorialSessionRevision: state.tutorialSessionRevision + 1,
    }));
  },
  startNewGame: (slotId) => {
    dependencies.cancelSave(slotId);
    dependencies.clearSlot(slotId);
    const game = DEFAULT_GAME_RUNTIME.createInitial();
    const savedAt = Date.now();
    dependencies.scheduleSave(slotId, game, []);
    set((state) => ({
      activeSlotId: slotId,
      saveSlots: {
        ...state.saveSlots,
        [slotId]: { id: slotId, game, dismissedGuideIds: [], savedAt },
      },
      game,
      selectedRoomId: DEFAULT_GAME_RUNTIME.level(game).focusRoomId,
      ...CLEAN_TUTORIAL_UI,
      tutorialSessionRevision: state.tutorialSessionRevision + 1,
    }));
  },
  deleteSaveSlot: (slotId) => {
    dependencies.cancelSave(slotId);
    dependencies.clearSlot(slotId);
    set((state) => ({
      saveSlots: { ...state.saveSlots, [slotId]: null },
    }));
  },
  returnToMainMenu: () => {
    dependencies.flushSave();
    set({
      activeSlotId: null,
      saveSlots: dependencies.loadSlots(),
      ...CLEAN_TUTORIAL_UI,
    });
  },
  reset: () => {
    const slotId = get().activeSlotId;
    if (slotId) get().startNewGame(slotId);
  },
});

export const createGameStoreState = (
  dependencies: GameStoreDependencies = browserDependencies
): StateCreator<GameStore> => {
  const initialGame = DEFAULT_GAME_RUNTIME.createInitial();
  return (set, get) => ({
    initialized: false,
    activeSlotId: null,
    saveSlots: emptySaveSlotCatalog(),
    game: initialGame,
    selectedRoomId: DEFAULT_GAME_RUNTIME.level(initialGame).focusRoomId,
    ...CLEAN_TUTORIAL_UI,
    tutorialSessionRevision: 0,
    ...createLifecycleActions(set, get, dependencies),
    ...createGameSessionActions(set, get, dependencies),
    ...createUiActions(set, get, dependencies),
  });
};

export const useGameStore = create<GameStore>(createGameStoreState());
