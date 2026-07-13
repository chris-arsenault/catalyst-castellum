import { DEFAULT_GAME_RUNTIME } from "../game/runtime";
import { guideDefinitionFor } from "../tutorial/guideModel";
import type { GameStoreDependencies, StoreGet, StoreSet, UiSlice } from "./storeTypes";

export const createUiActions = (
  set: StoreSet,
  get: StoreGet,
  dependencies: GameStoreDependencies
): Pick<
  UiSlice,
  "selectRoom" | "setShowHelp" | "dismissTutorialGuide" | "restartTutorialGuide" | "clearNotice"
> => ({
  selectRoom: (selectedRoomId) => set({ selectedRoomId, notice: null }),
  setShowHelp: (showHelp) => set({ showHelp }),
  dismissTutorialGuide: () => {
    const state = get();
    const guide = guideDefinitionFor(state.game);
    if (!guide || !state.activeSlotId) return;
    const dismissedGuideIds = [...new Set([...state.dismissedGuideIds, guide.id])];
    dependencies.scheduleSave(state.activeSlotId, state.game, dismissedGuideIds);
    set({ dismissedGuideIds });
  },
  restartTutorialGuide: () => {
    const state = get();
    const guide = guideDefinitionFor(state.game);
    if (!guide || !state.activeSlotId) return;
    const dismissedGuideIds = state.dismissedGuideIds.filter((id) => id !== guide.id);
    dependencies.scheduleSave(state.activeSlotId, state.game, dismissedGuideIds);
    set({
      dismissedGuideIds,
      tutorialSessionRevision: state.tutorialSessionRevision + 1,
      selectedRoomId: DEFAULT_GAME_RUNTIME.level(state.game).focusRoomId,
      showHelp: false,
      notice: null,
    });
  },
  clearNotice: () => set({ notice: null }),
});
