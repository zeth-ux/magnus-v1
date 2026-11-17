// `npm run e2e:build`: builds the app for the browser smoke tests.
// - The fake Supabase runs during the build, so pages prerendered at build
//   time (the landing shelf) get the fake's data, the same on every run.
// - The fake's address is baked in (NEXT_PUBLIC_* are fixed at build time),
//   and the build goes to .next-e2e, so it never replaces your normal build
//   and `npm start` can never serve an app pointed at the fake (or e2e tests
//   an app pointed at the real Supabase).
// Works the same on Windows, macOS and Linux.
import { spawn } from "node:child_process";
import { APP_URL, FAKE_URL } from "./constants.mjs";

const fake = spawn(process.execPath, ["e2e/fake-supabase.mjs"], { stdio: "inherit" });
const stopFake = () => fake.kill();
process.on("exit", stopFake);

async function waitForFake() {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${FAKE_URL}/health`)).ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("The fake Supabase didn't start.");
}

await waitForFake();
const build = spawn("npx", ["next", "build"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    BAYU_E2E: "1",
    NEXT_TELEMETRY_DISABLED: "1",
    NEXT_PUBLIC_SUPABASE_URL: FAKE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_e2e",
    NEXT_PUBLIC_SITE_URL: APP_URL,
  },
});
build.on("exit", (code) => {
  stopFake();
  process.exit(code ?? 1);
});
