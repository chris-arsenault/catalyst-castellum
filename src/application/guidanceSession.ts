import { guideDefinitionFor, recordGuideEvidence } from "../tutorial/guideModel";
import type { GameStore, GameStoreDependencies, StoreSet } from "./storeTypes";
import type { TutorialSession } from "./saveSlots";

const guideUiFor = (state: GameStore) => ({
  pipeMode: state.pipeMode,
  towerBuildChassisId: state.towerBuildSelection?.chassisId ?? null,
  selectedTowerId: state.selectedTowerId,
});

export const tutorialSessionOf = (
  state: Pick<GameStore, "dismissedGuideIds" | "guidanceEnabled" | "guideEvidence">
): TutorialSession => ({
  dismissedGuideIds: state.dismissedGuideIds,
  guidanceEnabled: state.guidanceEnabled,
  guideEvidence: state.guideEvidence,
});

/** Observe transitions synchronously, including selections React may batch into one render. */
export const withGuideEvidence =
  (set: StoreSet, dependencies: GameStoreDependencies): StoreSet =>
  (partial) =>
    set((state) => {
      const changes = typeof partial === "function" ? partial(state) : partial;
      const next = { ...state, ...changes };
      const guide = guideDefinitionFor(next.game);
      if (
        !next.activeSlotId ||
        !next.guidanceEnabled ||
        !guide ||
        next.dismissedGuideIds.includes(guide.dismissalId) ||
        next.tutorialSessionRevision !== state.tutorialSessionRevision
      )
        return changes;
      const guideEvidence = recordGuideEvidence(next.game, guideUiFor(next), next.guideEvidence);
      if (guideEvidence === next.guideEvidence) return changes;
      // Game actions schedule their complete snapshot after this transition; UI-only evidence needs a save here.
      if (next.game === state.game) {
        dependencies.scheduleSave(
          next.activeSlotId,
          next.game,
          tutorialSessionOf({ ...next, guideEvidence })
        );
      }
      return { ...changes, guideEvidence };
    });
