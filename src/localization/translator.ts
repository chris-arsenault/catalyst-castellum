import { EN_LOCALE } from "./locales/en";
import type { LocaleBundle, LocaleKey, MessageParameters } from "./types";
import { parseMessage } from "./messageTemplate";

export interface Translator {
  readonly locale: string;
  text<Key extends LocaleKey>(key: Key, parameters: MessageParameters<Key>): string;
  text<Key extends LocaleKey>(key: Key): string;
}

export const createTranslator = (bundle: LocaleBundle): Translator => {
  const numberFormatter = new Intl.NumberFormat(bundle.locale, { maximumFractionDigits: 2 });
  const format = <Key extends LocaleKey>(key: Key, parameters: MessageParameters<Key>): string => {
    const parsed = parseMessage(bundle.messages[key]);
    const values = parameters as Record<string, string | number>;
    return `${parsed.tokens
      .map(({ name, prefix }) => {
        const value = values[name];
        const rendered = typeof value === "number" ? numberFormatter.format(value) : String(value);
        const placeholder = "{" + name + "}";
        return prefix + (value === undefined ? placeholder : rendered);
      })
      .join("")}${parsed.suffix}`;
  };
  return Object.freeze({
    locale: bundle.locale,
    text: <Key extends LocaleKey>(
      key: Key,
      parameters: MessageParameters<Key> = {} as MessageParameters<Key>
    ) => format(key, parameters),
  });
};

export const DEFAULT_TRANSLATOR = createTranslator(EN_LOCALE);
