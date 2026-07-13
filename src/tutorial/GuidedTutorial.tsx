import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Joyride, type Options, type Step, type Styles } from "react-joyride";
import { useGameStore } from "../game/store";
import {
  guideCanRun,
  guideDefinitionFor,
  guideStepIndexFor,
  type GuideDefinition,
} from "./guideModel";
import { GuideTooltip } from "./GuideTooltip";
import { GuideAdvanceContext } from "./guideUiContext";

const COACH_ANCHOR = '[data-tutorial="coach-anchor"]';

const JOYRIDE_STYLES: Partial<Styles> = {
  floater: { filter: "drop-shadow(0 22px 45px rgba(0, 0, 0, 0.55))" },
};

const JOYRIDE_OPTIONS: Partial<Options> = {
  backgroundColor: "#1a2b25",
  buttons: [],
  disableFocusTrap: true,
  dismissKeyAction: false,
  hideOverlay: true,
  overlayClickAction: false,
  scrollDuration: 420,
  scrollOffset: 36,
  skipBeacon: true,
  targetWaitTimeout: 2500,
  textColor: "#dce8df",
  width: 365,
  zIndex: 80,
};

const stepsFor = (guide: GuideDefinition): Step[] =>
  guide.steps.map((definition) => ({
    id: definition.id,
    target: COACH_ANCHOR,
    scrollTarget: () => document.querySelector<HTMLElement>(definition.target),
    placement: "top-start",
    isFixed: true,
    title: definition.title,
    content: definition.explanation,
    data: { definition, guideLabel: guide.label },
    blockTargetInteraction: false,
    floatingOptions: { hideArrow: true },
  }));

const ActiveGuidedTutorial = ({ guide }: { guide: GuideDefinition }) => {
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const showHelp = useGameStore((state) => state.showHelp);
  const dismissedGuideIds = useGameStore((state) => state.dismissedGuideIds);
  const [stepIndex, setStepIndex] = useState(() => guideStepIndexFor(game, guide));
  const pausedPrimeIncidentId = useRef<number | null>(null);
  const pausedIncidentId = useRef<number | null>(null);
  const steps = useMemo(() => stepsFor(guide), [guide]);
  const activeStep = guide.steps[stepIndex] ?? null;
  const dismissed = dismissedGuideIds.includes(guide.id);
  const run = guideCanRun(game) && !dismissed && !showHelp;
  const satisfied = Boolean(
    activeStep && activeStep.kind !== "complete" && activeStep.completed(game)
  );
  const advance = useCallback(
    () => setStepIndex((current) => Math.min(current + 1, guide.steps.length - 1)),
    [guide.steps.length]
  );

  useEffect(() => {
    if (!run || game.phase !== "prime") return;
    const incident = game.incidents.find(
      (entry) => entry.sourceId === "hydrogen_oxygen_combustion" && entry.phase === "prime"
    );
    if (!incident || pausedPrimeIncidentId.current === incident.id) return;
    pausedPrimeIncidentId.current = incident.id;
    if (!game.paused) dispatch({ type: "set_pause", paused: true });
  }, [dispatch, game.incidents, game.paused, game.phase, run]);

  useEffect(() => {
    if (!run || activeStep?.id !== "observe-combat-flash" || !satisfied) return;
    const incident = game.incidents.find(
      (entry) =>
        entry.sourceId === "hydrogen_oxygen_combustion" &&
        entry.phase === "assault" &&
        entry.targets.length > 0
    );
    if (!incident || pausedIncidentId.current === incident.id) return;
    pausedIncidentId.current = incident.id;
    if (!game.paused) dispatch({ type: "set_pause", paused: true });
  }, [activeStep?.id, dispatch, game.incidents, game.paused, run, satisfied]);

  useEffect(() => {
    if (!run || !activeStep || satisfied) return;
    const element = document.querySelector<HTMLElement>(activeStep.target);
    if (!element) return;
    element.classList.add("tutorial-active-target");
    return () => element.classList.remove("tutorial-active-target");
  }, [activeStep, run, satisfied]);

  if (!activeStep) return null;
  return (
    <GuideAdvanceContext.Provider value={advance}>
      <Joyride
        run={run}
        steps={steps}
        stepIndex={stepIndex}
        scrollToFirstStep
        tooltipComponent={GuideTooltip}
        styles={JOYRIDE_STYLES}
        options={JOYRIDE_OPTIONS}
      />
    </GuideAdvanceContext.Provider>
  );
};

export const GuidedTutorial = () => {
  const game = useGameStore((state) => state.game);
  const guide = guideDefinitionFor(game);
  if (!guide) return null;
  return <ActiveGuidedTutorial key={guide.id} guide={guide} />;
};
