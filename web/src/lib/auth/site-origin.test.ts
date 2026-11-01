import { describe, expect, it } from "vitest";
import { normaliseSiteOrigin } from "./site-origin";

describe("normaliseSiteOrigin", () => {
  it("cleans up the ways the setting is usually mistyped", () => {
    expect(normaliseSiteOrigin("https://magnus-v1.vercel.app")).toBe("https://magnus-v1.vercel.app");
    expect(normaliseSiteOrigin("https://magnus-v1.vercel.app/")).toBe("https://magnus-v1.vercel.app");
    expect(normaliseSiteOrigin("  magnus-v1.vercel.app  ")).toBe("https://magnus-v1.vercel.app");
    expect(normaliseSiteOrigin('"https://magnus-v1.vercel.app"')).toBe("https://magnus-v1.vercel.app");
    expect(normaliseSiteOrigin("https://magnus-v1.vercel.app/login")).toBe("https://magnus-v1.vercel.app");
    expect(normaliseSiteOrigin("http://localhost:3000")).toBe("http://localhost:3000");
  });
  it("refuses what isn't a web address", () => {
    expect(normaliseSiteOrigin(undefined)).toBeNull();
    expect(normaliseSiteOrigin("   ")).toBeNull();
    expect(normaliseSiteOrigin("javascript:alert(1)")).toBeNull();
    expect(normaliseSiteOrigin("ftp://magnus-v1.vercel.app")).toBeNull();
  });
});
