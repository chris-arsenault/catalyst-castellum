import { useCallback, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Joyride, type Options, type Step, type Styles } from "react-joyride";
import { useGameStore } from "../application/store";
import type { GameState } from "../game/types";
import {
  guideCanRun,
  guideDefinitionFor,
  guideStepIndexFor,
  primeFlashIncident,
  type GuideDefinition,
} from "./guideModel";
import { GuideTooltip } from "./GuideTooltip";
import { FirstFlashExplanation } from "./FirstFlashExplanation";
import { tutorialAnchorSelector } from "./anchors";
import { TutorialTaskCard } from "./TutorialTaskCard";
import { TutorialStageIntro } from "./TutorialStageIntro";

const TASK_SLOT = '[data-tutorial="task-slot"]';

const JOYRIDE_STYLES: Partial<Styles> = {
  floater: { filter: "drop-shadow(0 22px 45px rgba(0, 0, 0, 0.55))" },
};

const JOYRIDE_OPTIONS: Partial<Options> = {
  backgroundColor: "#19352b",
  buttons: [],
  disableFocusTrap: true,
  dismissKeyAction: false,
  hideOverlay: true,
  overlayClickAction: false,
  scrollDuration: 420,
  scrollOffset: 36,
  skipBeacon: true,
  targetWaitTimeout: 2500,
  textColor: "#d9ebde",
  width: 250,
  zIndex: 80,
};

const stepsFor = (guide: GuideDefinition): Step[] =>
  guide.steps.map((definition) => ({
    id: definition.id,
    target: tutorialAnchorSelector(definition.target),
    placement: "auto",
    title: definition.title,
    content: definition.explanation,
    data: { definition },
    blockTargetInteraction: false,
    floatingOptions: { hideArrow: false },
  }));

const stepIsSatisfied = (
  step: GuideDefinition["steps"][number] | null,
  game: Parameters<GuideDefinition["steps"][number]["completed"]>[0]
): boolean => Boolean(step && step.kind !== "complete" && step.completed(game));

const stageIntroShouldShow = (
  guide: GuideDefinition,
  game: GameState,
  guideDismissed: boolean,
  acknowledgedStageIntroIds: string[]
): boolean =>
  guide.showStageIntro &&
  !acknowledgedStageIntroIds.includes(guide.id) &&
  !guideDismissed &&
  game.phase === "build" &&
  guide.steps[0]?.completed(game) === false;

const guideShouldRun = (
  game: GameState,
  dismissed: boolean,
  showHelp: boolean,
  showStageIntro: boolean
): boolean => guideCanRun(game) && !dismissed && !showHelp && !showStageIntro;

const teachingBreakFor = (game: GameState, guide: GuideDefinition, run: boolean) => {
  if (!run || !guide.firstFlashTeachingBreak || game.phase !== "prime") return null;
  return primeFlashIncident(game);
};

interface TutorialPresentationProps {
  activeStep: GuideDefinition["steps"][number] | null;
  game: Parameters<GuideDefinition["steps"][number]["completed"]>[0];
  guide: GuideDefinition;
  onCloseTeachingBreak: () => void;
  onEnterStage: () => void;
  run: boolean;
  showTaskCard: boolean;
  showStageIntro: boolean;
  stepIndex: number;
  steps: Step[];
  teachingBreak: ReturnType<typeof primeFlashIncident>;
}

const TaskCardPortal = ({
  activeStep,
  guide,
  game,
}: {
  activeStep: GuideDefinition["steps"][number] | null;
  guide: GuideDefinition;
  game: GameState;
}) => {
  const slot = document.querySelector<HTMLElement>(TASK_SLOT);
  return slot
    ? createPortal(<TutorialTaskCard activeStep={activeStep} guide={guide} game={game} />, slot)
    : null;
};

const TutorialPresentation = ({
  activeStep,
  game,
  guide,
  onCloseTeachingBreak,
  onEnterStage,
  run,
  showTaskCard,
  showStageIntro,
  stepIndex,
  steps,
  teachingBreak,
}: TutorialPresentationProps) => (
  <>
    {showStageIntro && <TutorialStageIntro guide={guide} onEnter={onEnterStage} />}
    {showTaskCard && <TaskCardPortal activeStep={activeStep} guide={guide} game={game} />}
    {activeStep && (
      <Joyride
        run={run}
        steps={steps}
        stepIndex={stepIndex}
        scrollToFirstStep
        tooltipComponent={GuideTooltip}
        styles={JOYRIDE_STYLES}
        options={JOYRIDE_OPTIONS}
      />
    )}
    {teachingBreak && (
      <FirstFlashExplanation incident={teachingBreak} onClose={onCloseTeachingBreak} />
    )}
  </>
);

const ActiveGuidedTutorial = ({ guide }: { guide: GuideDefinition }) => {
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const showHelp = useGameStore((state) => state.showHelp);
  const dismissedGuideIds = useGameStore((state) => state.dismissedGuideIds);
  const acknowledgedStageIntroIds = useGameStore((state) => state.acknowledgedStageIntroIds);
  const acknowledgeStageIntro = useGameStore((state) => state.acknowledgeStageIntro);
  const stepIndex = guideStepIndexFor(game, guide);
  const steps = useMemo(() => stepsFor(guide), [guide]);
  const activeStep = guide.steps[stepIndex] ?? null;
  const dismissed = dismissedGuideIds.includes(guide.dismissalId);
  const showStageIntro = stageIntroShouldShow(guide, game, dismissed, acknowledgedStageIntroIds);
  const enterStage = useCallback(
    () => acknowledgeStageIntro(guide.id),
    [acknowledgeStageIntro, guide.id]
  );
  const run = guideShouldRun(game, dismissed, showHelp, showStageIntro);
  const showTaskCard =
    !dismissed &&
    !showHelp &&
    !showStageIntro &&
    (guideCanRun(game) || game.phase === "round_result" || game.phase === "level_complete");
  const satisfied = stepIsSatisfied(activeStep, game);
  const teachingBreak = teachingBreakFor(game, guide, run);

  useEffect(() => {
    if (teachingBreak && !game.paused) dispatch({ type: "set_pause", paused: true });
  }, [dispatch, game.paused, teachingBreak]);

  const closeTeachingBreak = useCallback(() => {
    dispatch({ type: "start_assault" });
  }, [dispatch]);

  useEffect(() => {
    if (!run || !activeStep || satisfied) return;
    const element = document.querySelector<HTMLElement>(tutorialAnchorSelector(activeStep.target));
    if (!element) return;
    element.classList.add("tutorial-active-target");
    return () => element.classList.remove("tutorial-active-target");
  }, [activeStep, run, satisfied]);

  if (!showTaskCard && !teachingBreak && !showStageIntro) return null;
  return (
    <TutorialPresentation
      activeStep={activeStep}
      game={game}
      guide={guide}
      onCloseTeachingBreak={closeTeachingBreak}
      onEnterStage={enterStage}
      run={run}
      showTaskCard={showTaskCard}
      showStageIntro={showStageIntro}
      stepIndex={stepIndex}
      steps={steps}
      teachingBreak={teachingBreak}
    />
  );
};

export const GuidedTutorial = () => {
  const game = useGameStore((state) => state.game);
  const tutorialSessionRevision = useGameStore((state) => state.tutorialSessionRevision);
  const guide = guideDefinitionFor(game);
  if (!guide) return null;
  return <ActiveGuidedTutorial key={`${guide.id}:${tutorialSessionRevision}`} guide={guide} />;
};
