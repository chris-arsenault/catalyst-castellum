import { EN_LOCALE } from "./en";
import type { LocaleBundle } from "../types";

export const TEST_LOCALE: LocaleBundle = {
  locale: "en-XA",
  messages: Object.fromEntries(
    Object.entries(EN_LOCALE.messages).map(([key, value]) => [key, `⟦${value}⟧`])
  ) as unknown as LocaleBundle["messages"],
};
