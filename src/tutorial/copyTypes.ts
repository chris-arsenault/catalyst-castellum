import type { LocaleKey } from "../localization/types";

export type TutorialCopyKey = Extract<LocaleKey, `tutorial.${string}`>;

export interface TutorialMessage {
  key: TutorialCopyKey;
  parameters: Readonly<Record<string, string | number>>;
}

export type TutorialCopy = TutorialCopyKey | TutorialMessage;
