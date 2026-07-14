import { EN_LOCALE } from "./locales/en";
import type { LocaleBundle, LocaleKey, MessageParameters } from "./types";

export interface Translator {
  readonly locale: string;
  text<Key extends LocaleKey>(key: Key, parameters: MessageParameters<Key>): string;
  text<Key extends LocaleKey>(key: Key): string;
}

export const createTranslator = (bundle: LocaleBundle): Translator =>
  Object.freeze({
    locale: bundle.locale,
    text: <Key extends LocaleKey>(
      key: Key,
      parameters: MessageParameters<Key> = {} as MessageParameters<Key>
    ) =>
      bundle.messages[key].replaceAll(/\{([^}]+)\}/g, (_match, name: string) =>
        String((parameters as Record<string, string | number>)[name] ?? `{${name}}`)
      ),
  });

export const DEFAULT_TRANSLATOR = createTranslator(EN_LOCALE);
