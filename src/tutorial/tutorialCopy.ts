import type { Translator } from "../localization/translator";
import type { LocaleKey } from "../localization/types";
import type { TutorialCopy } from "./copyTypes";

export const tutorialText = (translator: Translator, copy: TutorialCopy): string =>
  typeof copy === "string"
    ? translator.text(copy)
    : translator.text(copy.key as LocaleKey, copy.parameters as never);
