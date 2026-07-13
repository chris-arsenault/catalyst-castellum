import { Flame, Gauge, PauseCircle, Play, Wind } from "lucide-react";
import type { CombatIncident } from "../game/types";

interface FirstFlashExplanationProps {
  incident: CombatIncident;
  resumeOnClose: boolean;
  onClose: () => void;
}

export const FirstFlashExplanation = ({
  incident,
  resumeOnClose,
  onClose,
}: FirstFlashExplanationProps) => (
  <div className="modal-backdrop first-flash-backdrop">
    <section
      className="first-flash-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-flash-title"
      data-testid="first-flash-explanation"
    >
      <span className="first-flash-kicker">
        <PauseCircle size={14} /> First OX-1 flash
      </span>
      <h2 id="first-flash-title">Why R-02 just exploded</h2>
      <p>
        The Core duct delivered hydrogen and oxygen into R-02. The agitator mixed both gas layers
        until the chamber crossed the OX-1 ignition threshold.
      </p>
      <div className="flash-causal-chain" aria-label="Explosion causal chain">
        <span>
          <Wind size={16} />
          <strong>H₂ + O₂ arrived</strong>
          <small>Core gas feed</small>
        </span>
        <i>→</i>
        <span>
          <Flame size={16} />
          <strong>OX-1 ignited</strong>
          <small>{incident.reactionExtent.toFixed(1)} mol-eq reacted</small>
        </span>
        <i>→</i>
        <span>
          <Gauge size={16} />
          <strong>Pressure + heat</strong>
          <small>{Math.round(incident.pressureImpulse)} kPa impulse</small>
        </span>
      </div>
      <p className="first-flash-note">
        R-02 is primed. Start the assault and watch its pressure and heat strike enemies inside the
        chamber.
      </p>
      <button type="button" className="primary-action first-flash-resume" onClick={onClose}>
        <Play size={15} /> {resumeOnClose ? "Start first assault" : "Return to paused game"}
      </button>
    </section>
  </div>
);
