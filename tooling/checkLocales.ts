/* global console, process */
import { EN_LOCALE } from "../src/localization/locales/en";
import { TEST_LOCALE } from "../src/localization/locales/test";
import { validateLocale } from "../src/localization/validation";

const issues = validateLocale(EN_LOCALE, TEST_LOCALE);
if (issues.length > 0) {
  console.error(issues.map(({ kind, key }) => `${kind}: ${key}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`${TEST_LOCALE.locale} is complete with placeholder parity.`);
}
