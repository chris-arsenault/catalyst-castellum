import type { GameState, RoomId } from "../game/types";
import { acidLineGuideFor, acidLinePhaseActionReason } from "./acidLineGuide";
import type { TutorialAnchorId } from "./anchors";
import type { GuideConceptModel } from "./flashPointConcept";
import {
  flashPointGuideFor,
  flashPointPhaseActionReason,
  primeFlashIncident,
} from "./flashPointGuide";
import { makeReagentGuideFor, makeReagentPhaseActionReason } from "./makeReagentGuide";
import { kettleblackGuideFor, kettleblackPhaseActionReason } from "./kettleblackGuide";
import type { TutorialCopyKey } from "./copyTypes";

export type { TutorialCopyKey } from "./copyTypes";

export type { GuideConceptKind } from "./flashPointConcept";

export {
  assaultFlashIncident,
  furnaceAgitatorRunning,
  primeFlashIncident,
} from "./flashPointGuide";

export type GuideStepKind = "action" | "observe" | "complete";

/** UI-owned state a guided step may read; steps never mutate it. */
export interface GuideUiState {
  pipeMode: boolean;
}

export const IDLE_GUIDE_UI: GuideUiState = { pipeMode: false };

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

export const guideDefinitionFor = (
  game: GameState,
  registrations: GuideRegistry = GUIDE_REGISTRATIONS
): GuideDefinition | null => {
  const registration = registrations[game.campaign.levelId];
  return registration?.guideFor(game) ?? null;
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
    guideFor: (game) => makeReagentGuideFor(game) ?? acidLineGuideFor(game),
    phaseActionReason: (game, action) =>
      game.campaign.roundIndex < 2
        ? makeReagentPhaseActionReason(game, action)
        : acidLinePhaseActionReason(game, action),
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
  if (game.phase === "assault" && !primeFlashIncident(game)) {
    const coldAssaultIndex = guide.steps.findIndex((step) => step.id === "cold-assault");
    if (coldAssaultIndex >= 0) return coldAssaultIndex;
  }
  const index = guide.steps.findIndex((step) => !step.completed(game, ui));
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
