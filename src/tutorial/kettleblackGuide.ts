import type { GameState } from "../game/types";
import { TUTORIAL_ANCHORS } from "./anchors";
import type { GuideDefinition, TutorialCopyKey } from "./guideModel";

const hullTowers = (game: GameState) =>
  Object.values(game.towers).filter((tower) => tower.provenance === "hull");

const hullTowerPlaced = (game: GameState): boolean => hullTowers(game).length > 0;
const hullTowerUpgraded = (game: GameState): boolean =>
  hullTowers(game).some((tower) => tower.upgrades.length > 0);
const roundResolved = (game: GameState): boolean =>
  game.phase === "round_result" ||
  game.phase === "level_complete" ||
  game.phase === "victory" ||
  game.campaign.roundIndex > 0;

const guide: GuideDefinition = {
  id: "kettleblack:persistent_hull:v2",
  dismissalId: "kettleblack:graft_defense:v2",
  label: "tutorial.kettleblack.label",
  showStageIntro: true,
  gatesPhaseActions: true,
  completion: {
    title: "tutorial.kettleblack.completion.title",
    explanation: "tutorial.kettleblack.completion.explanation",
    instruction: "tutorial.kettleblack.completion.instruction",
  },
  story: {
    kicker: "tutorial.kettleblack.story.kicker",
    title: "tutorial.kettleblack.story.title",
    paragraphs: [
      "tutorial.kettleblack.story.paragraph.0",
      "tutorial.kettleblack.story.paragraph.1",
    ],
  },
  mission: {
    title: "tutorial.kettleblack.mission.title",
    summary: "tutorial.kettleblack.mission.summary",
    tasks: [
      {
        id: "mount-hull-defense",
        label: "tutorial.kettleblack.task.routeFeed",
        completed: hullTowerPlaced,
      },
      {
        id: "upgrade-hull-defense",
        label: "tutorial.kettleblack.task.conditionBed",
        completed: hullTowerUpgraded,
      },
      {
        id: "hold-return",
        label: "tutorial.kettleblack.task.holdReturn",
        completed: roundResolved,
      },
    ],
  },
  steps: [
    {
      id: "inspect-persistent-hull",
      kind: "observe",
      roomId: "washlock",
      target: TUTORIAL_ANCHORS.gameMap,
      title: "tutorial.kettleblack.step.openPipeBoard.title",
      explanation: "tutorial.kettleblack.step.openPipeBoard.explanation",
      instruction: "tutorial.kettleblack.step.openPipeBoard.instruction",
      result: "tutorial.kettleblack.step.openPipeBoard.result",
      completed: (game, ui) => ui.towerBuildChassisId !== null || hullTowerPlaced(game),
    },
    {
      id: "place-persistent-tower",
      kind: "action",
      roomId: "washlock",
      target: TUTORIAL_ANCHORS.gameMap,
      title: "tutorial.kettleblack.step.routeFeed.title",
      explanation: "tutorial.kettleblack.step.routeFeed.explanation",
      instruction: "tutorial.kettleblack.step.routeFeed.instruction",
      result: "tutorial.kettleblack.step.routeFeed.result",
      completed: hullTowerPlaced,
    },
    {
      id: "upgrade-persistent-tower",
      kind: "action",
      roomId: "washlock",
      target: TUTORIAL_ANCHORS.towerInspector,
      title: "tutorial.kettleblack.step.installCoil.title",
      explanation: "tutorial.kettleblack.step.installCoil.explanation",
      instruction: "tutorial.kettleblack.step.installCoil.instruction",
      result: "tutorial.kettleblack.step.installCoil.result",
      completed: hullTowerUpgraded,
    },
    {
      id: "start-kettleblack-assault",
      kind: "action",
      roomId: "washlock",
      target: TUTORIAL_ANCHORS.startAssault,
      title: "tutorial.kettleblack.step.startAssault.title",
      explanation: "tutorial.kettleblack.step.startAssault.explanation",
      instruction: "tutorial.kettleblack.step.startAssault.instruction",
      result: "tutorial.kettleblack.step.startAssault.result",
      completed: (game) => game.phase !== "build",
    },
  ],
};

export const kettleblackGuideFor = (game: GameState): GuideDefinition | null =>
  game.campaign.levelId === "kettleblack" && game.campaign.roundIndex === 0 ? guide : null;

export const kettleblackPhaseActionReason = (game: GameState): TutorialCopyKey | null => {
  if (!hullTowerPlaced(game)) return "tutorial.kettleblack.reason.feed";
  if (!hullTowerUpgraded(game)) return "tutorial.kettleblack.reason.coil";
  return null;
};
