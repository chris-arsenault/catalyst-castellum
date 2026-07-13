import { useCallback } from "react";
import { ArrowRight, Check, Eye, MousePointerClick, X } from "lucide-react";
import type { TooltipRenderProps } from "react-joyride";
import { useGameStore } from "../game/store";
import type { GuideStepDefinition } from "./guideModel";
import { useGuideAdvance } from "./guideUiContext";

interface GuideStepData {
  definition: GuideStepDefinition;
  guideLabel: string;
}

const StepIcon = ({ kind }: Pick<GuideStepDefinition, "kind">) => {
  if (kind === "observe") return <Eye size={16} />;
  if (kind === "complete") return <Check size={16} />;
  return <MousePointerClick size={16} />;
};

const CoachFooter = ({
  advance,
  complete,
  dismiss,
  satisfied,
  stepKind,
}: {
  advance: () => void;
  complete: boolean;
  dismiss: () => void;
  satisfied: boolean;
  stepKind: GuideStepDefinition["kind"];
}) => {
  if (complete) {
    return (
      <button
        className="tutorial-coach-complete"
        type="button"
        data-testid="complete-guided-lesson"
        onClick={dismiss}
      >
        Finish field drill <Check size={15} />
      </button>
    );
  }
  if (satisfied) {
    return (
      <div className="tutorial-coach-reflection">
        <small>RESULT RECORDED · inspect the board, then continue</small>
        <button type="button" data-testid="tutorial-continue" onClick={advance}>
          Continue <ArrowRight size={15} />
        </button>
      </div>
    );
  }
  return (
    <small className="tutorial-coach-state">
      {stepKind === "observe"
        ? "OBSERVE · follow the map and chamber readouts"
        : "OPERATE · use the highlighted control"}
    </small>
  );
};

export const GuideTooltip = ({ index, size, step, tooltipProps }: TooltipRenderProps) => {
  const game = useGameStore((state) => state.game);
  const dismiss = useGameStore((state) => state.dismissTutorialGuide);
  const dispatch = useGameStore((state) => state.dispatch);
  const advance = useGuideAdvance();
  const { definition, guideLabel } = step.data as GuideStepData;
  const complete = definition.kind === "complete";
  const satisfied = !complete && definition.completed(game);
  const finish = useCallback(() => {
    if (game.paused && (game.phase === "prime" || game.phase === "assault")) {
      dispatch({ type: "set_pause", paused: false });
    }
    dismiss();
  }, [dismiss, dispatch, game.paused, game.phase]);

  return (
    <div
      {...tooltipProps}
      className={`tutorial-coach tutorial-coach-${definition.kind}`}
      data-testid="tutorial-coach"
      data-guide-step={definition.id}
      role="dialog"
      aria-live="polite"
      aria-modal="false"
    >
      <header>
        <div>
          <span>{guideLabel}</span>
          <strong>
            Step {index + 1} of {size}
          </strong>
        </div>
        <button
          className="tutorial-coach-skip"
          type="button"
          aria-label="Skip guided lesson"
          onClick={finish}
        >
          <X size={14} /> Skip
        </button>
      </header>

      <div className="tutorial-coach-body">
        <div className="tutorial-coach-icon">
          <StepIcon kind={definition.kind} />
        </div>
        <div>
          <h2>{definition.title}</h2>
          <p>{definition.explanation}</p>
        </div>
      </div>

      <div className={`tutorial-coach-instruction ${satisfied ? "result" : ""}`}>
        {satisfied ? <Check size={16} /> : <StepIcon kind={definition.kind} />}
        <strong>{satisfied ? definition.result : definition.instruction}</strong>
      </div>

      <CoachFooter
        advance={advance}
        complete={complete}
        dismiss={finish}
        satisfied={satisfied}
        stepKind={definition.kind}
      />
    </div>
  );
};
