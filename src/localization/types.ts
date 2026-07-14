import { EN_LOCALE } from "./locales/en";

export type LocaleMessages = typeof EN_LOCALE.messages;
export type LocaleKey = keyof LocaleMessages;

export interface LocaleBundle {
  locale: string;
  messages: { readonly [Key in LocaleKey]: string };
}

type PlaceholderNames<Value extends string> = Value extends `${string}{${infer Name}}${infer Rest}`
  ? Name | PlaceholderNames<Rest>
  : never;

export type MessageParameters<Key extends LocaleKey> = Record<
  PlaceholderNames<LocaleMessages[Key]>,
  string | number
>;
