import { roomEquipmentIsActive } from "../game/queries";
import type { GameState, GasAmounts, RoomId } from "../game/types";
import { ACID_LINE_CONCEPT_MODEL } from "./acidLineConcept";
import { TUTORIAL_ANCHORS } from "./anchors";
import type { GuideDefinition, TutorialCopyKey } from "./guideModel";
import { gasConduitState, roomState } from "../game/world/instances";

const equipmentRunning = (game: GameState, equipmentId: "gas_agitator" | "thermal_coil"): boolean =>
  roomEquipmentIsActive(roomState(game, "furnace"), equipmentId);

const thermalCoilRunning = (game: GameState): boolean => equipmentRunning(game, "thermal_coil");
const agitatorRunning = (game: GameState): boolean => equipmentRunning(game, "gas_agitator");

const gasRunEnabled = (
  game: GameState,
  runId: "gas:furnace__lower_intake" | "gas:furnace__gallery" | "gas:gallery__washlock"
): boolean => gasConduitState(game, runId).installed && gasConduitState(game, runId).enabled;

const acidFeedEnabled = (game: GameState): boolean =>
  gasRunEnabled(game, "gas:furnace__lower_intake");
const firstReturnEnabled = (game: GameState): boolean =>
  gasRunEnabled(game, "gas:furnace__gallery");
const finalReturnEnabled = (game: GameState): boolean =>
  gasRunEnabled(game, "gas:gallery__washlock");

const returnLineEnabled = (game: GameState): boolean =>
  firstReturnEnabled(game) && finalReturnEnabled(game);

const fullAcidLineEnabled = (game: GameState): boolean =>
  acidFeedEnabled(game) && returnLineEnabled(game);

const acidEquipmentRunning = (game: GameState): boolean =>
  thermalCoilRunning(game) && agitatorRunning(game);

const hclProductionEstablished = (game: GameState): boolean =>
  game.events.some(
    (event) =>
      event.levelId === "acid_line" &&
      event.roomId === "furnace" &&
      event.code === "hcl_production_started"
  );

const hclAmount = (gas: GasAmounts): number => gas.hydrogen_chloride;

const roomHcl = (game: GameState, roomId: RoomId): number =>
  hclAmount(roomState(game, roomId).gas.lower) + hclAmount(roomState(game, roomId).gas.upper);

const downstreamHclEstablished = (game: GameState): boolean =>
  hclAmount(gasConduitState(game, "gas:furnace__gallery").gas) +
    roomHcl(game, "gallery") +
    hclAmount(gasConduitState(game, "gas:gallery__washlock").gas) +
    roomHcl(game, "washlock") >
  0.005;

const firstRoundResolved = (game: GameState): boolean =>
  game.phase === "round_result" || game.campaign.roundIndex > 0;

const levelResolved = (game: GameState): boolean =>
  game.phase === "level_complete" || game.phase === "victory";

const hotMixGuide: GuideDefinition = {
  completion: {
    title: "tutorial.acid.hotMix.completion.title",
    explanation: "tutorial.acid.hotMix.completion.explanation",
    instruction: "tutorial.acid.hotMix.completion.instruction",
  },
  id: "acid_line:hot_mix:v1",
  dismissalId: "flash_point:field_guidance:v5",
  label: "tutorial.acid.hotMix.label",
  firstFlashTeachingBreak: false,
  showStageIntro: true,
  gatesPhaseActions: true,
  story: {
    kicker: "tutorial.acid.hotMix.story.kicker",
    title: "tutorial.acid.hotMix.story.title",
    paragraphs: [
      "tutorial.acid.hotMix.story.paragraph.0",
      "tutorial.acid.hotMix.story.paragraph.1",
    ],
    model: ACID_LINE_CONCEPT_MODEL,
  },
  mission: {
    title: "tutorial.acid.hotMix.mission.title",
    summary: "tutorial.acid.hotMix.mission.summary",
    tasks: [
      {
        id: "condition-reactor",
        label: "tutorial.acid.hotMix.task.conditionReactor",
        completed: acidEquipmentRunning,
      },
      {
        id: "feed-reactants",
        label: "tutorial.acid.hotMix.task.feedReactants",
        completed: acidFeedEnabled,
      },
      {
        id: "complete-return",
        label: "tutorial.acid.hotMix.task.completeReturn",
        completed: returnLineEnabled,
      },
      {
        id: "produce-acid",
        label: "tutorial.acid.hotMix.task.produceAcid",
        completed: hclProductionEstablished,
      },
      {
        id: "hold-hot-mix",
        label: "tutorial.acid.hotMix.task.holdWave",
        completed: firstRoundResolved,
      },
    ],
  },
  steps: [
    {
      id: "install-thermal-coil",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.furnaceThermalCoil,
      title: "tutorial.acid.hotMix.step.installCoil.title",
      explanation: "tutorial.acid.hotMix.step.installCoil.explanation",
      instruction: "tutorial.acid.hotMix.step.installCoil.instruction",
      result: "tutorial.acid.hotMix.step.installCoil.result",
      completed: thermalCoilRunning,
    },
    {
      id: "install-acid-agitator",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.furnaceAgitator,
      title: "tutorial.acid.hotMix.step.installAgitator.title",
      explanation: "tutorial.acid.hotMix.step.installAgitator.explanation",
      instruction: "tutorial.acid.hotMix.step.installAgitator.instruction",
      result: "tutorial.acid.hotMix.step.installAgitator.result",
      completed: agitatorRunning,
    },
    {
      id: "open-acid-feed",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.conduitCellFurnaceGas,
      title: "tutorial.acid.hotMix.step.openFeed.title",
      explanation: "tutorial.acid.hotMix.step.openFeed.explanation",
      instruction: "tutorial.acid.hotMix.step.openFeed.instruction",
      result: "tutorial.acid.hotMix.step.openFeed.result",
      completed: acidFeedEnabled,
    },
    {
      id: "open-first-return",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.conduitFurnaceReturnGas,
      title: "tutorial.acid.hotMix.step.openFirstReturn.title",
      explanation: "tutorial.acid.hotMix.step.openFirstReturn.explanation",
      instruction: "tutorial.acid.hotMix.step.openFirstReturn.instruction",
      result: "tutorial.acid.hotMix.step.openFirstReturn.result",
      completed: firstReturnEnabled,
    },
    {
      id: "open-final-return",
      kind: "action",
      roomId: "gallery",
      target: TUTORIAL_ANCHORS.conduitReturnFinalGas,
      title: "tutorial.acid.hotMix.step.openFinalReturn.title",
      explanation: "tutorial.acid.hotMix.step.openFinalReturn.explanation",
      instruction: "tutorial.acid.hotMix.step.openFinalReturn.instruction",
      result: "tutorial.acid.hotMix.step.openFinalReturn.result",
      completed: finalReturnEnabled,
    },
    {
      id: "begin-acid-prime",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.beginPrime,
      title: "tutorial.acid.hotMix.step.beginPrime.title",
      explanation: "tutorial.acid.hotMix.step.beginPrime.explanation",
      instruction: "tutorial.acid.hotMix.step.beginPrime.instruction",
      result: "tutorial.acid.hotMix.step.beginPrime.result",
      completed: (game) => game.phase !== "build",
    },
    {
      id: "accelerate-acid-prime",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.simulationSpeed,
      title: "tutorial.acid.hotMix.step.accelerate.title",
      explanation: "tutorial.acid.hotMix.step.accelerate.explanation",
      instruction: "tutorial.acid.hotMix.step.accelerate.instruction",
      result: "tutorial.acid.hotMix.step.accelerate.result",
      completed: (game) => game.speed === 2 || (game.phase !== "build" && game.phase !== "prime"),
    },
    {
      id: "observe-acid-production",
      kind: "observe",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.furnaceReactionReadout,
      title: "tutorial.acid.hotMix.step.observeProduction.title",
      explanation: "tutorial.acid.hotMix.step.observeProduction.explanation",
      instruction: "tutorial.acid.hotMix.step.observeProduction.instruction",
      result: "tutorial.acid.hotMix.step.observeProduction.result",
      completed: hclProductionEstablished,
    },
    {
      id: "start-hot-mix-assault",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.startAssault,
      title: "tutorial.acid.hotMix.step.startAssault.title",
      explanation: "tutorial.acid.hotMix.step.startAssault.explanation",
      instruction: "tutorial.acid.hotMix.step.startAssault.instruction",
      result: "tutorial.acid.hotMix.step.startAssault.result",
      completed: (game) => game.phase === "assault" || firstRoundResolved(game),
    },
    {
      id: "observe-hot-mix-wave",
      kind: "observe",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.phaseBanner,
      title: "tutorial.acid.hotMix.step.observeWave.title",
      explanation: "tutorial.acid.hotMix.step.observeWave.explanation",
      instruction: "tutorial.acid.hotMix.step.observeWave.instruction",
      result: "tutorial.acid.hotMix.step.observeWave.result",
      completed: firstRoundResolved,
    },
  ],
};

const residenceTimeGuide: GuideDefinition = {
  completion: {
    title: "tutorial.acid.residence.completion.title",
    explanation: "tutorial.acid.residence.completion.explanation",
    instruction: "tutorial.acid.residence.completion.instruction",
  },
  id: "acid_line:residence_time:v1",
  dismissalId: "flash_point:field_guidance:v5",
  label: "tutorial.acid.residence.label",
  firstFlashTeachingBreak: false,
  showStageIntro: false,
  gatesPhaseActions: false,
  story: {
    kicker: "tutorial.acid.residence.story.kicker",
    title: "tutorial.acid.residence.story.title",
    paragraphs: [
      "tutorial.acid.residence.story.paragraph.0",
      "tutorial.acid.residence.story.paragraph.1",
    ],
    model: null,
  },
  mission: {
    title: "tutorial.acid.residence.mission.title",
    summary: "tutorial.acid.residence.mission.summary",
    tasks: [
      {
        id: "confirm-acid-line",
        label: "tutorial.acid.residence.task.confirmLine",
        completed: (game) => acidEquipmentRunning(game) && fullAcidLineEnabled(game),
      },
      {
        id: "start-residence-prime",
        label: "tutorial.acid.residence.task.startPrime",
        completed: (game) => game.phase !== "build",
      },
      {
        id: "carry-downstream-acid",
        label: "tutorial.acid.residence.task.carryAcid",
        completed: (game) => downstreamHclEstablished(game) && game.phase !== "build",
      },
      {
        id: "hold-residence-wave",
        label: "tutorial.acid.residence.task.holdWave",
        completed: levelResolved,
      },
    ],
  },
  steps: [
    {
      id: "prepare-residence-time",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.beginPrime,
      title: "tutorial.acid.residence.step.prepare.title",
      explanation: "tutorial.acid.residence.step.prepare.explanation",
      instruction: "tutorial.acid.residence.step.prepare.instruction",
      result: "tutorial.acid.residence.step.prepare.result",
      completed: (game) => game.phase !== "build",
    },
    {
      id: "observe-residence-prime",
      kind: "observe",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.furnaceReactionReadout,
      title: "tutorial.acid.residence.step.observePrime.title",
      explanation: "tutorial.acid.residence.step.observePrime.explanation",
      instruction: "tutorial.acid.residence.step.observePrime.instruction",
      result: "tutorial.acid.residence.step.observePrime.result",
      completed: (game) => game.phase !== "build" && game.phase !== "prime",
    },
    {
      id: "observe-residence-assault",
      kind: "observe",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.phaseBanner,
      title: "tutorial.acid.residence.step.observeAssault.title",
      explanation: "tutorial.acid.residence.step.observeAssault.explanation",
      instruction: "tutorial.acid.residence.step.observeAssault.instruction",
      result: "tutorial.acid.residence.step.observeAssault.result",
      completed: levelResolved,
    },
  ],
};

export const acidLineGuideFor = (game: GameState): GuideDefinition | null => {
  if (game.campaign.levelId !== "acid_line") return null;
  if (game.campaign.roundIndex === 0) return hotMixGuide;
  if (game.campaign.roundIndex === 1) return residenceTimeGuide;
  return null;
};

export const acidLinePhaseActionReason = (
  game: GameState,
  action: "start_prime" | "start_assault"
): TutorialCopyKey | null => {
  if (!thermalCoilRunning(game)) return "tutorial.acid.reason.coil";
  if (!agitatorRunning(game)) return "tutorial.acid.reason.agitator";
  if (!acidFeedEnabled(game)) return "tutorial.acid.reason.feed";
  if (!firstReturnEnabled(game)) return "tutorial.acid.reason.firstReturn";
  if (!finalReturnEnabled(game)) return "tutorial.acid.reason.finalReturn";
  if (action === "start_assault" && !hclProductionEstablished(game))
    return "tutorial.acid.reason.production";
  return null;
};
