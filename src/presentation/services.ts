import { DEFAULT_GAME_RUNTIME, type GameRuntime } from "../game/runtime";
import { createLocaleFormatters } from "../localization/formatters";
import { EN_LOCALE } from "../localization/locales/en";
import { createTranslator } from "../localization/translator";
import type { LocaleBundle } from "../localization/types";
import { createCommandCopy } from "./commandCopy";
import { createDamageCopy } from "./damageCopy";
import { createEquipmentGradeEffect } from "./equipmentCopy";
import { createEventCopy } from "./eventCopy";
import { createLevelCopy } from "./levelCopy";
import { createLimitingFactorCopy } from "./limitingFactorCopy";
import { createManualContent, createReactionMechanics } from "./manualContent";
import { createNarrativeCopy } from "./narrativeCopy";
import { createRoundReportCopy } from "./roundReportCopy";
import { createPresentationSelectors } from "./selectors";

export const createGamePresentation = (runtime: GameRuntime, locale: LocaleBundle) => {
  const translator = createTranslator(locale);
  const formatters = createLocaleFormatters(locale.locale);
  return Object.freeze({
    translator,
    formatters,
    selectors: createPresentationSelectors(runtime, translator),
    commandCopy: createCommandCopy(translator),
    eventCopy: createEventCopy({ definition: runtime.definition, formatters, translator }),
    levelCopy: createLevelCopy(translator),
    narrativeCopy: createNarrativeCopy(translator),
    manual: createManualContent(translator),
    reactionMechanics: createReactionMechanics(translator),
    damage: createDamageCopy(translator),
    equipmentGradeEffect: createEquipmentGradeEffect(translator, formatters),
    limitingFactorCopy: createLimitingFactorCopy(translator),
    roundReportCopy: createRoundReportCopy(translator),
  });
};

export type GamePresentation = ReturnType<typeof createGamePresentation>;

export const DEFAULT_GAME_PRESENTATION = createGamePresentation(DEFAULT_GAME_RUNTIME, EN_LOCALE);
