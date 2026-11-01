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
    expect(normaliseSiteOrigin("localhost:3000")).toBe("https://localhost:3000");
  });

  it("refuses typos that would parse into the wrong address", () => {
    for (const bad of [
      "https:/magnus-v1.vercel.app",
      "https//magnus-v1.vercel.app",
      "user@evil.com",
      "mailto:a@evil.com",
      "https://user:pw@magnus-v1.vercel.app",
      "magnus",
      "javascript:alert(1)",
      "ftp://magnus-v1.vercel.app",
      "http://magnus-v1.vercel.app",
      undefined,
      "   ",
    ]) {
      expect(normaliseSiteOrigin(bad), String(bad)).toBeNull();
    }
  });
});
