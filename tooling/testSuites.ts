/** Full campaign execution belongs to integration; authoring checks in these files stay fast. */
const CAMPAIGN_TESTS = [
  {
    file: "src/game/playtest/campaignRunner.test.ts",
    name: "continuous campaign reference carries one legal economy and hull state from a new save to victory",
  },
  {
    file: "src/game/playtest/determinism.test.ts",
    name: "primary-reference determinism snapshot reproduces the committed per-round reports for every level",
  },
  {
    file: "src/game/morrowPocketDiversity.test.ts",
    name: "Morrow Pocket defense diversity acceptance clears with five tower strategies while an undefended Core falls",
  },
  {
    file: "src/game/playtest/portfolio.test.ts",
    name: "reference-build portfolios exercises the optional Acid-Caustic reaction in Twelve-Cask",
  },
] as const;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const campaignNames = CAMPAIGN_TESTS.map(({ name }) => escapeRegExp(name)).join("|");

// Vitest prefixes full names with the test-file name. Match the suite/test suffix exactly.
export const CAMPAIGN_TEST_PATTERN = new RegExp(`(?:^| )(?:${campaignNames})$`);
export const FAST_TEST_PATTERN = new RegExp(`^(?!.*(?:${campaignNames})$)`);
export const CAMPAIGN_TEST_FILES = CAMPAIGN_TESTS.map(({ file }) => file);
