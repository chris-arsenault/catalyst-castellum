import type { EquipmentGradeDefinition } from "../game/types";
import { DEFAULT_FORMATTERS, type LocaleFormatters } from "../localization/formatters";
import { DEFAULT_TRANSLATOR, type Translator } from "../localization/translator";

export const createEquipmentGradeEffect =
  (translator: Translator, formatters: LocaleFormatters) =>
  (grade: EquipmentGradeDefinition): string => {
    const behavior = grade.behavior;
    switch (behavior.kind) {
      case "gas_agitator":
        return translator.text("presentation.equipment.agitator", {
          exchange: formatters.number(behavior.layerExchangeRate),
          kinetics: formatters.number(behavior.reactionMultiplier),
        });
      case "wet_contactor":
        return translator.text("presentation.equipment.contactor", {
          kinetics: formatters.number(behavior.reactionMultiplier),
        });
      case "thermal_coil":
        return translator.text("presentation.equipment.coil", {
          temperature: formatters.number(behavior.targetTemperature),
        });
      case "electrolyzer":
        return translator.text("presentation.equipment.cell", {
          rate: formatters.number(behavior.processRate),
          power: formatters.number(behavior.powerDraw),
        });
      case "vessel":
        return translator.text("presentation.equipment.vessel", {
          rate: formatters.number(behavior.processRate),
          power: formatters.number(behavior.powerDraw),
        });
    }
  };

export const equipmentGradeEffect = createEquipmentGradeEffect(
  DEFAULT_TRANSLATOR,
  DEFAULT_FORMATTERS
);
