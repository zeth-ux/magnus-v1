import { describe, expect, it } from "vitest";
import { DEFAULT_AFTER_LOGIN, safeRedirectPath } from "./safe-redirect";

describe("safeRedirectPath", () => {
  it("keeps normal same-site paths", () => {
    expect(safeRedirectPath("/welcome")).toBe("/welcome");
    expect(safeRedirectPath("/browse?filter=lend#top")).toBe("/browse?filter=lend#top");
  });

  it("falls back when nothing is given", () => {
    expect(safeRedirectPath(null)).toBe(DEFAULT_AFTER_LOGIN);
    expect(safeRedirectPath(undefined)).toBe(DEFAULT_AFTER_LOGIN);
    expect(safeRedirectPath("")).toBe(DEFAULT_AFTER_LOGIN);
  });

  it.each([
    "https://evil.example",
    "http://evil.example/welcome",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "evil.example",
    "/\twelcome",
    "/welcome\n",
  ])("rejects %j", (bad) => {
    expect(safeRedirectPath(bad)).toBe(DEFAULT_AFTER_LOGIN);
  });

  it("uses a custom fallback", () => {
    expect(safeRedirectPath("https://evil.example", "/")).toBe("/");
  });

  it("normalises dot segments without leaving the site", () => {
    expect(safeRedirectPath("/a/../welcome")).toBe("/welcome");
  });
});
