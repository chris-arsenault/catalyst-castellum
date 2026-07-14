import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { DEV_SERVER } from "./tooling/devServer";

export default defineConfig({
  plugins: [react()],
  server: {
    host: DEV_SERVER.host,
    port: DEV_SERVER.port,
    strictPort: true,
    watch: {
      ignored: ["**/playwright-report/**", "**/test-results/**"],
    },
  },
  preview: {
    host: DEV_SERVER.host,
    port: DEV_SERVER.port,
    strictPort: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}", "tooling/**/*.test.ts"],
    coverage: {
      provider: "v8",
      thresholds: {
        statements: 78,
        branches: 60,
        functions: 78,
        lines: 81,
        "src/game/engine/commandPolicy.ts": {
          statements: 55,
          branches: 45,
          functions: 70,
          lines: 55,
        },
        "src/game/engine/commands.ts": {
          statements: 50,
          branches: 40,
          functions: 50,
          lines: 50,
        },
        "src/game/engine/phaseModel.ts": { 100: true },
        "src/game/engine/stateValidation.ts": {
          statements: 80,
          branches: 75,
          functions: 90,
          lines: 80,
        },
        "src/game/persistence/saveCodec.ts": {
          statements: 90,
          branches: 70,
          functions: 90,
          lines: 90,
        },
      },
    },
  },
});
