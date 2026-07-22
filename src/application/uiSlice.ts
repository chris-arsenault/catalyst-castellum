import { guideDefinitionFor } from "../tutorial/guideModel";
import type { GameStoreDependencies, StoreGet, StoreSet, UiSlice } from "./storeTypes";

const sessionOf = (state: { dismissedGuideIds: string[]; guidanceEnabled: boolean }) => ({
  dismissedGuideIds: state.dismissedGuideIds,
  guidanceEnabled: state.guidanceEnabled,
});

const graftModeUi = (graftMode: boolean) => ({
  graftMode,
  graftPreview: null,
  pipeMode: false,
  roomEffectPreview: null,
});

/** Per-guide dismissal and replay, which persist alongside the run's guidance choice. */
const createGuidanceActions = (
  set: StoreSet,
  get: StoreGet,
  dependencies: GameStoreDependencies
): Pick<UiSlice, "dismissTutorialGuide" | "restartTutorialGuide" | "acknowledgeStageIntro"> => ({
  dismissTutorialGuide: () => {
    const state = get();
    const guide = guideDefinitionFor(state.game);
    if (!guide || !state.activeSlotId) return;
    const dismissedGuideIds = [...new Set([...state.dismissedGuideIds, guide.dismissalId])];
    dependencies.scheduleSave(state.activeSlotId, state.game, {
      ...sessionOf(state),
      dismissedGuideIds,
    });
    set({ dismissedGuideIds });
  },
  restartTutorialGuide: () => {
    const state = get();
    const guide = guideDefinitionFor(state.game);
    if (!guide || !state.activeSlotId) return;
    const dismissedGuideIds = state.dismissedGuideIds.filter((id) => id !== guide.dismissalId);
    dependencies.scheduleSave(state.activeSlotId, state.game, {
      ...sessionOf(state),
      dismissedGuideIds,
    });
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
});

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
  | "acknowledgeStageIntro"
  | "dismissTutorialGuide"
  | "restartTutorialGuide"
  | "clearNotice"
  | "setPipeMode"
  | "setPipePreview"
  | "setGraftMode"
  | "setGraftPreview"
  | "setRoomEffectPreview"
  | "showNotice"
> => ({
  selectRoom: (selectedRoomId) => set({ selectedRoomId, notice: null }),
  setPipeMode: (pipeMode) =>
    set({ pipeMode, pipePreview: null, graftMode: false, roomEffectPreview: null }),
  setPipePreview: (pipePreview) => set({ pipePreview }),
  setGraftMode: (graftMode) => set(graftModeUi(graftMode)),
  setGraftPreview: (graftPreview) => set({ graftPreview }),
  setRoomEffectPreview: (roomEffectPreview) => set({ roomEffectPreview }),
  showNotice: (notice) => set({ notice }),
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
  ...createGuidanceActions(set, get, dependencies),
  clearNotice: () => set({ notice: null }),
});
