// `npm run dev:fake`: the app in dev mode against the fake Supabase, for
// building without real email or a real database. Sign in with any email and
// the code 123456. Only ever on your own computer: the fake has no real data
// and the real Supabase is never touched (the address is the fake's, below).
// Builds into .next-e2e like the smoke tests, so it never mixes with your
// normal `npm run dev` / `npm run build`.
import { spawn } from "node:child_process";
import { APP_PORT, APP_URL, FAKE_URL, GOOD_CODE } from "./constants.mjs";

const fake = spawn(process.execPath, ["e2e/fake-supabase.mjs"], { stdio: "inherit" });
const dev = spawn("npx", ["next", "dev", "-p", String(APP_PORT)], {
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
console.log(`\nBayu with the fake Supabase: ${APP_URL}  (sign in with any email, code ${GOOD_CODE})\n`);

const stop = () => {
  fake.kill();
  dev.kill();
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
dev.on("exit", (code) => {
  fake.kill();
  process.exit(code ?? 0);
});
