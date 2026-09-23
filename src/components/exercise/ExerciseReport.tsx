import type { EncounterResult } from "../../game/tactical";
import type { ExerciseRuntime, ExerciseState } from "../../game/exercise";
import type { ExerciseSessionController } from "../../application/useExerciseSession";
import { useEncounterControls } from "../../application/encounterSurface";
import { ReportStats } from "../WaveReport";
import type { TacticalPresentation } from "../../presentation/tactical";

type CatalystReport = NonNullable<EncounterResult["report"]["catalyst"]>;
const sourceLabel = (report: CatalystReport, id: string, presentation: TacticalPresentation) => {
  const source = report.sources[id];
  return presentation.translator.text("catalyst.installation", {
    name: source
      ? presentation.towers.name(source.chassisId)
      : presentation.translator.text("catalyst.device"),
    number: Object.keys(report.sources).indexOf(id) + 1,
  });
};

export const ExerciseReport = ({
  state,
  runtime,
  controller,
}: {
  state: ExerciseState;
  runtime: ExerciseRuntime;
  controller: ExerciseSessionController;
}) => {
  const { presentation } = useEncounterControls();
  const { translator, formatters } = presentation;
  const result = state.encounter.result;
  if (!result) return null;
  const report = result.report;
  const complete = result.termination === "complete";
  const final = complete && state.waveIndex + 1 === runtime.definition.waves.length;
  const stats = [
    { label: translator.text("ui.progress.neutralized"), value: String(report.killed) },
    { label: translator.text("ui.progress.breaches"), value: String(report.breached) },
    {
      label: translator.text("ui.progress.core"),
      value: formatters.number(state.encounter.coreIntegrity),
    },
  ];

  return (
    <section className="exercise-report" data-testid="exercise-report" aria-live="polite">
      <h2>{translator.text(reportTitle(result.termination, final))}</h2>
      <ReportStats entries={stats} />
      <h3>{translator.text("catalyst.routes")}</h3>
      {Object.keys(report.breachesByRoute).length > 0 ? (
        <ul>
          {Object.entries(report.breachesByRoute).map(([route, count]) => (
            <li key={route}>{translator.text("catalyst.routeBreaches", { route, count })}</li>
          ))}
        </ul>
      ) : (
        <p>{translator.text("catalyst.clearRoutes")}</p>
      )}
      {report.catalyst && <ChargeReport catalyst={report.catalyst} />}
      {report.catalyst && <DeviceReport catalyst={report.catalyst} />}
      <div className="exercise-actions">
        {complete && !final && (
          <button
            type="button"
            className="primary-action"
            onClick={() => controller.dispatch({ type: "continue_wave" })}
          >
            {translator.text("catalyst.next")}
          </button>
        )}
        {state.checkpoint && (
          <button type="button" onClick={() => controller.dispatch({ type: "retry_wave" })}>
            {translator.text("catalyst.retry")}
          </button>
        )}
      </div>
    </section>
  );
};

const DeviceReport = ({
  catalyst,
}: {
  catalyst: NonNullable<EncounterResult["report"]["catalyst"]>;
}) => {
  const { presentation } = useEncounterControls();
  const { translator, formatters } = presentation;
  const label = (id: string) => sourceLabel(catalyst, id, presentation);
  return (
    <>
      <h3>{translator.text("catalyst.directOutput")}</h3>
      <ul>
        {Object.entries(catalyst.directBySource)
          .filter(([, result]) => result.shots > 0 || result.damage > 0)
          .map(([id, result]) => (
            <li key={id}>
              {label(id)}:{" "}
              {translator.text("catalyst.directStats", {
                damage: formatters.number(result.damage),
                shots: result.shots,
                kills: result.kills,
              })}
            </li>
          ))}
      </ul>
      <h3>{translator.text("catalyst.fieldExposure")}</h3>
      <ul>
        {Object.entries(catalyst.fieldByDevice).map(([id, result]) => (
          <li key={id}>
            {label(id)}:{" "}
            {translator.text("catalyst.fieldStats", {
              active: formatters.number(result.activeSeconds, 1),
              serviced: formatters.number(result.servicedEnemySeconds, 1),
            })}
          </li>
        ))}
      </ul>
      <p>{translator.text("catalyst.fieldExposureDetail")}</p>
    </>
  );
};

const reportTitle = (termination: EncounterResult["termination"], final: boolean) => {
  if (final) return "catalyst.complete";
  if (termination === "complete") return "catalyst.report";
  if (termination === "timeout") return "catalyst.timeout";
  return "catalyst.defeat";
};
const ChargeReport = ({
  catalyst,
}: {
  catalyst: NonNullable<EncounterResult["report"]["catalyst"]>;
}) => {
  const { presentation } = useEncounterControls();
  const { translator, formatters } = presentation;
  const chargeStats = catalyst
    ? [
        {
          label: translator.text("catalyst.input"),
          value: formatters.number(catalyst.accounting.accepted),
        },
        {
          label: translator.text("catalyst.consumed"),
          value: formatters.number(catalyst.accounting.consumed),
        },
        {
          label: translator.text("catalyst.decayed"),
          value: formatters.number(catalyst.accounting.decay),
        },
        {
          label: translator.text("catalyst.lost"),
          value: formatters.number(
            catalyst.accounting.death + catalyst.accounting.breach + catalyst.accounting.cleanup
          ),
        },
        {
          label: translator.text("catalyst.damage"),
          value: formatters.number(
            Object.values(catalyst.damageByDevice).reduce((sum, entry) => sum + entry.actual, 0)
          ),
        },
      ]
    : [];
  return (
    <>
      <h3>{translator.text("catalyst.accounting")}</h3>
      <ReportStats entries={chargeStats} />
      <h3>{translator.text("catalyst.assists")}</h3>
      <ul>
        {Object.entries(catalyst.accountingBySource)
          .filter(([, account]) => account.consumed > 0)
          .map(([id, account]) => {
            return (
              <li key={id}>
                {sourceLabel(catalyst, id, presentation)}: {formatters.number(account.consumed)}
              </li>
            );
          })}
      </ul>
    </>
  );
};
