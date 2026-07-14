import type { RoundReport } from "../game/types";
import { DEFAULT_TRANSLATOR, type Translator } from "../localization/translator";

export interface RoundReportCopy {
  headline: string;
  detail: string;
}

export const createRoundReportCopy =
  (translator: Translator) =>
  (report: RoundReport): RoundReportCopy => {
    const headline =
      report.breached === 0
        ? translator.text("presentation.round.contained.title")
        : translator.text("presentation.round.breached.title", {
            count: report.breached,
            label: report.breached === 1 ? "breach" : "breaches",
          });
    const detail =
      report.breached === 0
        ? translator.text("presentation.round.contained.detail", {
            killed: report.killed,
            matter: report.matterHarvested,
          })
        : translator.text("presentation.round.breached.detail", { damage: report.coreDamage });
    return { headline, detail };
  };

export const roundReportCopy = createRoundReportCopy(DEFAULT_TRANSLATOR);
