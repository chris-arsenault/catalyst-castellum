import { describe, expect, it } from "vitest";
import { EN_LOCALE } from "./locales/en";
import { TEST_LOCALE } from "./locales/test";
import type { LocaleBundle } from "./types";
import { validateLocale } from "./validation";

describe("locale validation", () => {
  it("accepts a complete second locale with matching placeholders", () => {
    expect(validateLocale(EN_LOCALE, TEST_LOCALE)).toEqual([]);
  });

  it("reports missing, extra, and placeholder mismatches", () => {
    const messages = { ...TEST_LOCALE.messages } as Record<string, string>;
    delete messages["ui.common.facility"];
    messages["events.prime.detail"] = "Seconds ready.";
    messages["extra.key"] = "Extra";
    const issues = validateLocale(EN_LOCALE, {
      locale: "fixture",
      messages,
    } as LocaleBundle);
    expect(issues).toEqual(
      expect.arrayContaining([
        { key: "ui.common.facility", kind: "missing" },
        { key: "events.prime.detail", kind: "placeholder_mismatch" },
        { key: "extra.key", kind: "extra" },
      ])
    );
  });
});
