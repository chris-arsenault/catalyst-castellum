import { ArrowRight, Flame, Gauge, MapPinned, RefreshCw, Wind, Zap } from "lucide-react";
import type { GuideConceptKind, GuideDefinition } from "./guideModel";

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
}) => (
  <div className="modal-backdrop tutorial-stage-intro-backdrop">
    <section
      className="tutorial-stage-intro"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-stage-intro-title"
      data-testid="tutorial-stage-intro"
    >
      <span className="tutorial-stage-intro-kicker">
        <MapPinned size={15} /> {guide.story.kicker}
      </span>
      <h2 id="tutorial-stage-intro-title">{guide.story.title}</h2>
      <div className="tutorial-stage-story">
        {guide.story.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      {guide.story.model && (
        <section className="tutorial-concept-model" aria-labelledby="tutorial-concept-title">
          <header>
            <span id="tutorial-concept-title">Process model</span>
            <p>{guide.story.model.principle}</p>
          </header>
          <ol className="tutorial-concept-chain">
            {guide.story.model.stages.map((stage) => (
              <li key={stage.kind}>
                <span className="tutorial-concept-icon">
                  <ConceptIcon kind={stage.kind} />
                </span>
                <div>
                  <small>{stage.title}</small>
                  <strong>{stage.metric}</strong>
                  <p>{stage.detail}</p>
                </div>
              </li>
            ))}
          </ol>
          <footer>{guide.story.model.conclusion}</footer>
        </section>
      )}
      <div className="tutorial-stage-goal">
        <span>
          <Flame size={16} /> Field objective
        </span>
        <strong>{guide.mission.title}</strong>
        <p>{guide.mission.summary}</p>
      </div>
      <button
        type="button"
        className="enter-button tutorial-stage-enter"
        data-testid="enter-stage-controls"
        onClick={onEnter}
      >
        Open stage controls <ArrowRight size={17} />
      </button>
    </section>
  </div>
);
