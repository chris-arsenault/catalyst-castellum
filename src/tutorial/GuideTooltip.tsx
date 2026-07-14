import { Eye, MousePointerClick } from "lucide-react";
import type { TooltipRenderProps } from "react-joyride";
import type { GuideStepDefinition } from "./guideModel";

interface GuideStepData {
  definition: GuideStepDefinition;
}

const StepIcon = ({ kind }: Pick<GuideStepDefinition, "kind">) =>
  kind === "observe" ? <Eye size={14} /> : <MousePointerClick size={14} />;

/**
 * A short label attached to the live control. The durable explanation and the
 * complete objective list live together in TutorialTaskCard.
 */
export const GuideTooltip = ({ step, tooltipProps }: TooltipRenderProps) => {
  const { definition } = step.data as GuideStepData;

  return (
    <div
      {...tooltipProps}
      className={`tutorial-control-callout tutorial-control-callout-${definition.kind}`}
      data-testid="tutorial-coach"
      data-guide-step={definition.id}
      role="status"
      aria-live="polite"
    >
      <StepIcon kind={definition.kind} />
      <span>{definition.instruction}</span>
    </div>
  );
};
