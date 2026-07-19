import type { LocaleFormatters } from "../../localization/formatters";
import type { Translator } from "../../localization/translator";
import type { HazardLabel } from "../../presentation/roomCopy";

export const formatPercent = (value: number, formatters: LocaleFormatters): string => {
  if (value > 0 && value < 0.001) return `<${formatters.percent(0.001, 1)}`;
  return formatters.percent(value, value < 0.1 ? 1 : 0);
};

export const localizedHazard = (hazard: HazardLabel, translator: Translator): string => {
  const keys = {
    CLEAR: "ui.room.hazard.clear",
    LOW: "ui.room.hazard.low",
    HOSTILE: "ui.room.hazard.hostile",
    LETHAL: "ui.room.hazard.lethal",
  } as const;
  return translator.text(keys[hazard]);
};
