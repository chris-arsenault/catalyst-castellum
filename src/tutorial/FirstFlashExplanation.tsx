import { Flame, Gauge, PauseCircle, Play, Wind } from "lucide-react";
import type { CombatIncident } from "../game/types";

interface FirstFlashExplanationProps {
  incident: CombatIncident;
  onClose: () => void;
}

export const FirstFlashExplanation = ({ incident, onClose }: FirstFlashExplanationProps) => (
  <div className="modal-backdrop first-flash-backdrop">
    <section
      className="first-flash-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-flash-title"
      data-testid="first-flash-explanation"
    >
      <span className="first-flash-kicker">
        <PauseCircle size={14} /> Teaching pause · First OX-1 flash
      </span>
      <h2 id="first-flash-title">R-02’s first OX-1 flash</h2>
      <p>
        The Core duct delivered hydrogen and oxygen into R-02. The agitator distributed them across
        both gas layers. One layer met its H₂ concentration, O₂ concentration, stoichiometric batch,
        agitation, and cooldown gates. Combustion consumes that mixture, creates a brief pressure
        impulse, and raises the chamber gas temperature.
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
          <strong>Blast + hot gas</strong>
          <small>
            {Math.round(incident.pressureImpulse)} kPa impulse · +{Math.round(incident.heatDelta)}{" "}
            °C gas
          </small>
        </span>
      </div>
      <p className="first-flash-note">
        The pressure impulse lands once at ignition. Gas above 48 °C applies continuous thermal
        damage while a target remains inside that layer. Enemy hover shows its current HP per
        second.
      </p>
      <button type="button" className="primary-action first-flash-resume" onClick={onClose}>
        <Play size={15} /> Start first assault
      </button>
    </section>
  </div>
);
