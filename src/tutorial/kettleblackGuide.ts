import { roomEquipmentIsActive } from "../game/queries";
import type { GameState } from "../game/types";
import { roomState } from "../game/world/instances";
import { TUTORIAL_ANCHORS } from "./anchors";
import type { GuideDefinition, GuideUiState, TutorialCopyKey } from "./guideModel";

const equipmentRunning = (game: GameState, equipmentId: "gas_agitator" | "thermal_coil") =>
  roomEquipmentIsActive(roomState(game, "furnace"), equipmentId);

const bedConditioned = (game: GameState): boolean =>
  equipmentRunning(game, "thermal_coil") && equipmentRunning(game, "gas_agitator");

const feedEnabled = (game: GameState): boolean =>
  game.gasConduits["gas:core__furnace"]?.enabled ?? false;

const reverseObserved = (game: GameState): boolean => {
  const reading = roomState(game, "furnace").reactions.water_gas_reaction;
  return reading.direction === "reverse" && reading.lastRate > 0.001;
};

const firstRoundResolved = (game: GameState): boolean =>
  game.phase === "round_result" || game.campaign.roundIndex > 0;

const guide: GuideDefinition = {
  completion: {
    title: "tutorial.kettleblack.completion.title",
    explanation: "tutorial.kettleblack.completion.explanation",
    instruction: "tutorial.kettleblack.completion.instruction",
  },
  id: "kettleblack:grain_markers:v1",
  dismissalId: "kettleblack:stationary_media:v1",
  label: "tutorial.kettleblack.label",
  firstFlashTeachingBreak: false,
  showStageIntro: true,
  gatesPhaseActions: true,
  story: {
    kicker: "tutorial.kettleblack.story.kicker",
    title: "tutorial.kettleblack.story.title",
    paragraphs: [
      "tutorial.kettleblack.story.paragraph.0",
      "tutorial.kettleblack.story.paragraph.1",
    ],
    model: null,
  },
  mission: {
    title: "tutorial.kettleblack.mission.title",
    summary: "tutorial.kettleblack.mission.summary",
    tasks: [
      {
        id: "route-feed",
        label: "tutorial.kettleblack.task.routeFeed",
        completed: feedEnabled,
      },
      {
        id: "condition-bed",
        label: "tutorial.kettleblack.task.conditionBed",
        completed: bedConditioned,
      },
      {
        id: "read-direction",
        label: "tutorial.kettleblack.task.readDirection",
        completed: reverseObserved,
      },
      {
        id: "hold-return",
        label: "tutorial.kettleblack.task.holdReturn",
        completed: firstRoundResolved,
      },
    ],
  },
  steps: [
    {
      id: "open-kettleblack-pipe-board",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.pipeModeToggle,
      title: "tutorial.kettleblack.step.openPipeBoard.title",
      explanation: "tutorial.kettleblack.step.openPipeBoard.explanation",
      instruction: "tutorial.kettleblack.step.openPipeBoard.instruction",
      result: "tutorial.kettleblack.step.openPipeBoard.result",
      completed: (_game, ui: GuideUiState) => ui.pipeMode,
    },
    {
      id: "route-kettleblack-feed",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.gameMap,
      title: "tutorial.kettleblack.step.routeFeed.title",
      explanation: "tutorial.kettleblack.step.routeFeed.explanation",
      instruction: "tutorial.kettleblack.step.routeFeed.instruction",
      result: "tutorial.kettleblack.step.routeFeed.result",
      completed: feedEnabled,
    },
    {
      id: "install-kettleblack-coil",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.furnaceThermalCoil,
      title: "tutorial.kettleblack.step.installCoil.title",
      explanation: "tutorial.kettleblack.step.installCoil.explanation",
      instruction: "tutorial.kettleblack.step.installCoil.instruction",
      result: "tutorial.kettleblack.step.installCoil.result",
      completed: (game) => equipmentRunning(game, "thermal_coil"),
    },
    {
      id: "install-kettleblack-agitator",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.furnaceAgitator,
      title: "tutorial.kettleblack.step.installAgitator.title",
      explanation: "tutorial.kettleblack.step.installAgitator.explanation",
      instruction: "tutorial.kettleblack.step.installAgitator.instruction",
      result: "tutorial.kettleblack.step.installAgitator.result",
      completed: (game) => equipmentRunning(game, "gas_agitator"),
    },
    {
      id: "begin-kettleblack-prime",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.beginPrime,
      title: "tutorial.kettleblack.step.beginPrime.title",
      explanation: "tutorial.kettleblack.step.beginPrime.explanation",
      instruction: "tutorial.kettleblack.step.beginPrime.instruction",
      result: "tutorial.kettleblack.step.beginPrime.result",
      completed: (game) => game.phase !== "build",
    },
    {
      id: "observe-kettleblack-direction",
      kind: "observe",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.furnaceReactionReadout,
      title: "tutorial.kettleblack.step.observeDirection.title",
      explanation: "tutorial.kettleblack.step.observeDirection.explanation",
      instruction: "tutorial.kettleblack.step.observeDirection.instruction",
      result: "tutorial.kettleblack.step.observeDirection.result",
      completed: reverseObserved,
    },
    {
      id: "start-kettleblack-assault",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.startAssault,
      title: "tutorial.kettleblack.step.startAssault.title",
      explanation: "tutorial.kettleblack.step.startAssault.explanation",
      instruction: "tutorial.kettleblack.step.startAssault.instruction",
      result: "tutorial.kettleblack.step.startAssault.result",
      completed: (game) => game.phase === "assault" || firstRoundResolved(game),
    },
  ],
};

export const kettleblackGuideFor = (game: GameState): GuideDefinition | null =>
  game.campaign.levelId === "kettleblack" && game.campaign.roundIndex === 0 ? guide : null;

export const kettleblackPhaseActionReason = (
  game: GameState,
  action: "start_prime" | "start_assault"
): TutorialCopyKey | null => {
  if (!feedEnabled(game)) return "tutorial.kettleblack.reason.feed";
  if (!equipmentRunning(game, "thermal_coil")) return "tutorial.kettleblack.reason.coil";
  if (!equipmentRunning(game, "gas_agitator")) return "tutorial.kettleblack.reason.agitator";
  if (action === "start_assault" && !reverseObserved(game))
    return "tutorial.kettleblack.reason.direction";
  return null;
};
