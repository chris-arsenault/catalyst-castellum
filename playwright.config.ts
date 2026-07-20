import { defineConfig, devices } from "@playwright/test";
import { DEV_SERVER } from "./tooling/devServer";

export default defineConfig({
  testDir: "./tests/e2e",
  // Scenarios drive the real simulation through a guided opening, so the
  // per-test budget covers a slow machine rather than the fastest path.
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: DEV_SERVER.localUrl,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: "pnpm run dev",
    url: DEV_SERVER.localUrl,
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
