import type { RoundReport } from "../game/types";

export interface RoundReportCopy {
  headline: string;
  detail: string;
}

export const roundReportCopy = (report: RoundReport): RoundReportCopy => {
  const breachSuffix = report.breached === 1 ? "" : "es";
  const headline =
    report.breached === 0
      ? "Containment held"
      : `${report.breached} breach${breachSuffix} recorded`;
  const detail =
    report.breached === 0
      ? `${report.killed} hostiles yielded ${report.matterHarvested} matter. Every process inventory remains in place.`
      : `The core lost ${report.coreDamage}% integrity. The exact process state is preserved for diagnosis.`;
  return { headline, detail };
};
