import { Blocks, Crosshair, Gauge, Route, Wind } from "lucide-react";
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
    title: translator.text("ui.manual.operations.phase.assault.title"),
    detail: translator.text("ui.manual.operations.phase.assault.detail"),
  },
  {
    number: "03",
    title: translator.text("ui.manual.operations.phase.report.title"),
    detail: translator.text("ui.manual.operations.phase.report.detail"),
  },
];

const fieldNoteCopy = (translator: Translator) => [
  {
    icon: Crosshair,
    title: translator.text("ui.manual.operations.note.towers.title"),
    detail: translator.text("ui.manual.operations.note.towers.detail"),
  },
  {
    icon: Route,
    title: translator.text("ui.manual.operations.note.routes.title"),
    detail: translator.text("ui.manual.operations.note.routes.detail"),
  },
  {
    icon: Blocks,
    title: translator.text("ui.manual.operations.note.grafts.title"),
    detail: translator.text("ui.manual.operations.note.grafts.detail"),
  },
  {
    icon: Wind,
    title: translator.text("ui.manual.operations.note.chemistry.title"),
    detail: translator.text("ui.manual.operations.note.chemistry.detail"),
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
