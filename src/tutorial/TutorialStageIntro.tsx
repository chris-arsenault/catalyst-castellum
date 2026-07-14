import { ArrowRight, Flame, Gauge, MapPinned, RefreshCw, Wind, Zap } from "lucide-react";
import type { GuideConceptKind, GuideDefinition } from "./guideModel";
import { useGamePresentation } from "../application/presentationContext";
import { tutorialText } from "./tutorialCopy";

const ConceptIcon = ({ kind }: { kind: GuideConceptKind }) => {
  if (kind === "feed") return <Wind size={16} />;
  if (kind === "accumulate") return <Gauge size={16} />;
  if (kind === "mix" || kind === "separate") return <RefreshCw size={16} />;
  if (kind === "relieve") return <Wind size={16} />;
  if (kind === "heat") return <Flame size={16} />;
  if (kind === "route") return <ArrowRight size={16} />;
  return <Zap size={16} />;
};

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
        aria-labelledby="tutorial-stage-intro-title"
        data-testid="tutorial-stage-intro"
      >
        <span className="tutorial-stage-intro-kicker">
          <MapPinned size={15} /> {tutorialText(translator, guide.story.kicker)}
        </span>
        <h2 id="tutorial-stage-intro-title">{tutorialText(translator, guide.story.title)}</h2>
        <div className="tutorial-stage-story">
          {guide.story.paragraphs.map((paragraph) => (
            <p key={paragraph}>{tutorialText(translator, paragraph)}</p>
          ))}
        </div>
        {guide.story.model && (
          <section className="tutorial-concept-model" aria-labelledby="tutorial-concept-title">
            <header>
              <span id="tutorial-concept-title">
                {translator.text("tutorial.common.processModel")}
              </span>
              <p>{tutorialText(translator, guide.story.model.principle)}</p>
            </header>
            <ol className="tutorial-concept-chain">
              {guide.story.model.stages.map((stage) => (
                <li key={stage.kind}>
                  <span className="tutorial-concept-icon">
                    <ConceptIcon kind={stage.kind} />
                  </span>
                  <div>
                    <small>{tutorialText(translator, stage.title)}</small>
                    <strong>{tutorialText(translator, stage.metric)}</strong>
                    <p>{tutorialText(translator, stage.detail)}</p>
                  </div>
                </li>
              ))}
            </ol>
            <footer>{tutorialText(translator, guide.story.model.conclusion)}</footer>
          </section>
        )}
        <div className="tutorial-stage-goal">
          <span>
            <Flame size={16} /> {translator.text("tutorial.common.fieldObjective")}
          </span>
          <strong>{tutorialText(translator, guide.mission.title)}</strong>
          <p>{tutorialText(translator, guide.mission.summary)}</p>
        </div>
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
