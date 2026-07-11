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
    include: ["src/**/*.test.ts"],
  },
});
