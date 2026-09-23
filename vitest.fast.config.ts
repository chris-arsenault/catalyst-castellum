import { defineConfig } from "vitest/config";
import config from "./vite.config";
import { FAST_TEST_PATTERN } from "./tooling/testSuites";

export default defineConfig({
  ...config,
  test: { ...config.test, testNamePattern: FAST_TEST_PATTERN },
});
