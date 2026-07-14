import type { LevelDefinition, RoundDefinition } from "../game/definitionTypes";
import { DEFAULT_TRANSLATOR, type Translator } from "../localization/translator";
import type { LocaleKey } from "../localization/types";

const localized = (translator: Translator, key: string): string =>
  translator.text(key as LocaleKey);

export const createLevelCopy = (translator: Translator) => ({
  level: (level: Pick<LevelDefinition, "id">) => ({
    name: localized(translator, `levels.${level.id}.name`),
    kicker: localized(translator, `levels.${level.id}.kicker`),
    briefing: localized(translator, `levels.${level.id}.briefing`),
    lesson: localized(translator, `levels.${level.id}.lesson`),
  }),
  round: (level: Pick<LevelDefinition, "id">, round: Pick<RoundDefinition, "id">) => ({
    title: localized(translator, `levels.${level.id}.rounds.${round.id}.title`),
    detail: localized(translator, `levels.${level.id}.rounds.${round.id}.detail`),
    objective: localized(translator, `levels.${level.id}.rounds.${round.id}.objective`),
  }),
});

export const DEFAULT_LEVEL_COPY = createLevelCopy(DEFAULT_TRANSLATOR);
export const levelCopy = DEFAULT_LEVEL_COPY.level;
export const roundCopy = DEFAULT_LEVEL_COPY.round;
