import { defineConfig, devices } from "@playwright/test";

const port = process.env.PLAYWRIGHT_PORT ?? "3000";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  reporter: "list",
  use: { baseURL, trace: "retain-on-failure", screenshot: "only-on-failure" },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `node ./node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port ${port}`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
      },
  projects: [
    { name: "mocked", testMatch: /.*\.mock\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
    { name: "live", testMatch: /.*\.live\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
  ],
});
