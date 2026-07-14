import { Biohazard, Droplets, Flame, Gauge, Wind } from "lucide-react";

const OPERATING_PHASES = [
  {
    number: "01",
    title: "Plan",
    detail: "Configure equipment, conduits, and feedstocks while simulation time is frozen.",
  },
  {
    number: "02",
    title: "Prime",
    detail: "Advance the plant before the wave arrives and establish useful process inventory.",
  },
  {
    number: "03",
    title: "Assault",
    detail: "The commissioned plant runs autonomously while the hostile formation crosses it.",
  },
  {
    number: "04",
    title: "Analyze",
    detail: "Read the frozen end state, bank harvested matter, and prepare the next round.",
  },
] as const;

const FIELD_NOTES = [
  {
    icon: Wind,
    title: "Process rooms build weapons over time.",
    detail: "Flow, retained inventory, mixing, temperature, and outlet headroom share one clock.",
  },
  {
    icon: Flame,
    title: "Equipment changes the room’s possible chemistry.",
    detail: "The Encyclopedia links every machine to the reactions it enables or accelerates.",
  },
  {
    icon: Droplets,
    title: "Liquid inventory stores delayed effects.",
    detail:
      "Contact equipment turns routed gases and liquids into material that moves between rooms.",
  },
  {
    icon: Biohazard,
    title: "Enemy profiles reward different exposure plans.",
    detail: "The Threats section records movement, health, and every damage-channel multiplier.",
  },
] as const;

export const OperationsManual = () => (
  <section className="manual-page manual-operations-page" data-testid="manual-operations-page">
    <header className="manual-page-heading">
      <span>
        <Gauge size={15} /> Control cycle
      </span>
      <h2>Run the defense machine</h2>
      <p>
        Each round is one continuous process record. Build a chemical state, expose the formation,
        then carry useful inventory into the next plan.
      </p>
    </header>
    <div className="manual-phase-strip">
      {OPERATING_PHASES.map((phase) => (
        <article key={phase.number}>
          <em>{phase.number}</em>
          <strong>{phase.title}</strong>
          <p>{phase.detail}</p>
        </article>
      ))}
    </div>
    <div className="manual-field-notes">
      {FIELD_NOTES.map(({ detail, icon: Icon, title }) => (
        <article key={title}>
          <Icon size={20} />
          <div>
            <strong>{title}</strong>
            <p>{detail}</p>
          </div>
        </article>
      ))}
    </div>
  </section>
);
