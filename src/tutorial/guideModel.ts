import type { GameState, RoomId } from "../game/types";
import type { TutorialAnchorId } from "./anchors";
import { kettleblackGuideFor, kettleblackPhaseActionReason } from "./kettleblackGuide";
import type { TutorialCopyKey } from "./copyTypes";
import {
  claimDefenseGuideFor,
  harkerDefenseGuideFor,
  towerDefensePhaseActionReason,
} from "./towerDefenseGuides";

export type { TutorialCopyKey } from "./copyTypes";

export type GuideStepKind = "action" | "observe" | "complete";

/** UI-owned state a guided step may read; steps never mutate it. */
export interface GuideUiState {
  pipeMode: boolean;
  towerBuildChassisId: GameState["availability"]["towers"][number] | null;
  selectedTowerId: string | null;
}

export const IDLE_GUIDE_UI: GuideUiState = {
  pipeMode: false,
  towerBuildChassisId: null,
  selectedTowerId: null,
};

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
  kettleblack: {
    guideFor: kettleblackGuideFor,
    phaseActionReason: kettleblackPhaseActionReason,
  },
};

export const guideStepIndexFor = (
  game: GameState,
  guide: GuideDefinition,
  ui: GuideUiState = IDLE_GUIDE_UI
): number => {
  const index = guide.steps.findIndex((step) => !step.completed(game, ui));
  return index < 0 ? guide.steps.length : index;
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
