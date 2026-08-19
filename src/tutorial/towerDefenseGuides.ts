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
      id: "select-flash-chamber",
      kind: "action",
      roomId: "switchyard",
      target: TUTORIAL_ANCHORS.towerPalette,
      title: "tutorial.tower.claim.step.select.title",
      explanation: "tutorial.tower.claim.step.select.explanation",
      instruction: "tutorial.tower.claim.step.select.instruction",
      result: "tutorial.tower.claim.step.select.result",
      completed: (game, ui) =>
        ui.towerBuildChassisId === "flash_chamber" ||
        towers(game).some((tower) => tower.chassisId === "flash_chamber"),
    },
    {
      id: "mount-flash-chamber",
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
      id: "upgrade-flash-chamber",
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

const carbonBurners = (game: GameState) =>
  towers(game).filter((tower) => tower.chassisId === "carbon_burner");
const wallBurnerPlaced = (game: GameState): boolean =>
  carbonBurners(game).some((tower) => tower.placement.mountFace !== "ceiling");
const ceilingBurnerPlaced = (game: GameState): boolean =>
  carbonBurners(game).some((tower) => tower.placement.mountFace === "ceiling");
const routePrioritySet = (game: GameState): boolean =>
  carbonBurners(game).some((tower) => tower.targetPolicy === "last");

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
        id: "wall-burner",
        label: "tutorial.tower.harker.task.wall",
        completed: wallBurnerPlaced,
      },
      {
        id: "ceiling-burner",
        label: "tutorial.tower.harker.task.ceiling",
        completed: ceilingBurnerPlaced,
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
      id: "select-carbon-burner",
      kind: "action",
      roomId: "switchyard",
      target: TUTORIAL_ANCHORS.towerPalette,
      title: "tutorial.tower.harker.step.select.title",
      explanation: "tutorial.tower.harker.step.select.explanation",
      instruction: "tutorial.tower.harker.step.select.instruction",
      result: "tutorial.tower.harker.step.select.result",
      completed: (game, ui) =>
        ui.towerBuildChassisId === "carbon_burner" || carbonBurners(game).length > 0,
    },
    {
      id: "mount-wall-burner",
      kind: "action",
      roomId: "switchyard",
      target: TUTORIAL_ANCHORS.gameMap,
      title: "tutorial.tower.harker.step.wall.title",
      explanation: "tutorial.tower.harker.step.wall.explanation",
      instruction: "tutorial.tower.harker.step.wall.instruction",
      result: "tutorial.tower.harker.step.wall.result",
      completed: wallBurnerPlaced,
    },
    {
      id: "mount-ceiling-burner",
      kind: "action",
      roomId: "switchyard",
      target: TUTORIAL_ANCHORS.towerPlacement,
      title: "tutorial.tower.harker.step.ceiling.title",
      explanation: "tutorial.tower.harker.step.ceiling.explanation",
      instruction: "tutorial.tower.harker.step.ceiling.instruction",
      result: "tutorial.tower.harker.step.ceiling.result",
      completed: ceilingBurnerPlaced,
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

const acidPotPlaced = (game: GameState): boolean =>
  towers(game).some((tower) => tower.chassisId === "acid_pot");
const causticJetPlaced = (game: GameState): boolean =>
  towers(game).some((tower) => tower.chassisId === "caustic_jet");
const neutralizationRecorded = (game: GameState): boolean =>
  game.stats.damageBySource.tower_neutralization > 0;

const twelveCaskGuide: GuideDefinition = {
  id: "twelve_cask:neutralization:v1",
  dismissalId: "twelve_cask:reaction_guidance:v1",
  label: "tutorial.tower.twelve.label",
  showStageIntro: true,
  gatesPhaseActions: false,
  completion: {
    title: "tutorial.tower.twelve.completion.title",
    explanation: "tutorial.tower.twelve.completion.explanation",
    instruction: "tutorial.tower.twelve.completion.instruction",
  },
  story: {
    kicker: "tutorial.tower.twelve.story.kicker",
    title: "tutorial.tower.twelve.story.title",
    paragraphs: ["tutorial.tower.twelve.story.paragraph.0"],
  },
  mission: {
    title: "tutorial.tower.twelve.mission.title",
    summary: "tutorial.tower.twelve.mission.summary",
    tasks: [
      {
        id: "mount-acid-pot",
        label: "tutorial.tower.twelve.task.acid",
        completed: acidPotPlaced,
      },
      {
        id: "mount-caustic-jet",
        label: "tutorial.tower.twelve.task.caustic",
        completed: causticJetPlaced,
      },
      {
        id: "record-neutralization",
        label: "tutorial.tower.twelve.task.reaction",
        completed: neutralizationRecorded,
      },
      {
        id: "hold-wave",
        label: "tutorial.tower.twelve.task.hold",
        completed: roundResolved,
      },
    ],
  },
  steps: [
    {
      id: "select-acid-pot",
      kind: "action",
      roomId: "switchyard",
      target: TUTORIAL_ANCHORS.towerPalette,
      title: "tutorial.tower.twelve.step.acidSelect.title",
      explanation: "tutorial.tower.twelve.step.acidSelect.explanation",
      instruction: "tutorial.tower.twelve.step.acidSelect.instruction",
      result: "tutorial.tower.twelve.step.acidSelect.result",
      completed: (game, ui) => ui.towerBuildChassisId === "acid_pot" || acidPotPlaced(game),
    },
    {
      id: "mount-acid-pot",
      kind: "action",
      roomId: "switchyard",
      target: TUTORIAL_ANCHORS.gameMap,
      title: "tutorial.tower.twelve.step.acidMount.title",
      explanation: "tutorial.tower.twelve.step.acidMount.explanation",
      instruction: "tutorial.tower.twelve.step.acidMount.instruction",
      result: "tutorial.tower.twelve.step.acidMount.result",
      completed: acidPotPlaced,
    },
    {
      id: "select-caustic-jet",
      kind: "action",
      roomId: "switchyard",
      target: TUTORIAL_ANCHORS.towerPalette,
      title: "tutorial.tower.twelve.step.causticSelect.title",
      explanation: "tutorial.tower.twelve.step.causticSelect.explanation",
      instruction: "tutorial.tower.twelve.step.causticSelect.instruction",
      result: "tutorial.tower.twelve.step.causticSelect.result",
      completed: (game, ui) => ui.towerBuildChassisId === "caustic_jet" || causticJetPlaced(game),
    },
    {
      id: "mount-caustic-jet",
      kind: "action",
      roomId: "switchyard",
      target: TUTORIAL_ANCHORS.gameMap,
      title: "tutorial.tower.twelve.step.causticMount.title",
      explanation: "tutorial.tower.twelve.step.causticMount.explanation",
      instruction: "tutorial.tower.twelve.step.causticMount.instruction",
      result: "tutorial.tower.twelve.step.causticMount.result",
      completed: causticJetPlaced,
    },
    {
      id: "start-reaction-assault",
      kind: "action",
      roomId: "switchyard",
      target: TUTORIAL_ANCHORS.startAssault,
      title: "tutorial.tower.twelve.step.assault.title",
      explanation: "tutorial.tower.twelve.step.assault.explanation",
      instruction: "tutorial.tower.twelve.step.assault.instruction",
      result: "tutorial.tower.twelve.step.assault.result",
      completed: (game) => game.phase !== "build",
    },
    {
      id: "observe-neutralization",
      kind: "observe",
      roomId: "switchyard",
      target: TUTORIAL_ANCHORS.gameMap,
      title: "tutorial.tower.twelve.step.reaction.title",
      explanation: "tutorial.tower.twelve.step.reaction.explanation",
      instruction: "tutorial.tower.twelve.step.reaction.instruction",
      result: "tutorial.tower.twelve.step.reaction.result",
      completed: neutralizationRecorded,
    },
  ],
};

export const claimDefenseGuideFor = (game: GameState): GuideDefinition | null =>
  game.campaign.roundIndex === 0 ? claimGuide : null;

export const harkerDefenseGuideFor = (game: GameState): GuideDefinition | null =>
  game.campaign.roundIndex === 0 ? harkerGuide : null;

export const twelveCaskDefenseGuideFor = (game: GameState): GuideDefinition | null =>
  game.campaign.roundIndex === 0 ? twelveCaskGuide : null;

export const towerDefensePhaseActionReason = (
  game: GameState,
  _action: "start_assault"
): TutorialCopyKey | null => {
  if (game.campaign.levelId === "claim_8_delta" && !wallTowerPlaced(game))
    return "tutorial.tower.reason.wall";
  if (
    game.campaign.levelId === "harkers_brace" &&
    (!wallBurnerPlaced(game) || !ceilingBurnerPlaced(game))
  )
    return "tutorial.tower.reason.vertical";
  return null;
};
