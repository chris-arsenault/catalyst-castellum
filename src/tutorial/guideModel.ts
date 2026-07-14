import { roomEquipmentIsActive } from "../game/queries";
import type { CombatIncident, GameState, RoomId } from "../game/types";
import { acidLineGuideFor, acidLinePhaseActionReason } from "./acidLineGuide";
import { TUTORIAL_ANCHORS, type TutorialAnchorId } from "./anchors";
import { FLASH_POINT_CONCEPT_MODEL, type GuideConceptModel } from "./flashPointConcept";
import { makeReagentGuideFor, makeReagentPhaseActionReason } from "./makeReagentGuide";
import type { TutorialCopyKey } from "./copyTypes";

export type { TutorialCopyKey } from "./copyTypes";

export type { GuideConceptKind } from "./flashPointConcept";

export type GuideStepKind = "action" | "observe" | "complete";

export interface GuideStepDefinition {
  id: string;
  kind: GuideStepKind;
  roomId: RoomId;
  target: TutorialAnchorId;
  title: TutorialCopyKey;
  explanation: TutorialCopyKey;
  instruction: TutorialCopyKey;
  result: TutorialCopyKey;
  completed: (game: GameState) => boolean;
}

export interface GuideStoryDefinition {
  kicker: TutorialCopyKey;
  title: TutorialCopyKey;
  paragraphs: readonly TutorialCopyKey[];
  model: GuideConceptModel | null;
}

export interface GuideTaskDefinition {
  id: string;
  label: TutorialCopyKey;
  completed: (game: GameState) => boolean;
}

export interface GuideDefinition {
  completion: {
    title: TutorialCopyKey;
    explanation: TutorialCopyKey;
    instruction: TutorialCopyKey;
  };
  id: string;
  dismissalId: string;
  firstFlashTeachingBreak: boolean;
  label: TutorialCopyKey;
  showStageIntro: boolean;
  gatesPhaseActions: boolean;
  story: GuideStoryDefinition;
  mission: {
    title: TutorialCopyKey;
    summary: TutorialCopyKey;
    tasks: readonly GuideTaskDefinition[];
  };
  steps: GuideStepDefinition[];
}

const hasFurnaceAgitator = (game: GameState): boolean =>
  Object.values(game.rooms.furnace.equipment).some(
    (instance) => instance?.equipmentId === "gas_agitator"
  );

export const furnaceAgitatorRunning = (game: GameState): boolean =>
  roomEquipmentIsActive(game.rooms.furnace, "gas_agitator");

const conduitEnabled = (game: GameState): boolean =>
  game.gasConduits.core_furnace.installed && game.gasConduits.core_furnace.enabled;

const flashIncident = (
  game: GameState,
  predicate: (incident: CombatIncident) => boolean
): CombatIncident | null =>
  game.incidents.find(
    (incident) => incident.sourceId === "hydrogen_oxygen_combustion" && predicate(incident)
  ) ?? null;

export const primeFlashIncident = (game: GameState): CombatIncident | null =>
  flashIncident(
    game,
    (incident) => incident.phase === "prime" && incident.round === game.campaign.roundIndex + 1
  );

export const assaultFlashIncident = (game: GameState): CombatIncident | null =>
  flashIncident(
    game,
    (incident) =>
      incident.phase === "assault" &&
      incident.round === game.campaign.roundIndex + 1 &&
      incident.targets.length > 0
  );

const assaultFlashKilled = (game: GameState): boolean =>
  Boolean(assaultFlashIncident(game)?.targets.some((target) => target.killed));

const flashPointGuide: GuideDefinition = {
  completion: {
    title: "tutorial.flash.firstSpark.completion.title",
    explanation: "tutorial.flash.firstSpark.completion.explanation",
    instruction: "tutorial.flash.firstSpark.completion.instruction",
  },
  id: "flash_point:first_spark:v5",
  dismissalId: "flash_point:field_guidance:v5",
  label: "tutorial.flash.firstSpark.label",
  showStageIntro: true,
  gatesPhaseActions: true,
  firstFlashTeachingBreak: true,
  story: {
    kicker: "tutorial.flash.firstSpark.story.kicker",
    title: "tutorial.flash.firstSpark.story.title",
    paragraphs: ["tutorial.flash.firstSpark.story.paragraph.0"],
    model: FLASH_POINT_CONCEPT_MODEL,
  },
  mission: {
    title: "tutorial.flash.firstSpark.mission.title",
    summary: "tutorial.flash.firstSpark.mission.summary",
    tasks: [
      {
        id: "mix-chamber",
        label: "tutorial.flash.firstSpark.task.mixChamber",
        completed: (game) => hasFurnaceAgitator(game) && furnaceAgitatorRunning(game),
      },
      {
        id: "feed-reactants",
        label: "tutorial.flash.firstSpark.task.feedReactants",
        completed: conduitEnabled,
      },
      {
        id: "prove-ignition",
        label: "tutorial.flash.firstSpark.task.proveIgnition",
        completed: (game) => Boolean(primeFlashIncident(game)),
      },
      {
        id: "catch-crawler",
        label: "tutorial.flash.firstSpark.task.catchCrawler",
        completed: assaultFlashKilled,
      },
    ],
  },
  steps: [
    {
      id: "install-agitator",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.furnaceAgitator,
      title: "tutorial.flash.firstSpark.step.installAgitator.title",
      explanation: "tutorial.flash.firstSpark.step.installAgitator.explanation",
      instruction: "tutorial.flash.firstSpark.step.installAgitator.instruction",
      result: "tutorial.flash.firstSpark.step.installAgitator.result",
      completed: hasFurnaceAgitator,
    },
    {
      id: "run-agitator",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.furnaceAgitatorToggle,
      title: "tutorial.flash.firstSpark.step.runAgitator.title",
      explanation: "tutorial.flash.firstSpark.step.runAgitator.explanation",
      instruction: "tutorial.flash.firstSpark.step.runAgitator.instruction",
      result: "tutorial.flash.firstSpark.step.runAgitator.result",
      completed: furnaceAgitatorRunning,
    },
    {
      id: "start-shared-duct",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.conduitCoreFurnaceGas,
      title: "tutorial.flash.firstSpark.step.startSharedDuct.title",
      explanation: "tutorial.flash.firstSpark.step.startSharedDuct.explanation",
      instruction: "tutorial.flash.firstSpark.step.startSharedDuct.instruction",
      result: "tutorial.flash.firstSpark.step.startSharedDuct.result",
      completed: conduitEnabled,
    },
    {
      id: "begin-prime",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.beginPrime,
      title: "tutorial.flash.firstSpark.step.beginPrime.title",
      explanation: "tutorial.flash.firstSpark.step.beginPrime.explanation",
      instruction: "tutorial.flash.firstSpark.step.beginPrime.instruction",
      result: "tutorial.flash.firstSpark.step.beginPrime.result",
      completed: (game) => game.phase !== "build",
    },
    {
      id: "accelerate-clock",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.simulationSpeed,
      title: "tutorial.flash.firstSpark.step.accelerateClock.title",
      explanation: "tutorial.flash.firstSpark.step.accelerateClock.explanation",
      instruction: "tutorial.flash.firstSpark.step.accelerateClock.instruction",
      result: "tutorial.flash.firstSpark.step.accelerateClock.result",
      completed: (game) => game.speed === 2,
    },
    {
      id: "observe-prime-flash",
      kind: "observe",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.furnaceIncidents,
      title: "tutorial.flash.firstSpark.step.observePrimeFlash.title",
      explanation: "tutorial.flash.firstSpark.step.observePrimeFlash.explanation",
      instruction: "tutorial.flash.firstSpark.step.observePrimeFlash.instruction",
      result: "tutorial.flash.firstSpark.step.observePrimeFlash.result",
      completed: (game) => Boolean(primeFlashIncident(game)),
    },
    {
      id: "cold-assault",
      kind: "observe",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.phaseBanner,
      title: "tutorial.flash.firstSpark.step.coldAssault.title",
      explanation: "tutorial.flash.firstSpark.step.coldAssault.explanation",
      instruction: "tutorial.flash.firstSpark.step.coldAssault.instruction",
      result: "tutorial.flash.firstSpark.step.coldAssault.result",
      completed: (game) => game.phase !== "assault" || Boolean(primeFlashIncident(game)),
    },
    {
      id: "start-assault",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.startAssault,
      title: "tutorial.flash.firstSpark.step.startAssault.title",
      explanation: "tutorial.flash.firstSpark.step.startAssault.explanation",
      instruction: "tutorial.flash.firstSpark.step.startAssault.instruction",
      result: "tutorial.flash.firstSpark.step.startAssault.result",
      completed: (game) => game.phase === "assault" || game.phase === "round_result",
    },
    {
      id: "observe-combat-flash",
      kind: "observe",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.furnaceIncidents,
      title: "tutorial.flash.firstSpark.step.observeCombatFlash.title",
      explanation: "tutorial.flash.firstSpark.step.observeCombatFlash.explanation",
      instruction: "tutorial.flash.firstSpark.step.observeCombatFlash.instruction",
      result: "tutorial.flash.firstSpark.step.observeCombatFlash.result",
      completed: assaultFlashKilled,
    },
  ],
};

const followupGuide: GuideDefinition = {
  completion: {
    title: "tutorial.flash.storedMomentum.completion.title",
    explanation: "tutorial.flash.storedMomentum.completion.explanation",
    instruction: "tutorial.flash.storedMomentum.completion.instruction",
  },
  id: "flash_point:stored_momentum:v1",
  dismissalId: "flash_point:field_guidance:v5",
  label: "tutorial.flash.storedMomentum.label",
  showStageIntro: false,
  gatesPhaseActions: false,
  firstFlashTeachingBreak: false,
  story: {
    kicker: "tutorial.flash.storedMomentum.story.kicker",
    title: "tutorial.flash.storedMomentum.story.title",
    paragraphs: [
      "tutorial.flash.storedMomentum.story.paragraph.0",
      "tutorial.flash.storedMomentum.story.paragraph.1",
    ],
    model: null,
  },
  mission: {
    title: "tutorial.flash.storedMomentum.mission.title",
    summary: "tutorial.flash.storedMomentum.mission.summary",
    tasks: [
      {
        id: "confirm-cycle",
        label: "tutorial.flash.storedMomentum.task.confirmCycle",
        completed: (game) => furnaceAgitatorRunning(game) && conduitEnabled(game),
      },
      {
        id: "start-short-prime",
        label: "tutorial.flash.storedMomentum.task.startShortPrime",
        completed: (game) => game.phase !== "build",
      },
      {
        id: "read-short-prime",
        label: "tutorial.flash.storedMomentum.task.readShortPrime",
        completed: (game) => game.phase !== "build" && game.phase !== "prime",
      },
      {
        id: "hold-followup",
        label: "tutorial.flash.storedMomentum.task.holdFollowup",
        completed: (game) => game.phase === "level_complete" || game.phase === "victory",
      },
    ],
  },
  steps: [
    {
      id: "prepare-followup",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.beginPrime,
      title: "tutorial.flash.storedMomentum.step.prepareFollowup.title",
      explanation: "tutorial.flash.storedMomentum.step.prepareFollowup.explanation",
      instruction: "tutorial.flash.storedMomentum.step.prepareFollowup.instruction",
      result: "tutorial.flash.storedMomentum.step.prepareFollowup.result",
      completed: (game) => game.phase !== "build",
    },
    {
      id: "observe-followup-prime",
      kind: "observe",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.furnaceIncidents,
      title: "tutorial.flash.storedMomentum.step.observeFollowupPrime.title",
      explanation: "tutorial.flash.storedMomentum.step.observeFollowupPrime.explanation",
      instruction: "tutorial.flash.storedMomentum.step.observeFollowupPrime.instruction",
      result: "tutorial.flash.storedMomentum.step.observeFollowupPrime.result",
      completed: (game) => game.phase !== "build" && game.phase !== "prime",
    },
    {
      id: "observe-followup-assault",
      kind: "observe",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.phaseBanner,
      title: "tutorial.flash.storedMomentum.step.observeFollowupAssault.title",
      explanation: "tutorial.flash.storedMomentum.step.observeFollowupAssault.explanation",
      instruction: "tutorial.flash.storedMomentum.step.observeFollowupAssault.instruction",
      result: "tutorial.flash.storedMomentum.step.observeFollowupAssault.result",
      completed: (game) => game.phase === "level_complete" || game.phase === "victory",
    },
  ],
};

export const guideDefinitionFor = (
  game: GameState,
  registrations: GuideRegistry = GUIDE_REGISTRATIONS
): GuideDefinition | null => {
  const registration = registrations[game.campaign.levelId];
  return registration?.guideFor(game) ?? null;
};

const flashPointGuideFor = (game: GameState): GuideDefinition | null => {
  if (game.campaign.roundIndex === 0) return flashPointGuide;
  if (game.campaign.roundIndex === 1) return followupGuide;
  return null;
};

const flashPointPhaseActionReason = (
  game: GameState,
  action: "start_prime" | "start_assault"
): TutorialCopyKey | null => {
  if (action === "start_prime") {
    if (!furnaceAgitatorRunning(game)) return "tutorial.flash.reason.agitator";
    if (!conduitEnabled(game)) return "tutorial.flash.reason.feed";
    return null;
  }
  return primeFlashIncident(game) ? null : "tutorial.flash.reason.flash";
};

export interface GuideRegistration {
  guideFor: (game: GameState) => GuideDefinition | null;
  phaseActionReason?: (
    game: GameState,
    action: "start_prime" | "start_assault"
  ) => TutorialCopyKey | null;
}

export type GuideRegistry = Partial<Record<GameState["campaign"]["levelId"], GuideRegistration>>;

/** Adding a guided level registers one provider; renderer and dispatch remain generic. */
export const GUIDE_REGISTRATIONS: GuideRegistry = {
  flash_point: { guideFor: flashPointGuideFor, phaseActionReason: flashPointPhaseActionReason },
  make_the_reagent: {
    guideFor: makeReagentGuideFor,
    phaseActionReason: makeReagentPhaseActionReason,
  },
  acid_line: { guideFor: acidLineGuideFor, phaseActionReason: acidLinePhaseActionReason },
};

export const guideStepIndexFor = (game: GameState, guide: GuideDefinition): number => {
  if (game.phase === "assault" && !primeFlashIncident(game)) {
    const coldAssaultIndex = guide.steps.findIndex((step) => step.id === "cold-assault");
    if (coldAssaultIndex >= 0) return coldAssaultIndex;
  }
  const index = guide.steps.findIndex((step) => !step.completed(game));
  return index < 0 ? guide.steps.length : index;
};

export const guidedPhaseActionReason = (
  game: GameState,
  action: "start_prime" | "start_assault",
  dismissedGuideIds: string[]
): TutorialCopyKey | null => {
  const guide = guideDefinitionFor(game);
  if (!guide || dismissedGuideIds.includes(guide.dismissalId)) return null;
  if (!guide.gatesPhaseActions) return null;
  return GUIDE_REGISTRATIONS[game.campaign.levelId]?.phaseActionReason?.(game, action) ?? null;
};

export const guideCanRun = (game: GameState): boolean =>
  game.phase === "build" || game.phase === "prime" || game.phase === "assault";
