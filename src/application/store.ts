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
import { DEFAULT_GAME_PRESENTATION } from "../presentation/services";

export type { GameStore, GameStoreDependencies } from "./storeTypes";

const browserDependencies: GameStoreDependencies = {
  runtime: DEFAULT_GAME_RUNTIME,
  presentation: DEFAULT_GAME_PRESENTATION,
  loadSlots: loadSaveSlots,
  clearSlot: clearSaveSlot,
  scheduleSave: scheduleGameSave,
  cancelSave: cancelScheduledGameSave,
  flushSave: flushScheduledGameSave,
};

const CLEAN_TUTORIAL_UI = {
  acknowledgedStageIntroIds: [],
  dismissedGuideIds: [],
  guidanceEnabled: true,
  showHelp: false,
  manualSection: "operations" as const,
  equipmentBuildTarget: null,
  notice: null,
  pipeMode: false,
  pipePreview: null,
  graftMode: false,
  graftPreview: null,
  roomEffectPreview: null,
};

const replaceSlotWithLevel = (
  set: StoreSet,
  dependencies: GameStoreDependencies,
  slotId: Parameters<ApplicationLifecycleSlice["startNewGameAtLevel"]>[0],
  levelId: Parameters<ApplicationLifecycleSlice["startNewGameAtLevel"]>[1],
  guidanceEnabled: boolean
): void => {
  const levelIndex = dependencies.runtime.definition.levelOrder.indexOf(levelId);
  if (levelIndex < 0) throw new Error(`Cannot start a game at unknown level ${levelId}.`);
  const completedLevelIds = dependencies.runtime.definition.levelOrder.slice(0, levelIndex);
  dependencies.cancelSave(slotId);
  dependencies.clearSlot(slotId);
  const game = dependencies.runtime.createScenario(levelId, [...completedLevelIds]);
  const savedAt = Date.now();
  const session = { dismissedGuideIds: [], guidanceEnabled };
  dependencies.scheduleSave(slotId, game, session);
  set((state) => ({
    activeSlotId: slotId,
    saveSlots: {
      ...state.saveSlots,
      [slotId]: { id: slotId, game, savedAt, ...session },
    },
    game,
    selectedRoomId: dependencies.runtime.level(game).focusRoomId,
    ...CLEAN_TUTORIAL_UI,
    guidanceEnabled,
    tutorialSessionRevision: state.tutorialSessionRevision + 1,
  }));
};

const createLifecycleActions = (
  set: StoreSet,
  get: StoreGet,
  dependencies: GameStoreDependencies
): Pick<
  ApplicationLifecycleSlice,
  | "initialize"
  | "selectSaveSlot"
  | "startNewGame"
  | "startNewGameAtLevel"
  | "deleteSaveSlot"
  | "returnToMainMenu"
  | "reset"
> => {
  const startNewGameAtLevel: ApplicationLifecycleSlice["startNewGameAtLevel"] = (
    slotId,
    levelId,
    guidanceEnabled = get().guidanceEnabled
  ) => replaceSlotWithLevel(set, dependencies, slotId, levelId, guidanceEnabled);

  return {
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
        selectedRoomId: dependencies.runtime.level(record.game).focusRoomId,
        ...CLEAN_TUTORIAL_UI,
        dismissedGuideIds: record.dismissedGuideIds,
        guidanceEnabled: record.guidanceEnabled,
        tutorialSessionRevision: state.tutorialSessionRevision + 1,
      }));
    },
    startNewGame: (slotId, guidanceEnabled = get().guidanceEnabled) => {
      const firstLevelId = dependencies.runtime.definition.levelOrder[0];
      if (!firstLevelId) throw new Error("Cannot start a game from an empty campaign.");
      replaceSlotWithLevel(set, dependencies, slotId, firstLevelId, guidanceEnabled);
    },
    startNewGameAtLevel,
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
  };
};

export const createGameStoreState = (
  dependencies: GameStoreDependencies = browserDependencies
): StateCreator<GameStore> => {
  const initialGame = dependencies.runtime.createInitial();
  return (set, get) => ({
    initialized: false,
    activeSlotId: null,
    saveSlots: emptySaveSlotCatalog(),
    game: initialGame,
    selectedRoomId: dependencies.runtime.level(initialGame).focusRoomId,
    ...CLEAN_TUTORIAL_UI,
    tutorialSessionRevision: 0,
    ...createLifecycleActions(set, get, dependencies),
    ...createGameSessionActions(set, get, dependencies),
    ...createUiActions(set, get, dependencies),
  });
};

export const useGameStore = create<GameStore>(createGameStoreState());
