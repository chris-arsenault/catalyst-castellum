import { Flame, Gauge, PauseCircle, Play, Wind } from "lucide-react";
import type { CombatIncident } from "../game/types";
import { useGamePresentation } from "../application/presentationContext";

interface FirstFlashExplanationProps {
  incident: CombatIncident;
  onClose: () => void;
}

export const FirstFlashExplanation = ({ incident, onClose }: FirstFlashExplanationProps) => {
  const { formatters, translator } = useGamePresentation();
  return (
    <div className="modal-backdrop first-flash-backdrop">
      <section
        className="first-flash-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-flash-title"
        data-testid="first-flash-explanation"
      >
        <span className="first-flash-kicker">
          <PauseCircle size={14} /> {translator.text("tutorial.flash.explanation.kicker")}
        </span>
        <h2 id="first-flash-title">{translator.text("tutorial.flash.explanation.title")}</h2>
        <p>{translator.text("tutorial.flash.explanation.summary")}</p>
        <div
          className="flash-causal-chain"
          aria-label={translator.text("tutorial.flash.explanation.causalChain")}
        >
          <span>
            <Wind size={16} />
            <strong>{translator.text("tutorial.flash.explanation.reactants")}</strong>
            <small>{translator.text("tutorial.flash.explanation.feed")}</small>
          </span>
          <i>→</i>
          <span>
            <Flame size={16} />
            <strong>{translator.text("tutorial.flash.explanation.ignition")}</strong>
            <small>
              {translator.text("tutorial.flash.explanation.extent", {
                extent: formatters.number(incident.reactionExtent, 1),
              })}
            </small>
          </span>
          <i>→</i>
          <span>
            <Gauge size={16} />
            <strong>{translator.text("tutorial.flash.explanation.effects")}</strong>
            <small>
              {translator.text("tutorial.flash.explanation.effectValues", {
                pressure: formatters.number(incident.pressureImpulse, 0),
                heat: formatters.number(incident.heatDelta, 0),
              })}
            </small>
          </span>
        </div>
        <p className="first-flash-note">{translator.text("tutorial.flash.explanation.note")}</p>
        <button type="button" className="primary-action first-flash-resume" onClick={onClose}>
          <Play size={15} /> {translator.text("tutorial.flash.explanation.startAssault")}
        </button>
      </section>
    </div>
  );
};
