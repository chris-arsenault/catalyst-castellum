export interface LocaleFormatters {
  date(value: Date): string;
  duration(seconds: number): string;
  list(values: readonly string[]): string;
  measurement(value: number, unit: string, maximumFractionDigits?: number): string;
  number(value: number, maximumFractionDigits?: number): string;
  percent(value: number, maximumFractionDigits?: number): string;
  plural(value: number, forms: { one: string; other: string }): string;
}

export const createLocaleFormatters = (locale: string): LocaleFormatters => {
  const pluralRules = new Intl.PluralRules(locale);
  return Object.freeze({
    date: (value: Date) => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(value),
    duration: (seconds: number) =>
      new Intl.NumberFormat(locale, { style: "unit", unit: "second", unitDisplay: "short" }).format(
        seconds
      ),
    list: (values: readonly string[]) =>
      new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(values),
    measurement: (value: number, unit: string, maximumFractionDigits = 1) =>
      `${new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value)} ${unit}`,
    number: (value: number, maximumFractionDigits = 2) =>
      new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value),
    percent: (value: number, maximumFractionDigits = 1) =>
      new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits }).format(value),
    plural: (value: number, forms: { one: string; other: string }) =>
      pluralRules.select(value) === "one" ? forms.one : forms.other,
  });
};

export const DEFAULT_FORMATTERS = createLocaleFormatters("en");
