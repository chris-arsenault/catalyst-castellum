import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Joyride, type Options, type Step, type Styles } from "react-joyride";
import { useGameStore } from "../application/store";
import type { CombatIncident } from "../game/types";
import {
  guideCanRun,
  guideDefinitionFor,
  guideStepIndexFor,
  type GuideDefinition,
} from "./guideModel";
import { GuideTooltip } from "./GuideTooltip";
import { FirstFlashExplanation } from "./FirstFlashExplanation";
import { tutorialAnchorSelector } from "./anchors";

const COACH_ANCHOR = '[data-tutorial="coach-anchor"]';

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
  width: 365,
  zIndex: 80,
};

const stepsFor = (guide: GuideDefinition): Step[] =>
  guide.steps.map((definition) => ({
    id: definition.id,
    target: COACH_ANCHOR,
    scrollTarget: () =>
      document.querySelector<HTMLElement>(tutorialAnchorSelector(definition.target)),
    placement: "top-start",
    isFixed: true,
    title: definition.title,
    content: definition.explanation,
    data: { definition, guideLabel: guide.label },
    blockTargetInteraction: false,
    floatingOptions: { hideArrow: true },
  }));

const stepIsSatisfied = (
  step: GuideDefinition["steps"][number] | null,
  game: Parameters<GuideDefinition["steps"][number]["completed"]>[0]
): boolean => Boolean(step && step.kind !== "complete" && step.completed(game));

const ActiveGuidedTutorial = ({ guide }: { guide: GuideDefinition }) => {
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const showHelp = useGameStore((state) => state.showHelp);
  const dismissedGuideIds = useGameStore((state) => state.dismissedGuideIds);
  const stepIndex = guideStepIndexFor(game, guide);
  const pausedPrimeIncidentId = useRef<number | null>(null);
  const [teachingBreak, setTeachingBreak] = useState<{
    incident: CombatIncident;
    resumeOnClose: boolean;
  } | null>(null);
  const steps = useMemo(() => stepsFor(guide), [guide]);
  const activeStep = guide.steps[stepIndex] ?? null;
  const primeTeachingBreakArmed = useRef(activeStep?.id === "observe-prime-flash");
  const dismissed = dismissedGuideIds.includes(guide.id);
  const run = guideCanRun(game) && !dismissed && !showHelp;
  const satisfied = stepIsSatisfied(activeStep, game);

  useEffect(() => {
    if (activeStep?.id === "observe-prime-flash") primeTeachingBreakArmed.current = true;
  }, [activeStep?.id]);

  useEffect(() => {
    if (!run || game.phase !== "prime" || !primeTeachingBreakArmed.current) return;
    const incident = game.incidents.find(
      (entry) => entry.sourceId === "hydrogen_oxygen_combustion" && entry.phase === "prime"
    );
    if (!incident || pausedPrimeIncidentId.current === incident.id) return;
    primeTeachingBreakArmed.current = false;
    pausedPrimeIncidentId.current = incident.id;
    const resumeOnClose = !game.paused;
    if (resumeOnClose) dispatch({ type: "set_pause", paused: true });
    setTeachingBreak({ incident, resumeOnClose });
  }, [activeStep?.id, dispatch, game.incidents, game.paused, game.phase, run]);

  const closeTeachingBreak = useCallback(() => {
    if (teachingBreak?.resumeOnClose) dispatch({ type: "start_assault" });
    setTeachingBreak(null);
  }, [dispatch, teachingBreak]);

  useEffect(() => {
    if (!run || !activeStep || satisfied) return;
    const element = document.querySelector<HTMLElement>(tutorialAnchorSelector(activeStep.target));
    if (!element) return;
    element.classList.add("tutorial-active-target");
    return () => element.classList.remove("tutorial-active-target");
  }, [activeStep, run, satisfied]);

  if (!activeStep) return null;
  return (
    <>
      <Joyride
        run={run}
        steps={steps}
        stepIndex={stepIndex}
        scrollToFirstStep
        tooltipComponent={GuideTooltip}
        styles={JOYRIDE_STYLES}
        options={JOYRIDE_OPTIONS}
      />
      {teachingBreak && (
        <FirstFlashExplanation
          incident={teachingBreak.incident}
          resumeOnClose={teachingBreak.resumeOnClose}
          onClose={closeTeachingBreak}
        />
      )}
    </>
  );
};

export const GuidedTutorial = () => {
  const game = useGameStore((state) => state.game);
  const tutorialSessionRevision = useGameStore((state) => state.tutorialSessionRevision);
  const guide = guideDefinitionFor(game);
  if (!guide) return null;
  return <ActiveGuidedTutorial key={`${guide.id}:${tutorialSessionRevision}`} guide={guide} />;
};
