import { describe, expect, it } from "vitest";
import { checkCodeInput, codeErrorMessage, normaliseCode } from "./otp";

describe("normaliseCode", () => {
  it("accepts 6 to 10 digits, with spaces, dashes or full-width digits", () => {
    expect(normaliseCode("123456")).toBe("123456");
    expect(normaliseCode(" 123 456 ")).toBe("123456");
    expect(normaliseCode("1234-5678")).toBe("12345678");
    expect(normaliseCode("12 34 56 78 90")).toBe("1234567890");
    expect(normaliseCode("１２３４５６")).toBe("123456");
  });
  it("refuses anything else", () => {
    for (const bad of ["12345", "12345678901", "12345a", "", null, undefined, 123456]) {
      expect(normaliseCode(bad)).toBeNull();
    }
  });
});

describe("codeErrorMessage", () => {
  it("explains expired codes and rate limits plainly", () => {
    expect(codeErrorMessage("otp_expired")).toMatch(/wrong or has expired/);
    expect(codeErrorMessage("over_request_rate_limit")).toMatch(/Too many tries/);
    expect(codeErrorMessage(undefined)).toMatch(/couldn't check/);
  });
});

describe("checkCodeInput", () => {
  it("passes a good email and code through, tidied", () => {
    expect(checkCodeInput(" Reader@Example.com ", "123 456")).toEqual({ ok: true, email: "reader@example.com", token: "123456" });
  });
  it("stops a bad email or code before anything is sent", () => {
    expect(checkCodeInput("not-an-email", "123456").ok).toBe(false);
    expect(checkCodeInput("a@b.co", "12").ok).toBe(false);
  });
});
