import { Biohazard, Droplets, Flame, Gauge, Wind } from "lucide-react";
import { useGamePresentation } from "../../application/presentationContext";
import type { Translator } from "../../localization/translator";

const operatingPhaseCopy = (translator: Translator) => [
  {
    number: "01",
    title: translator.text("ui.manual.operations.phase.plan.title"),
    detail: translator.text("ui.manual.operations.phase.plan.detail"),
  },
  {
    number: "02",
    title: translator.text("ui.manual.operations.phase.prime.title"),
    detail: translator.text("ui.manual.operations.phase.prime.detail"),
  },
  {
    number: "03",
    title: translator.text("ui.manual.operations.phase.assault.title"),
    detail: translator.text("ui.manual.operations.phase.assault.detail"),
  },
  {
    number: "04",
    title: translator.text("ui.manual.operations.phase.analyze.title"),
    detail: translator.text("ui.manual.operations.phase.analyze.detail"),
  },
];

const fieldNoteCopy = (translator: Translator) => [
  {
    icon: Wind,
    title: translator.text("ui.manual.operations.note.process.title"),
    detail: translator.text("ui.manual.operations.note.process.detail"),
  },
  {
    icon: Flame,
    title: translator.text("ui.manual.operations.note.equipment.title"),
    detail: translator.text("ui.manual.operations.note.equipment.detail"),
  },
  {
    icon: Droplets,
    title: translator.text("ui.manual.operations.note.liquid.title"),
    detail: translator.text("ui.manual.operations.note.liquid.detail"),
  },
  {
    icon: Biohazard,
    title: translator.text("ui.manual.operations.note.enemy.title"),
    detail: translator.text("ui.manual.operations.note.enemy.detail"),
  },
];

export const OperationsManual = () => {
  const { translator } = useGamePresentation();
  const operatingPhases = operatingPhaseCopy(translator);
  const fieldNotes = fieldNoteCopy(translator);
  return (
    <section className="manual-page manual-operations-page" data-testid="manual-operations-page">
      <header className="manual-page-heading">
        <span>
          <Gauge size={15} /> {translator.text("ui.manual.operations.kicker")}
        </span>
        <h2>{translator.text("ui.manual.operations.title")}</h2>
        <p>{translator.text("ui.manual.operations.summary")}</p>
      </header>
      <div className="manual-phase-strip">
        {operatingPhases.map((phase) => (
          <article key={phase.number}>
            <em>{phase.number}</em>
            <strong>{phase.title}</strong>
            <p>{phase.detail}</p>
          </article>
        ))}
      </div>
      <div className="manual-field-notes">
        {fieldNotes.map(({ detail, icon: Icon, title }) => (
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
};
