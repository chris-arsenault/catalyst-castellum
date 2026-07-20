import { ArrowRight } from "lucide-react";
import { useGamePresentation } from "../application/presentationContext";
import { GuideIntro } from "./GuideIntro";
import type { GuideDefinition } from "./guideModel";

/**
 * A guide opens on the play surface, where the chambers it names are visible
 * behind it and the story has room to read.
 */
export const TutorialStageIntro = ({
  guide,
  onEnter,
}: {
  guide: GuideDefinition;
  onEnter: () => void;
}) => {
  const { translator } = useGamePresentation();
  return (
    <div className="modal-backdrop tutorial-stage-intro-backdrop">
      <section
        className="tutorial-stage-intro"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-intro-title"
        data-testid="tutorial-stage-intro"
      >
        <GuideIntro guide={guide} />
        <button
          type="button"
          className="enter-button tutorial-stage-enter"
          data-testid="enter-stage-controls"
          onClick={onEnter}
        >
          {translator.text("tutorial.common.openStageControls")} <ArrowRight size={17} />
        </button>
      </section>
    </div>
  );
};
