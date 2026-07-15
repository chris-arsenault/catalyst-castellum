import { gasAmountTotal, roomEquipmentIsActive } from "../game/queries";
import type { GameState } from "../game/types";
import { TUTORIAL_ANCHORS } from "./anchors";
import type { GuideDefinition, TutorialCopyKey } from "./guideModel";
import { MAKE_REAGENT_CONCEPT_MODEL } from "./makeReagentConcept";
import { gasConduitState, liquidConduitState, roomState } from "../game/world/instances";

const membraneCellInstalled = (game: GameState): boolean =>
  Object.values(roomState(game, "lower_intake").equipment).some(
    (instance) => instance?.equipmentId === "membrane_cell"
  );

const membraneCellRunning = (game: GameState): boolean =>
  roomEquipmentIsActive(roomState(game, "lower_intake"), "membrane_cell");

const liquidFeedEnabled = (game: GameState): boolean =>
  liquidConduitState(game, "core_cell").installed && liquidConduitState(game, "core_cell").enabled;

const coProductsEstablished = (game: GameState): boolean =>
  game.processes.chlor_alkali_cell.totalProcessed >= 0.05;

const recoveryEnabled = (game: GameState): boolean =>
  gasConduitState(game, "core_cell").installed && gasConduitState(game, "core_cell").enabled;

const recoveryFlowEstablished = (game: GameState): boolean => gasAmountTotal(game.gasVent) >= 0.05;

const firstRoundResolved = (game: GameState): boolean =>
  game.phase === "round_result" || game.campaign.roundIndex > 0;

const levelResolved = (game: GameState): boolean =>
  game.phase === "level_complete" || game.phase === "victory";

const coProductsGuide: GuideDefinition = {
  completion: {
    title: "tutorial.reagent.coProducts.completion.title",
    explanation: "tutorial.reagent.coProducts.completion.explanation",
    instruction: "tutorial.reagent.coProducts.completion.instruction",
  },
  id: "make_the_reagent:co_products:v1",
  dismissalId: "flash_point:field_guidance:v5",
  label: "tutorial.reagent.coProducts.label",
  firstFlashTeachingBreak: false,
  showStageIntro: true,
  gatesPhaseActions: true,
  story: {
    kicker: "tutorial.reagent.coProducts.story.kicker",
    title: "tutorial.reagent.coProducts.story.title",
    paragraphs: [
      "tutorial.reagent.coProducts.story.paragraph.0",
      "tutorial.reagent.coProducts.story.paragraph.1",
    ],
    model: MAKE_REAGENT_CONCEPT_MODEL,
  },
  mission: {
    title: "tutorial.reagent.coProducts.mission.title",
    summary: "tutorial.reagent.coProducts.mission.summary",
    tasks: [
      {
        id: "commission-cell",
        label: "tutorial.reagent.coProducts.task.commissionCell",
        completed: (game) => membraneCellInstalled(game) && membraneCellRunning(game),
      },
      {
        id: "feed-cell",
        label: "tutorial.reagent.coProducts.task.feedCell",
        completed: liquidFeedEnabled,
      },
      {
        id: "prove-products",
        label: "tutorial.reagent.coProducts.task.proveProducts",
        completed: coProductsEstablished,
      },
      {
        id: "hold-crossing",
        label: "tutorial.reagent.coProducts.task.holdCrossing",
        completed: firstRoundResolved,
      },
    ],
  },
  steps: [
    {
      id: "install-membrane-cell",
      kind: "action",
      roomId: "lower_intake",
      target: TUTORIAL_ANCHORS.lowerIntakeMembraneCell,
      title: "tutorial.reagent.coProducts.step.installCell.title",
      explanation: "tutorial.reagent.coProducts.step.installCell.explanation",
      instruction: "tutorial.reagent.coProducts.step.installCell.instruction",
      result: "tutorial.reagent.coProducts.step.installCell.result",
      completed: membraneCellRunning,
    },
    {
      id: "open-cell-feed",
      kind: "action",
      roomId: "lower_intake",
      target: TUTORIAL_ANCHORS.conduitCoreCellLiquid,
      title: "tutorial.reagent.coProducts.step.openFeed.title",
      explanation: "tutorial.reagent.coProducts.step.openFeed.explanation",
      instruction: "tutorial.reagent.coProducts.step.openFeed.instruction",
      result: "tutorial.reagent.coProducts.step.openFeed.result",
      completed: liquidFeedEnabled,
    },
    {
      id: "begin-reagent-prime",
      kind: "action",
      roomId: "lower_intake",
      target: TUTORIAL_ANCHORS.beginPrime,
      title: "tutorial.reagent.coProducts.step.beginPrime.title",
      explanation: "tutorial.reagent.coProducts.step.beginPrime.explanation",
      instruction: "tutorial.reagent.coProducts.step.beginPrime.instruction",
      result: "tutorial.reagent.coProducts.step.beginPrime.result",
      completed: (game) => game.phase !== "build",
    },
    {
      id: "accelerate-reagent-prime",
      kind: "action",
      roomId: "lower_intake",
      target: TUTORIAL_ANCHORS.simulationSpeed,
      title: "tutorial.reagent.coProducts.step.accelerate.title",
      explanation: "tutorial.reagent.coProducts.step.accelerate.explanation",
      instruction: "tutorial.reagent.coProducts.step.accelerate.instruction",
      result: "tutorial.reagent.coProducts.step.accelerate.result",
      completed: (game) => game.speed === 2 || (game.phase !== "build" && game.phase !== "prime"),
    },
    {
      id: "observe-cell-products",
      kind: "observe",
      roomId: "lower_intake",
      target: TUTORIAL_ANCHORS.lowerIntakeOutlets,
      title: "tutorial.reagent.coProducts.step.observeProducts.title",
      explanation: "tutorial.reagent.coProducts.step.observeProducts.explanation",
      instruction: "tutorial.reagent.coProducts.step.observeProducts.instruction",
      result: "tutorial.reagent.coProducts.step.observeProducts.result",
      completed: coProductsEstablished,
    },
    {
      id: "start-reagent-assault",
      kind: "action",
      roomId: "lower_intake",
      target: TUTORIAL_ANCHORS.startAssault,
      title: "tutorial.reagent.coProducts.step.startAssault.title",
      explanation: "tutorial.reagent.coProducts.step.startAssault.explanation",
      instruction: "tutorial.reagent.coProducts.step.startAssault.instruction",
      result: "tutorial.reagent.coProducts.step.startAssault.result",
      completed: (game) => game.phase === "assault" || firstRoundResolved(game),
    },
    {
      id: "observe-reagent-wave",
      kind: "observe",
      roomId: "lower_intake",
      target: TUTORIAL_ANCHORS.phaseBanner,
      title: "tutorial.reagent.coProducts.step.observeWave.title",
      explanation: "tutorial.reagent.coProducts.step.observeWave.explanation",
      instruction: "tutorial.reagent.coProducts.step.observeWave.instruction",
      result: "tutorial.reagent.coProducts.step.observeWave.result",
      completed: firstRoundResolved,
    },
  ],
};

const sharedReliefGuide: GuideDefinition = {
  completion: {
    title: "tutorial.reagent.sharedRelief.completion.title",
    explanation: "tutorial.reagent.sharedRelief.completion.explanation",
    instruction: "tutorial.reagent.sharedRelief.completion.instruction",
  },
  id: "make_the_reagent:shared_relief:v1",
  dismissalId: "flash_point:field_guidance:v5",
  label: "tutorial.reagent.sharedRelief.label",
  firstFlashTeachingBreak: false,
  showStageIntro: false,
  gatesPhaseActions: true,
  story: {
    kicker: "tutorial.reagent.sharedRelief.story.kicker",
    title: "tutorial.reagent.sharedRelief.story.title",
    paragraphs: [
      "tutorial.reagent.sharedRelief.story.paragraph.0",
      "tutorial.reagent.sharedRelief.story.paragraph.1",
    ],
    model: null,
  },
  mission: {
    title: "tutorial.reagent.sharedRelief.mission.title",
    summary: "tutorial.reagent.sharedRelief.mission.summary",
    tasks: [
      {
        id: "open-recovery",
        label: "tutorial.reagent.sharedRelief.task.openRecovery",
        completed: recoveryEnabled,
      },
      {
        id: "establish-recovery-flow",
        label: "tutorial.reagent.sharedRelief.task.establishFlow",
        completed: recoveryFlowEstablished,
      },
      {
        id: "sustain-cell",
        label: "tutorial.reagent.sharedRelief.task.sustainCell",
        completed: (game) => game.phase !== "build" && game.phase !== "prime",
      },
      {
        id: "hold-relief-wave",
        label: "tutorial.reagent.sharedRelief.task.holdWave",
        completed: levelResolved,
      },
    ],
  },
  steps: [
    {
      id: "open-core-recovery",
      kind: "action",
      roomId: "lower_intake",
      target: TUTORIAL_ANCHORS.conduitCoreCellGas,
      title: "tutorial.reagent.sharedRelief.step.openRecovery.title",
      explanation: "tutorial.reagent.sharedRelief.step.openRecovery.explanation",
      instruction: "tutorial.reagent.sharedRelief.step.openRecovery.instruction",
      result: "tutorial.reagent.sharedRelief.step.openRecovery.result",
      completed: recoveryEnabled,
    },
    {
      id: "begin-relief-prime",
      kind: "action",
      roomId: "lower_intake",
      target: TUTORIAL_ANCHORS.beginPrime,
      title: "tutorial.reagent.sharedRelief.step.beginPrime.title",
      explanation: "tutorial.reagent.sharedRelief.step.beginPrime.explanation",
      instruction: "tutorial.reagent.sharedRelief.step.beginPrime.instruction",
      result: "tutorial.reagent.sharedRelief.step.beginPrime.result",
      completed: (game) => game.phase !== "build",
    },
    {
      id: "observe-recovery-flow",
      kind: "observe",
      roomId: "lower_intake",
      target: TUTORIAL_ANCHORS.lowerIntakeOutlets,
      title: "tutorial.reagent.sharedRelief.step.observeFlow.title",
      explanation: "tutorial.reagent.sharedRelief.step.observeFlow.explanation",
      instruction: "tutorial.reagent.sharedRelief.step.observeFlow.instruction",
      result: "tutorial.reagent.sharedRelief.step.observeFlow.result",
      completed: recoveryFlowEstablished,
    },
    {
      id: "start-relief-assault",
      kind: "action",
      roomId: "lower_intake",
      target: TUTORIAL_ANCHORS.startAssault,
      title: "tutorial.reagent.sharedRelief.step.startAssault.title",
      explanation: "tutorial.reagent.sharedRelief.step.startAssault.explanation",
      instruction: "tutorial.reagent.sharedRelief.step.startAssault.instruction",
      result: "tutorial.reagent.sharedRelief.step.startAssault.result",
      completed: (game) => game.phase === "assault" || levelResolved(game),
    },
    {
      id: "observe-relief-wave",
      kind: "observe",
      roomId: "lower_intake",
      target: TUTORIAL_ANCHORS.phaseBanner,
      title: "tutorial.reagent.sharedRelief.step.observeWave.title",
      explanation: "tutorial.reagent.sharedRelief.step.observeWave.explanation",
      instruction: "tutorial.reagent.sharedRelief.step.observeWave.instruction",
      result: "tutorial.reagent.sharedRelief.step.observeWave.result",
      completed: levelResolved,
    },
  ],
};

export const makeReagentGuideFor = (game: GameState): GuideDefinition | null => {
  if (game.campaign.levelId !== "make_the_reagent") return null;
  if (game.campaign.roundIndex === 0) return coProductsGuide;
  if (game.campaign.roundIndex === 1) return sharedReliefGuide;
  return null;
};

export const makeReagentPhaseActionReason = (
  game: GameState,
  action: "start_prime" | "start_assault"
): TutorialCopyKey | null => {
  if (game.campaign.roundIndex === 0) {
    if (!membraneCellRunning(game)) return "tutorial.reagent.reason.cell";
    if (!liquidFeedEnabled(game)) return "tutorial.reagent.reason.feed";
    if (action === "start_assault" && !coProductsEstablished(game))
      return "tutorial.reagent.reason.production";
    return null;
  }
  if (!recoveryEnabled(game)) return "tutorial.reagent.reason.recovery";
  if (action === "start_assault" && !recoveryFlowEstablished(game))
    return "tutorial.reagent.reason.flow";
  return null;
};
