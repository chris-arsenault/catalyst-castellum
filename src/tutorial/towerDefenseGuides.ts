import type { GameState } from "../game/types";
import { TUTORIAL_ANCHORS } from "./anchors";
import type { GuideDefinition, TutorialCopyKey } from "./guideModel";

const towers = (game: GameState) => Object.values(game.towers);
const wallTowerPlaced = (game: GameState): boolean =>
  towers(game).some(
    (tower) =>
      tower.placement.mountFace === "left_wall" || tower.placement.mountFace === "right_wall"
  );
const towerDamageRecorded = (game: GameState): boolean =>
  towers(game).some((tower) => tower.damageDealt > 0);
const towerUpgradeInstalled = (game: GameState): boolean =>
  towers(game).some((tower) => tower.upgrades.length > 0);
const roundResolved = (game: GameState): boolean =>
  game.phase === "round_result" ||
  game.phase === "level_complete" ||
  game.phase === "victory" ||
  game.campaign.roundIndex > 0;

const claimGuide: GuideDefinition = {
  id: "claim_8_delta:first_coverage:v1",
  dismissalId: "claim_8_delta:defense_guidance:v1",
  label: "tutorial.tower.claim.label",
  showStageIntro: true,
  gatesPhaseActions: true,
  completion: {
    title: "tutorial.tower.claim.completion.title",
    explanation: "tutorial.tower.claim.completion.explanation",
    instruction: "tutorial.tower.claim.completion.instruction",
  },
  story: {
    kicker: "tutorial.tower.claim.story.kicker",
    title: "tutorial.tower.claim.story.title",
    paragraphs: ["tutorial.tower.claim.story.paragraph.0"],
  },
  mission: {
    title: "tutorial.tower.claim.mission.title",
    summary: "tutorial.tower.claim.mission.summary",
    tasks: [
      {
        id: "mount-defense",
        label: "tutorial.tower.claim.task.mount",
        completed: wallTowerPlaced,
      },
      {
        id: "record-damage",
        label: "tutorial.tower.claim.task.damage",
        completed: towerDamageRecorded,
      },
      {
        id: "install-upgrade",
        label: "tutorial.tower.claim.task.upgrade",
        completed: towerUpgradeInstalled,
      },
      {
        id: "hold-wave",
        label: "tutorial.tower.claim.task.hold",
        completed: roundResolved,
      },
    ],
  },
  steps: [
    {
      id: "inspect-route",
      kind: "observe",
      roomId: "switchyard",
      target: TUTORIAL_ANCHORS.gameMap,
      title: "tutorial.tower.claim.step.route.title",
      explanation: "tutorial.tower.claim.step.route.explanation",
      instruction: "tutorial.tower.claim.step.route.instruction",
      result: "tutorial.tower.claim.step.route.result",
      completed: (game, ui) => ui.towerBuildChassisId !== null || towers(game).length > 0,
    },
    {
      id: "select-caster",
      kind: "action",
      roomId: "switchyard",
      target: TUTORIAL_ANCHORS.towerPalette,
      title: "tutorial.tower.claim.step.select.title",
      explanation: "tutorial.tower.claim.step.select.explanation",
      instruction: "tutorial.tower.claim.step.select.instruction",
      result: "tutorial.tower.claim.step.select.result",
      completed: (game, ui) =>
        ui.towerBuildChassisId === "bolt_caster" ||
        towers(game).some((tower) => tower.chassisId === "bolt_caster"),
    },
    {
      id: "mount-caster",
      kind: "action",
      roomId: "switchyard",
      target: TUTORIAL_ANCHORS.gameMap,
      title: "tutorial.tower.claim.step.mount.title",
      explanation: "tutorial.tower.claim.step.mount.explanation",
      instruction: "tutorial.tower.claim.step.mount.instruction",
      result: "tutorial.tower.claim.step.mount.result",
      completed: wallTowerPlaced,
    },
    {
      id: "inspect-coverage",
      kind: "observe",
      roomId: "switchyard",
      target: TUTORIAL_ANCHORS.towerInspector,
      title: "tutorial.tower.claim.step.coverage.title",
      explanation: "tutorial.tower.claim.step.coverage.explanation",
      instruction: "tutorial.tower.claim.step.coverage.instruction",
      result: "tutorial.tower.claim.step.coverage.result",
      completed: (game, ui) => Boolean(ui.selectedTowerId && game.towers[ui.selectedTowerId]),
    },
    {
      id: "start-assault",
      kind: "action",
      roomId: "switchyard",
      target: TUTORIAL_ANCHORS.startAssault,
      title: "tutorial.tower.claim.step.assault.title",
      explanation: "tutorial.tower.claim.step.assault.explanation",
      instruction: "tutorial.tower.claim.step.assault.instruction",
      result: "tutorial.tower.claim.step.assault.result",
      completed: (game) => game.phase !== "build",
    },
    {
      id: "observe-acquisition",
      kind: "observe",
      roomId: "switchyard",
      target: TUTORIAL_ANCHORS.gameMap,
      title: "tutorial.tower.claim.step.damage.title",
      explanation: "tutorial.tower.claim.step.damage.explanation",
      instruction: "tutorial.tower.claim.step.damage.instruction",
      result: "tutorial.tower.claim.step.damage.result",
      completed: towerDamageRecorded,
    },
    {
      id: "upgrade-caster",
      kind: "action",
      roomId: "switchyard",
      target: TUTORIAL_ANCHORS.towerInspector,
      title: "tutorial.tower.claim.step.upgrade.title",
      explanation: "tutorial.tower.claim.step.upgrade.explanation",
      instruction: "tutorial.tower.claim.step.upgrade.instruction",
      result: "tutorial.tower.claim.step.upgrade.result",
      completed: towerUpgradeInstalled,
    },
  ],
};

const projectors = (game: GameState) =>
  towers(game).filter((tower) => tower.chassisId === "line_projector");
const wallProjectorPlaced = (game: GameState): boolean =>
  projectors(game).some((tower) => tower.placement.mountFace !== "ceiling");
const ceilingProjectorPlaced = (game: GameState): boolean =>
  projectors(game).some((tower) => tower.placement.mountFace === "ceiling");
const routePrioritySet = (game: GameState): boolean =>
  projectors(game).some((tower) => tower.targetPolicy === "last");

const harkerGuide: GuideDefinition = {
  id: "harkers_brace:vertical_coverage:v1",
  dismissalId: "harkers_brace:defense_guidance:v1",
  label: "tutorial.tower.harker.label",
  showStageIntro: true,
  gatesPhaseActions: true,
  completion: {
    title: "tutorial.tower.harker.completion.title",
    explanation: "tutorial.tower.harker.completion.explanation",
    instruction: "tutorial.tower.harker.completion.instruction",
  },
  story: {
    kicker: "tutorial.tower.harker.story.kicker",
    title: "tutorial.tower.harker.story.title",
    paragraphs: ["tutorial.tower.harker.story.paragraph.0"],
  },
  mission: {
    title: "tutorial.tower.harker.mission.title",
    summary: "tutorial.tower.harker.mission.summary",
    tasks: [
      {
        id: "wall-projector",
        label: "tutorial.tower.harker.task.wall",
        completed: wallProjectorPlaced,
      },
      {
        id: "ceiling-projector",
        label: "tutorial.tower.harker.task.ceiling",
        completed: ceilingProjectorPlaced,
      },
      {
        id: "route-priority",
        label: "tutorial.tower.harker.task.priority",
        completed: routePrioritySet,
      },
      {
        id: "hold-wave",
        label: "tutorial.tower.harker.task.hold",
        completed: roundResolved,
      },
    ],
  },
  steps: [
    {
      id: "select-projector",
      kind: "action",
      roomId: "switchyard",
      target: TUTORIAL_ANCHORS.towerPalette,
      title: "tutorial.tower.harker.step.select.title",
      explanation: "tutorial.tower.harker.step.select.explanation",
      instruction: "tutorial.tower.harker.step.select.instruction",
      result: "tutorial.tower.harker.step.select.result",
      completed: (game, ui) =>
        ui.towerBuildChassisId === "line_projector" || projectors(game).length > 0,
    },
    {
      id: "mount-wall-projector",
      kind: "action",
      roomId: "switchyard",
      target: TUTORIAL_ANCHORS.gameMap,
      title: "tutorial.tower.harker.step.wall.title",
      explanation: "tutorial.tower.harker.step.wall.explanation",
      instruction: "tutorial.tower.harker.step.wall.instruction",
      result: "tutorial.tower.harker.step.wall.result",
      completed: wallProjectorPlaced,
    },
    {
      id: "mount-ceiling-projector",
      kind: "action",
      roomId: "switchyard",
      target: TUTORIAL_ANCHORS.towerPlacement,
      title: "tutorial.tower.harker.step.ceiling.title",
      explanation: "tutorial.tower.harker.step.ceiling.explanation",
      instruction: "tutorial.tower.harker.step.ceiling.instruction",
      result: "tutorial.tower.harker.step.ceiling.result",
      completed: ceilingProjectorPlaced,
    },
    {
      id: "set-route-priority",
      kind: "action",
      roomId: "switchyard",
      target: TUTORIAL_ANCHORS.towerInspector,
      title: "tutorial.tower.harker.step.priority.title",
      explanation: "tutorial.tower.harker.step.priority.explanation",
      instruction: "tutorial.tower.harker.step.priority.instruction",
      result: "tutorial.tower.harker.step.priority.result",
      completed: routePrioritySet,
    },
    {
      id: "start-vertical-assault",
      kind: "action",
      roomId: "switchyard",
      target: TUTORIAL_ANCHORS.startAssault,
      title: "tutorial.tower.harker.step.assault.title",
      explanation: "tutorial.tower.harker.step.assault.explanation",
      instruction: "tutorial.tower.harker.step.assault.instruction",
      result: "tutorial.tower.harker.step.assault.result",
      completed: (game) => game.phase !== "build",
    },
    {
      id: "observe-elevation",
      kind: "observe",
      roomId: "switchyard",
      target: TUTORIAL_ANCHORS.gameMap,
      title: "tutorial.tower.harker.step.damage.title",
      explanation: "tutorial.tower.harker.step.damage.explanation",
      instruction: "tutorial.tower.harker.step.damage.instruction",
      result: "tutorial.tower.harker.step.damage.result",
      completed: towerDamageRecorded,
    },
  ],
};

export const claimDefenseGuideFor = (game: GameState): GuideDefinition | null =>
  game.campaign.roundIndex === 0 ? claimGuide : null;

export const harkerDefenseGuideFor = (game: GameState): GuideDefinition | null =>
  game.campaign.roundIndex === 0 ? harkerGuide : null;

export const towerDefensePhaseActionReason = (
  game: GameState,
  _action: "start_assault"
): TutorialCopyKey | null => {
  if (game.campaign.levelId === "claim_8_delta" && !wallTowerPlaced(game))
    return "tutorial.tower.reason.wall";
  if (
    game.campaign.levelId === "harkers_brace" &&
    (!wallProjectorPlaced(game) || !ceilingProjectorPlaced(game))
  )
    return "tutorial.tower.reason.vertical";
  return null;
};
