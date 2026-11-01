import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

const at = (url: string, host: string) => new NextRequest(url, { headers: { host } });

afterEach(() => vi.unstubAllEnvs());

describe("proxy: one production address", () => {
  it("sends the team address to the production domain with a 307 that isn't cached", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "magnus-v1.vercel.app");
    const res = await proxy(at("https://magnus-v1-merey-jago.vercel.app/login?next=%2Fbrowse", "magnus-v1-merey-jago.vercel.app"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://magnus-v1.vercel.app/login?next=%2Fbrowse");
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("serves the production domain itself", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "magnus-v1.vercel.app");
    const res = await proxy(at("https://magnus-v1.vercel.app/", "magnus-v1.vercel.app"));
    expect(res.headers.get("location")).toBeNull();
  });

  it("never redirects previews", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "magnus-v1.vercel.app");
    const res = await proxy(at("https://magnus-git-x-merey-jago.vercel.app/", "magnus-git-x-merey-jago.vercel.app"));
    expect(res.headers.get("location")).toBeNull();
  });
});
