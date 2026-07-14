import { guideDefinitionFor } from "../tutorial/guideModel";
import type { GameStoreDependencies, StoreGet, StoreSet, UiSlice } from "./storeTypes";

export const createUiActions = (
  set: StoreSet,
  get: StoreGet,
  dependencies: GameStoreDependencies
): Pick<
  UiSlice,
  | "selectRoom"
  | "setShowHelp"
  | "openManual"
  | "openEquipmentBuild"
  | "setManualSection"
  | "closeManual"
  | "dismissTutorialGuide"
  | "restartTutorialGuide"
  | "acknowledgeStageIntro"
  | "clearNotice"
> => ({
  selectRoom: (selectedRoomId) => set({ selectedRoomId, notice: null }),
  setShowHelp: (showHelp) =>
    set({ showHelp, equipmentBuildTarget: showHelp ? get().equipmentBuildTarget : null }),
  openManual: (manualSection = "operations") =>
    set({ showHelp: true, manualSection, equipmentBuildTarget: null }),
  openEquipmentBuild: (roomId, socketId) =>
    set({
      showHelp: true,
      manualSection: "build",
      equipmentBuildTarget: { roomId, socketId },
    }),
  setManualSection: (manualSection) => set({ manualSection }),
  closeManual: () => set({ showHelp: false, equipmentBuildTarget: null }),
  dismissTutorialGuide: () => {
    const state = get();
    const guide = guideDefinitionFor(state.game);
    if (!guide || !state.activeSlotId) return;
    const dismissedGuideIds = [...new Set([...state.dismissedGuideIds, guide.dismissalId])];
    dependencies.scheduleSave(state.activeSlotId, state.game, dismissedGuideIds);
    set({ dismissedGuideIds });
  },
  restartTutorialGuide: () => {
    const state = get();
    const guide = guideDefinitionFor(state.game);
    if (!guide || !state.activeSlotId) return;
    const dismissedGuideIds = state.dismissedGuideIds.filter((id) => id !== guide.dismissalId);
    dependencies.scheduleSave(state.activeSlotId, state.game, dismissedGuideIds);
    set({
      dismissedGuideIds,
      tutorialSessionRevision: state.tutorialSessionRevision + 1,
      selectedRoomId: dependencies.runtime.level(state.game).focusRoomId,
      showHelp: false,
      equipmentBuildTarget: null,
      notice: null,
    });
  },
  acknowledgeStageIntro: (guideId) =>
    set((state) => ({
      acknowledgedStageIntroIds: [...new Set([...state.acknowledgedStageIntroIds, guideId])],
    })),
  clearNotice: () => set({ notice: null }),
});
