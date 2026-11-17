import { defineConfig, devices } from "@playwright/test";
import { APP_PORT, APP_URL, BARCODE_VIDEO, FAKE_URL, READER_STATE } from "./e2e/constants.mjs";

/**
 * Browser smoke tests (e2e/): the built app against a fake Supabase
 * (e2e/fake-supabase.mjs), in Chromium. They catch what unit tests can't:
 * a page that crashes, a sign-in that loops, a camera that never starts.
 *
 * Run: `npm run e2e:build && npm run e2e`. The e2e build lives in .next-e2e,
 * apart from your normal build (see e2e/build.mjs).
 */
const signedIn = { storageState: READER_STATE };

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: APP_URL,
    trace: "retain-on-first-failure",
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
      use: { ...devices["Desktop Chrome"], ...signedIn },
    },
    {
      // Phones are who Bayu is for: the same pages with the bottom tab bar.
      name: "signed-in-phone",
      testMatch: /app\.spec\.ts/,
      dependencies: ["sign-in"],
      use: { ...devices["Pixel 7"], ...signedIn },
    },
    {
      name: "phone-camera",
      testMatch: /scanner\.spec\.ts/,
      dependencies: ["sign-in"],
      use: {
        ...devices["Pixel 7"],
        ...signedIn,
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
      url: `${FAKE_URL}/health`,
      reuseExistingServer: !process.env.CI,
    },
    {
      // BAYU_E2E makes next start serve .next-e2e; it refuses to start if there's no e2e build.
      command: `npx next start -p ${APP_PORT}`,
      url: APP_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: { BAYU_E2E: "1", NEXT_TELEMETRY_DISABLED: "1" },
    },
  ],
});
