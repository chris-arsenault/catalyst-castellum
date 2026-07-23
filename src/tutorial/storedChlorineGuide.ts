import type { GameState } from "../game/types";
import { roomState } from "../game/world/instances";
import { TUTORIAL_ANCHORS } from "./anchors";
import type { GuideDefinition, TutorialCopyKey } from "./guideModel";

const feedReopened = (game: GameState): boolean =>
  game.liquidConduits["liquid:core__lower_intake"]?.enabled ?? false;

const salvagedCellProducing = (game: GameState): boolean =>
  Object.values(roomState(game, "lower_intake").equipment).some(
    (instance) =>
      instance?.equipmentId === "membrane_cell" && (instance.operation?.totalProcessed ?? 0) >= 0.05
  );

const bankLineOpen = (game: GameState): boolean =>
  game.gasConduits["gas:lower_intake__reservoir"]?.enabled ?? false;

const storeCharged = (game: GameState): boolean =>
  roomState(game, "reservoir").liquid.sodium_hypochlorite >= 4;

const storeReleased = (game: GameState): boolean =>
  (game.liquidConduits["liquid:reservoir__washlock"]?.enabled ?? false) &&
  roomState(game, "washlock").liquid.sodium_hypochlorite >= 1;

const secondRoundResolved = (game: GameState): boolean =>
  game.campaign.roundIndex > 1 ||
  (game.campaign.roundIndex === 1 && game.phase === "round_result") ||
  game.phase === "level_complete" ||
  game.phase === "victory";

const guide: GuideDefinition = {
  completion: {
    title: "tutorial.cask.completion.title",
    explanation: "tutorial.cask.completion.explanation",
    instruction: "tutorial.cask.completion.instruction",
  },
  id: "stored_chlorine:banked_release:v1",
  dismissalId: "flash_point:field_guidance:v5",
  label: "tutorial.cask.label",
  firstFlashTeachingBreak: false,
  showStageIntro: true,
  gatesPhaseActions: false,
  story: {
    kicker: "tutorial.cask.story.kicker",
    title: "tutorial.cask.story.title",
    paragraphs: ["tutorial.cask.story.paragraph.0", "tutorial.cask.story.paragraph.1"],
    model: null,
  },
  mission: {
    title: "tutorial.cask.mission.title",
    summary: "tutorial.cask.mission.summary",
    tasks: [
      {
        id: "reopen-feed",
        label: "tutorial.cask.task.feed",
        completed: feedReopened,
      },
      {
        id: "bank-chlorine",
        label: "tutorial.cask.task.bank",
        completed: bankLineOpen,
      },
      {
        id: "charge-store",
        label: "tutorial.cask.task.charge",
        completed: storeCharged,
      },
      {
        id: "release-store",
        label: "tutorial.cask.task.release",
        completed: storeReleased,
      },
      {
        id: "hold-returns",
        label: "tutorial.cask.task.hold",
        completed: secondRoundResolved,
      },
    ],
  },
  steps: [
    {
      id: "reopen-salvaged-feed",
      kind: "action",
      roomId: "lower_intake",
      target: TUTORIAL_ANCHORS.gameMap,
      title: "tutorial.cask.step.reopenFeed.title",
      explanation: "tutorial.cask.step.reopenFeed.explanation",
      instruction: "tutorial.cask.step.reopenFeed.instruction",
      result: "tutorial.cask.step.reopenFeed.result",
      completed: feedReopened,
    },
    {
      id: "observe-salvaged-line",
      kind: "observe",
      roomId: "lower_intake",
      target: TUTORIAL_ANCHORS.lowerIntakeOutlets,
      title: "tutorial.cask.step.observeLine.title",
      explanation: "tutorial.cask.step.observeLine.explanation",
      instruction: "tutorial.cask.step.observeLine.instruction",
      result: "tutorial.cask.step.observeLine.result",
      completed: salvagedCellProducing,
    },
    {
      id: "open-bank-line",
      kind: "action",
      roomId: "reservoir",
      target: TUTORIAL_ANCHORS.gameMap,
      title: "tutorial.cask.step.openBank.title",
      explanation: "tutorial.cask.step.openBank.explanation",
      instruction: "tutorial.cask.step.openBank.instruction",
      result: "tutorial.cask.step.openBank.result",
      completed: bankLineOpen,
    },
    {
      id: "observe-store-charge",
      kind: "observe",
      roomId: "reservoir",
      target: TUTORIAL_ANCHORS.gameMap,
      title: "tutorial.cask.step.observeCharge.title",
      explanation: "tutorial.cask.step.observeCharge.explanation",
      instruction: "tutorial.cask.step.observeCharge.instruction",
      result: "tutorial.cask.step.observeCharge.result",
      completed: storeCharged,
    },
    {
      id: "release-into-cohort",
      kind: "action",
      roomId: "washlock",
      target: TUTORIAL_ANCHORS.gameMap,
      title: "tutorial.cask.step.release.title",
      explanation: "tutorial.cask.step.release.explanation",
      instruction: "tutorial.cask.step.release.instruction",
      result: "tutorial.cask.step.release.result",
      completed: storeReleased,
    },
    {
      id: "hold-cask-returns",
      kind: "observe",
      roomId: "washlock",
      target: TUTORIAL_ANCHORS.phaseBanner,
      title: "tutorial.cask.step.hold.title",
      explanation: "tutorial.cask.step.hold.explanation",
      instruction: "tutorial.cask.step.hold.instruction",
      result: "tutorial.cask.step.hold.result",
      completed: secondRoundResolved,
    },
  ],
};

export const storedChlorineGuideFor = (game: GameState): GuideDefinition | null =>
  game.campaign.levelId === "stored_chlorine" && game.campaign.roundIndex <= 1 ? guide : null;

export const storedChlorinePhaseActionReason = (
  _game: GameState,
  _action: "start_prime" | "start_assault"
): TutorialCopyKey | null => null;
