import { describe, expect, it } from "vitest";
import { canonicalRedirect, productionOrigin } from "./canonical";

const prod = { VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: "magnus-v1.vercel.app" };

describe("canonicalRedirect", () => {
  it("sends other production hosts to the production domain, keeping path and query", () => {
    expect(canonicalRedirect("magnus-v1-merey-jago.vercel.app", "/?code=abc", prod)).toBe("https://magnus-v1.vercel.app/?code=abc");
    expect(canonicalRedirect("magnus-v1-merey-jago.vercel.app", "/login?next=%2Fbrowse", prod)).toBe("https://magnus-v1.vercel.app/login?next=%2Fbrowse");
  });
  it("never redirects the production domain to itself (any case, any port)", () => {
    expect(canonicalRedirect("magnus-v1.vercel.app", "/browse", prod)).toBeNull();
    expect(canonicalRedirect("Magnus-V1.vercel.app", "/", prod)).toBeNull();
    expect(canonicalRedirect("magnus-v1.vercel.app:443", "/", prod)).toBeNull();
  });
  it("leaves previews, local and missing hosts alone", () => {
    expect(canonicalRedirect("magnus-git-fix-merey-jago.vercel.app", "/", { ...prod, VERCEL_ENV: "preview" })).toBeNull();
    expect(canonicalRedirect("localhost:3000", "/", {})).toBeNull();
    expect(canonicalRedirect(null, "/", prod)).toBeNull();
  });
  it("does nothing when the production domain is missing or odd", () => {
    expect(canonicalRedirect("x.vercel.app", "/", { VERCEL_ENV: "production" })).toBeNull();
    expect(canonicalRedirect("x.vercel.app", "/", { VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: "https://evil.com/x" })).toBeNull();
  });
});

describe("productionOrigin", () => {
  it("is the production domain on production only", () => {
    expect(productionOrigin(prod)).toBe("https://magnus-v1.vercel.app");
    expect(productionOrigin({ ...prod, VERCEL_ENV: "preview" })).toBeNull();
    expect(productionOrigin({ VERCEL_ENV: "production" })).toBeNull();
  });
});
