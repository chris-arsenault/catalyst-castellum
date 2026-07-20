import type { GameState } from "../game/types";
import type { LocaleFormatters } from "../localization/formatters";
import type { Translator } from "../localization/translator";

export interface ReportStatEntry {
  readonly label: string;
  readonly value: string;
}

/** The one stats grid every post-assault report renders. */
export const ReportStats = ({ entries }: { entries: readonly ReportStatEntry[] }) => (
  <dl className="report-stats">
    {entries.map((entry) => (
      <div key={entry.label}>
        <dt>{entry.label}</dt>
        <dd>{entry.value}</dd>
      </div>
    ))}
  </dl>
);

export const roundReportStats = (
  game: GameState,
  translator: Translator,
  formatters: LocaleFormatters
): ReportStatEntry[] => [
  {
    label: translator.text("ui.progress.neutralized"),
    value: String(game.lastReport?.killed ?? 0),
  },
  {
    label: translator.text("ui.progress.breaches"),
    value: String(game.lastReport?.breached ?? 0),
  },
  {
    label: translator.text("ui.progress.core"),
    value: formatters.percent(game.coreIntegrity / 100, 0),
  },
  {
    label: translator.text("ui.progress.reactions"),
    value: formatters.number(game.lastReport?.reactions ?? 0, 1),
  },
];
