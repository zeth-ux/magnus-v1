import { describe, expect, it } from "vitest";
import { codeErrorMessage, normaliseCode } from "./otp";

describe("normaliseCode", () => {
  it("accepts 6 to 8 digits, with spaces or dashes from pasting", () => {
    expect(normaliseCode("123456")).toBe("123456");
    expect(normaliseCode(" 123 456 ")).toBe("123456");
    expect(normaliseCode("1234-5678")).toBe("12345678");
  });
  it("refuses anything else", () => {
    for (const bad of ["12345", "123456789", "12345a", "", "１２３４５６", null, undefined, 123456]) {
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
