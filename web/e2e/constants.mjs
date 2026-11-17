// Shared by the fake Supabase, the build script and the tests, so they can't drift apart.
// Plain on purpose (no import.meta): Playwright loads it from its TypeScript config.
// Paths resolve from web/, where every e2e command runs.
import path from "node:path";

/** Where the fake Supabase listens. */
export const FAKE_PORT = 54329;
export const FAKE_URL = `http://127.0.0.1:${FAKE_PORT}`;
/** Where the e2e build of the app runs. */
export const APP_PORT = 3100;
export const APP_URL = `http://localhost:${APP_PORT}`;
/** The e2e build goes in its own folder, never over your normal .next (see next.config.ts). */
export const E2E_DIST_DIR = ".next-e2e";

/** The one code the fake Supabase accepts. */
export const GOOD_CODE = "123456";
/** This email gets Supabase's "too many emails" answer. */
export const BUSY_EMAIL = "busy@example.com";
/** The ISBN on the fake camera's barcode; the fake Supabase knows this book. */
export const SCANNED_ISBN = "9780571364879";
export const SCANNED_TITLE = "Klara and the Sun";

export const READER_STATE = path.resolve("e2e/.tmp/reader.json");
export const BARCODE_VIDEO = path.resolve("e2e/.tmp/barcode.y4m");
