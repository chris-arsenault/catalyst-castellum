import { defineConfig } from "vitest/config";
import config from "./vite.config";
import { CAMPAIGN_TEST_FILES, CAMPAIGN_TEST_PATTERN } from "./tooling/testSuites";

export default defineConfig({
  ...config,
  test: {
    ...config.test,
    include: CAMPAIGN_TEST_FILES,
    testNamePattern: CAMPAIGN_TEST_PATTERN,
  },
});
