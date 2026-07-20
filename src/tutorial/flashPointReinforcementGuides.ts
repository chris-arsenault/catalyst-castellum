import { TUTORIAL_ANCHORS } from "./anchors";
import {
  coreFurnaceFeedEnabled,
  furnaceAgitatorRunning,
  furnaceAgitatorUpgraded,
  levelResolved,
  roundResolved,
  secondChamberFlashHit,
  secondChamberFlashObserved,
  secondChamberRunning,
  secondFeedEnabled,
} from "./flashPointGuideState";
import type { GameState } from "../game/types";
import type { GuideDefinition } from "./guideModel";

const corridorReady = (game: GameState): boolean =>
  furnaceAgitatorRunning(game) && coreFurnaceFeedEnabled(game) && secondChamberRunning(game);

export const secondChamberGuide: GuideDefinition = {
  completion: {
    title: "tutorial.flash.secondChamber.completion.title",
    explanation: "tutorial.flash.secondChamber.completion.explanation",
    instruction: "tutorial.flash.secondChamber.completion.instruction",
  },
  id: "flash_point:second_chamber:v2",
  dismissalId: "flash_point:field_guidance:v5",
  label: "tutorial.flash.secondChamber.label",
  showStageIntro: false,
  gatesPhaseActions: true,
  firstFlashTeachingBreak: false,
  story: {
    kicker: "tutorial.flash.secondChamber.story.kicker",
    title: "tutorial.flash.secondChamber.story.title",
    paragraphs: [
      "tutorial.flash.secondChamber.story.paragraph.0",
      "tutorial.flash.secondChamber.story.paragraph.1",
    ],
    model: null,
  },
  mission: {
    title: "tutorial.flash.secondChamber.mission.title",
    summary: "tutorial.flash.secondChamber.mission.summary",
    tasks: [
      {
        id: "route-feed",
        label: "tutorial.flash.secondChamber.task.routeFeed",
        completed: secondFeedEnabled,
      },
      {
        id: "commission-chamber",
        label: "tutorial.flash.secondChamber.task.commissionChamber",
        completed: secondChamberRunning,
      },
      {
        id: "catch-forward",
        label: "tutorial.flash.secondChamber.task.catchForward",
        completed: secondChamberFlashHit,
      },
      {
        id: "hold-column",
        label: "tutorial.flash.secondChamber.task.holdColumn",
        completed: roundResolved,
      },
    ],
  },
  steps: [
    {
      id: "open-pipe-board",
      kind: "action",
      roomId: "core",
      target: TUTORIAL_ANCHORS.pipeModeToggle,
      title: "tutorial.flash.secondChamber.step.openPipeBoard.title",
      explanation: "tutorial.flash.secondChamber.step.openPipeBoard.explanation",
      instruction: "tutorial.flash.secondChamber.step.openPipeBoard.instruction",
      result: "tutorial.flash.secondChamber.step.openPipeBoard.result",
      completed: (game, ui) => ui.pipeMode || secondFeedEnabled(game),
    },
    {
      id: "route-second-feed",
      kind: "action",
      roomId: "core",
      target: TUTORIAL_ANCHORS.gameMap,
      title: "tutorial.flash.secondChamber.step.routeFeed.title",
      explanation: "tutorial.flash.secondChamber.step.routeFeed.explanation",
      instruction: "tutorial.flash.secondChamber.step.routeFeed.instruction",
      result: "tutorial.flash.secondChamber.step.routeFeed.result",
      completed: secondFeedEnabled,
    },
    {
      id: "commission-second-chamber",
      kind: "action",
      roomId: "gallery",
      target: TUTORIAL_ANCHORS.gameMap,
      title: "tutorial.flash.secondChamber.step.commissionChamber.title",
      explanation: "tutorial.flash.secondChamber.step.commissionChamber.explanation",
      instruction: "tutorial.flash.secondChamber.step.commissionChamber.instruction",
      result: "tutorial.flash.secondChamber.step.commissionChamber.result",
      completed: secondChamberRunning,
    },
    {
      id: "prime-corridor",
      kind: "action",
      roomId: "core",
      target: TUTORIAL_ANCHORS.beginPrime,
      title: "tutorial.flash.secondChamber.step.primeCorridor.title",
      explanation: "tutorial.flash.secondChamber.step.primeCorridor.explanation",
      instruction: "tutorial.flash.secondChamber.step.primeCorridor.instruction",
      result: "tutorial.flash.secondChamber.step.primeCorridor.result",
      completed: (game) => game.phase !== "build",
    },
    {
      id: "observe-second-flash",
      kind: "observe",
      roomId: "core",
      target: TUTORIAL_ANCHORS.gameMap,
      title: "tutorial.flash.secondChamber.step.observeSecondFlash.title",
      explanation: "tutorial.flash.secondChamber.step.observeSecondFlash.explanation",
      instruction: "tutorial.flash.secondChamber.step.observeSecondFlash.instruction",
      result: "tutorial.flash.secondChamber.step.observeSecondFlash.result",
      completed: secondChamberFlashObserved,
    },
    {
      id: "hold-corridor",
      kind: "observe",
      roomId: "core",
      target: TUTORIAL_ANCHORS.phaseBanner,
      title: "tutorial.flash.secondChamber.step.holdCorridor.title",
      explanation: "tutorial.flash.secondChamber.step.holdCorridor.explanation",
      instruction: "tutorial.flash.secondChamber.step.holdCorridor.instruction",
      result: "tutorial.flash.secondChamber.step.holdCorridor.result",
      completed: roundResolved,
    },
  ],
};

export const higherCadenceGuide: GuideDefinition = {
  completion: {
    title: "tutorial.flash.higherCadence.completion.title",
    explanation: "tutorial.flash.higherCadence.completion.explanation",
    instruction: "tutorial.flash.higherCadence.completion.instruction",
  },
  id: "flash_point:higher_cadence:v1",
  dismissalId: "flash_point:field_guidance:v5",
  label: "tutorial.flash.higherCadence.label",
  showStageIntro: false,
  gatesPhaseActions: true,
  firstFlashTeachingBreak: false,
  story: {
    kicker: "tutorial.flash.higherCadence.story.kicker",
    title: "tutorial.flash.higherCadence.story.title",
    paragraphs: [
      "tutorial.flash.higherCadence.story.paragraph.0",
      "tutorial.flash.higherCadence.story.paragraph.1",
    ],
    model: null,
  },
  mission: {
    title: "tutorial.flash.higherCadence.mission.title",
    summary: "tutorial.flash.higherCadence.mission.summary",
    tasks: [
      {
        id: "upgrade-agitator",
        label: "tutorial.flash.higherCadence.task.upgradeAgitator",
        completed: furnaceAgitatorUpgraded,
      },
      {
        id: "confirm-corridor",
        label: "tutorial.flash.higherCadence.task.confirmCorridor",
        completed: corridorReady,
      },
      {
        id: "hold-wave",
        label: "tutorial.flash.higherCadence.task.holdWave",
        completed: roundResolved,
      },
    ],
  },
  steps: [
    {
      id: "upgrade-agitator",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.furnaceAgitatorUpgrade,
      title: "tutorial.flash.higherCadence.step.upgradeAgitator.title",
      explanation: "tutorial.flash.higherCadence.step.upgradeAgitator.explanation",
      instruction: "tutorial.flash.higherCadence.step.upgradeAgitator.instruction",
      result: "tutorial.flash.higherCadence.step.upgradeAgitator.result",
      completed: furnaceAgitatorUpgraded,
    },
    {
      id: "run-cadence",
      kind: "observe",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.furnaceIncidents,
      title: "tutorial.flash.higherCadence.step.runCadence.title",
      explanation: "tutorial.flash.higherCadence.step.runCadence.explanation",
      instruction: "tutorial.flash.higherCadence.step.runCadence.instruction",
      result: "tutorial.flash.higherCadence.step.runCadence.result",
      completed: (game) => game.phase !== "build" && game.phase !== "prime",
    },
    {
      id: "hold-wave",
      kind: "observe",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.phaseBanner,
      title: "tutorial.flash.higherCadence.step.holdWave.title",
      explanation: "tutorial.flash.higherCadence.step.holdWave.explanation",
      instruction: "tutorial.flash.higherCadence.step.holdWave.instruction",
      result: "tutorial.flash.higherCadence.step.holdWave.result",
      completed: roundResolved,
    },
  ],
};

export const corridorExamGuide: GuideDefinition = {
  completion: {
    title: "tutorial.flash.corridorExam.completion.title",
    explanation: "tutorial.flash.corridorExam.completion.explanation",
    instruction: "tutorial.flash.corridorExam.completion.instruction",
  },
  id: "flash_point:corridor_exam:v1",
  dismissalId: "flash_point:field_guidance:v5",
  label: "tutorial.flash.corridorExam.label",
  showStageIntro: false,
  gatesPhaseActions: false,
  firstFlashTeachingBreak: false,
  story: {
    kicker: "tutorial.flash.corridorExam.story.kicker",
    title: "tutorial.flash.corridorExam.story.title",
    paragraphs: [
      "tutorial.flash.corridorExam.story.paragraph.0",
      "tutorial.flash.corridorExam.story.paragraph.1",
    ],
    model: null,
  },
  mission: {
    title: "tutorial.flash.corridorExam.mission.title",
    summary: "tutorial.flash.corridorExam.mission.summary",
    tasks: [
      {
        id: "both-chambers",
        label: "tutorial.flash.corridorExam.task.bothChambers",
        completed: corridorReady,
      },
      {
        id: "hold-exam",
        label: "tutorial.flash.corridorExam.task.holdExam",
        completed: levelResolved,
      },
    ],
  },
  steps: [
    {
      id: "arm-corridor",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.beginPrime,
      title: "tutorial.flash.corridorExam.step.armCorridor.title",
      explanation: "tutorial.flash.corridorExam.step.armCorridor.explanation",
      instruction: "tutorial.flash.corridorExam.step.armCorridor.instruction",
      result: "tutorial.flash.corridorExam.step.armCorridor.result",
      completed: (game) => game.phase !== "build",
    },
    {
      id: "hold-exam",
      kind: "observe",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.phaseBanner,
      title: "tutorial.flash.corridorExam.step.holdExam.title",
      explanation: "tutorial.flash.corridorExam.step.holdExam.explanation",
      instruction: "tutorial.flash.corridorExam.step.holdExam.instruction",
      result: "tutorial.flash.corridorExam.step.holdExam.result",
      completed: levelResolved,
    },
  ],
};
