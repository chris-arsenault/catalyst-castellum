import { guideDefinitionFor } from "../tutorial/guideModel";
import type { GameStoreDependencies, StoreGet, StoreSet, UiSlice } from "./storeTypes";
import { tutorialSessionOf } from "./guidanceSession";

const graftModeUi = (graftMode: boolean) => ({
  graftMode,
  graftPreview: null,
  roomEffectPreview: null,
  ...(graftMode
    ? { pipeMode: false, pipePreview: null, towerBuildSelection: null, movingTowerId: null }
    : {}),
});

const createTowerActions = (
  set: StoreSet,
  get: StoreGet
): Pick<UiSlice, "setTowerBuildSelection" | "selectTower" | "setMovingTower"> => ({
  setTowerBuildSelection: (towerBuildSelection) =>
    set((state) => ({
      towerBuildSelection,
      selectedTowerId: null,
      pipeMode: false,
      pipePreview: null,
      graftMode: false,
      graftPreview: null,
      roomEffectPreview: null,
      movingTowerId:
        towerBuildSelection &&
        state.movingTowerId &&
        state.game.encounter.towers[state.movingTowerId]?.chassisId ===
          towerBuildSelection.chassisId
          ? state.movingTowerId
          : null,
    })),
  selectTower: (selectedTowerId) =>
    set({ selectedTowerId, towerBuildSelection: null, movingTowerId: null, notice: null }),
  setMovingTower: (movingTowerId) => {
    const tower = movingTowerId ? get().game.encounter.towers[movingTowerId] : null;
    set({
      movingTowerId: tower?.id ?? null,
      selectedTowerId: tower?.id ?? null,
      towerBuildSelection: tower
        ? {
            chassisId: tower.chassisId,
            mountFace: tower.placement.mountFace,
            orientation: tower.placement.orientation,
          }
        : null,
      pipeMode: false,
      pipePreview: null,
      graftMode: false,
      graftPreview: null,
    });
  },
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
      ...tutorialSessionOf(state),
      dismissedGuideIds,
    });
    set({ dismissedGuideIds });
  },
  restartTutorialGuide: () => {
    const state = get();
    const guide = guideDefinitionFor(state.game);
    if (!guide || !state.activeSlotId) return;
    const dismissedGuideIds = state.dismissedGuideIds.filter((id) => id !== guide.dismissalId);
    // Replay forgets observations for this guide; installed defenses remain live evidence.
    const guideEvidence = Object.fromEntries(
      Object.entries(state.guideEvidence).filter(([id]) => id !== guide.id)
    );
    dependencies.scheduleSave(state.activeSlotId, state.game, {
      ...tutorialSessionOf({ ...state, guideEvidence }),
      dismissedGuideIds,
    });
    set({
      dismissedGuideIds,
      guideEvidence,
      tutorialSessionRevision: state.tutorialSessionRevision + 1,
      selectedTowerId: null,
      towerBuildSelection: null,
      movingTowerId: null,
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
  | "setTowerBuildSelection"
  | "selectTower"
  | "setMovingTower"
  | "showNotice"
> => ({
  selectRoom: (selectedRoomId) => set({ selectedRoomId, notice: null }),
  setPipeMode: (pipeMode) =>
    set({
      pipeMode,
      pipePreview: null,
      roomEffectPreview: null,
      ...(pipeMode
        ? { graftMode: false, graftPreview: null, towerBuildSelection: null, movingTowerId: null }
        : {}),
    }),
  setPipePreview: (pipePreview) => set({ pipePreview }),
  setGraftMode: (graftMode) => set(graftModeUi(graftMode)),
  setGraftPreview: (graftPreview) => set({ graftPreview }),
  setRoomEffectPreview: (roomEffectPreview) => set({ roomEffectPreview }),
  ...createTowerActions(set, get),
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
