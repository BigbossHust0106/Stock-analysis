import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:3101",
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    },
  },
  webServer: {
    command: "npm run start -- --port 3101",
    url: "http://127.0.0.1:3101",
    reuseExistingServer: false,
    timeout: 60000,
    env: {
      STOCK_DB_PATH: process.env.STOCK_SMOKE_DB || "/tmp/ai-stock-smoke.sqlite",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
