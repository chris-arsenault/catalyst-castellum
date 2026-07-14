/* global console */
import { EN_LOCALE } from "../src/localization/locales/en";

const groups = Object.entries(EN_LOCALE.messages).reduce<Record<string, [string, string][]>>(
  (result, [key, value]) => {
    const group = key.split(".")[0] ?? "other";
    const entries = result[group] ?? [];
    entries.push([key, value]);
    result[group] = entries;
    return result;
  },
  {}
);

console.log("# Catalyst Castellum English copy\n");
for (const [group, entries] of Object.entries(groups).sort(([left], [right]) =>
  left.localeCompare(right)
)) {
  console.log(`## ${group}\n`);
  for (const [key, value] of entries.sort(([left], [right]) => left.localeCompare(right))) {
    console.log(`- \`${key}\`: ${value}`);
  }
  console.log("");
}
