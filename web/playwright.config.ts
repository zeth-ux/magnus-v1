import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

/**
 * Browser smoke tests (e2e/): the built app against a fake Supabase
 * (e2e/fake-supabase.mjs), in Chromium. They catch what unit tests can't:
 * a page that crashes, a sign-in that loops, a camera that never starts.
 *
 * Run: `npm run e2e:build && npm run e2e` (the build bakes the fake
 * Supabase's address into the app, so it replaces your normal .next build).
 */
const PORT = 3100;
export const BASE_URL = `http://localhost:${PORT}`;
export const READER_STATE = path.join(__dirname, "e2e/.tmp/reader.json");
export const BARCODE_VIDEO = path.join(__dirname, "e2e/.tmp/barcode.y4m");

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "sign-in", testMatch: /sign-in\.setup\.ts/ },
    {
      name: "signed-out",
      testMatch: /(landing|login)\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "signed-in",
      testMatch: /app\.spec\.ts/,
      dependencies: ["sign-in"],
      use: { ...devices["Desktop Chrome"], storageState: READER_STATE },
    },
    {
      name: "phone-camera",
      testMatch: /scanner\.spec\.ts/,
      dependencies: ["sign-in"],
      use: {
        ...devices["Pixel 7"],
        storageState: READER_STATE,
        permissions: ["camera"],
        launchOptions: {
          args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-video-capture=${BARCODE_VIDEO}`],
        },
      },
    },
  ],
  webServer: [
    {
      command: "node e2e/fake-supabase.mjs",
      url: "http://127.0.0.1:54329/health",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npx next start -p ${PORT}`,
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: { NEXT_TELEMETRY_DISABLED: "1" },
    },
  ],
});
