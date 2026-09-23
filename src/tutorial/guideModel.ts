import type { GameState, RoomId } from "../game/types";
import type { TutorialAnchorId } from "./anchors";
import { kettleblackGuideFor, kettleblackPhaseActionReason } from "./kettleblackGuide";
import type { TutorialCopyKey } from "./copyTypes";
import {
  claimDefenseGuideFor,
  harkerDefenseGuideFor,
  twelveCaskDefenseGuideFor,
  towerDefensePhaseActionReason,
} from "./towerDefenseGuides";

export type { TutorialCopyKey } from "./copyTypes";

export type GuideStepKind = "action" | "observe" | "complete";

/** UI-owned state a guided step may read; steps never mutate it. */
export interface GuideUiState {
  pipeMode: boolean;
  towerBuildChassisId: GameState["encounter"]["availability"]["towers"][number] | null;
  selectedTowerId: string | null;
}

export const IDLE_GUIDE_UI: GuideUiState = {
  pipeMode: false,
  towerBuildChassisId: null,
  selectedTowerId: null,
};

/** Run-owned observations survive selection changes, retries, and save/load. */
export interface GuideProgress {
  steps: readonly string[];
  tasks: readonly string[];
}

export type GuideEvidence = Readonly<Record<string, GuideProgress>>;

export const EMPTY_GUIDE_EVIDENCE: GuideEvidence = {};
const EMPTY_GUIDE_PROGRESS: GuideProgress = { steps: [], tasks: [] };

export interface GuideStepDefinition {
  id: string;
  kind: GuideStepKind;
  roomId: RoomId;
  target: TutorialAnchorId;
  title: TutorialCopyKey;
  explanation: TutorialCopyKey;
  instruction: TutorialCopyKey;
  result: TutorialCopyKey;
  completed: (game: GameState, ui: GuideUiState) => boolean;
}

export interface GuideStoryDefinition {
  kicker: TutorialCopyKey;
  title: TutorialCopyKey;
  paragraphs: readonly TutorialCopyKey[];
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

export const guideDefinitionFor = (
  game: GameState,
  registrations: GuideRegistry = GUIDE_REGISTRATIONS
): GuideDefinition | null => {
  const registration = registrations[game.campaign.levelId];
  return registration?.guideFor(game) ?? null;
};

export interface GuideRegistration {
  guideFor: (game: GameState) => GuideDefinition | null;
  phaseActionReason?: (game: GameState, action: "start_assault") => TutorialCopyKey | null;
}

export type GuideRegistry = Partial<Record<GameState["campaign"]["levelId"], GuideRegistration>>;

/** Adding a guided level registers one provider; renderer and dispatch remain generic. */
export const GUIDE_REGISTRATIONS: GuideRegistry = {
  claim_8_delta: {
    guideFor: claimDefenseGuideFor,
    phaseActionReason: towerDefensePhaseActionReason,
  },
  harkers_brace: {
    guideFor: harkerDefenseGuideFor,
    phaseActionReason: towerDefensePhaseActionReason,
  },
  twelve_cask: {
    guideFor: twelveCaskDefenseGuideFor,
  },
  kettleblack: {
    guideFor: kettleblackGuideFor,
    phaseActionReason: kettleblackPhaseActionReason,
  },
};

export const guideStepIndexFor = (
  game: GameState,
  guide: GuideDefinition,
  ui: GuideUiState = IDLE_GUIDE_UI,
  evidence: GuideEvidence = EMPTY_GUIDE_EVIDENCE
): number => {
  const index = guide.steps.findIndex(
    (step) => !evidence[guide.id]?.steps.includes(step.id) && !step.completed(game, ui)
  );
  return index < 0 ? guide.steps.length : index;
};

export const guideTaskCompleted = (
  task: GuideTaskDefinition,
  guide: GuideDefinition,
  game: GameState,
  evidence: GuideEvidence
): boolean => evidence[guide.id]?.tasks.includes(task.id) === true || task.completed(game);

/** Accumulate observed facts; active defense requirements still use live command predicates. */
export const recordGuideEvidence = (
  game: GameState,
  ui: GuideUiState,
  evidence: GuideEvidence
): GuideEvidence => {
  const guide = guideDefinitionFor(game);
  if (
    !guide ||
    !(guideCanRun(game) || game.phase === "round_result" || game.phase === "level_complete")
  ) {
    return evidence;
  }
  const before = evidence[guide.id] ?? EMPTY_GUIDE_PROGRESS;
  const steps = [
    ...new Set([
      ...before.steps,
      ...guide.steps.filter((step) => step.completed(game, ui)).map((step) => step.id),
    ]),
  ];
  const tasks = [
    ...new Set([
      ...before.tasks,
      ...guide.mission.tasks.filter((task) => task.completed(game)).map((task) => task.id),
    ]),
  ];
  if (steps.length === before.steps.length && tasks.length === before.tasks.length) {
    return evidence;
  }
  return { ...evidence, [guide.id]: { steps, tasks } };
};

export const guidedPhaseActionReason = (
  game: GameState,
  action: "start_assault",
  dismissedGuideIds: string[]
): TutorialCopyKey | null => {
  const guide = guideDefinitionFor(game);
  if (!guide || dismissedGuideIds.includes(guide.dismissalId)) return null;
  if (!guide.gatesPhaseActions) return null;
  return GUIDE_REGISTRATIONS[game.campaign.levelId]?.phaseActionReason?.(game, action) ?? null;
};

export const guideCanRun = (game: GameState): boolean =>
  game.phase === "build" || game.phase === "assault";
