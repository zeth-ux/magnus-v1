import { describe, expect, it } from "vitest";
import { isRealDate, seoulDate } from "./dates";

describe("dates", () => {
  it("uses Seoul's date, not UTC's", () => {
    const lateUtc = new Date("2026-11-01T15:30:00Z"); // 00:30 on 2 Nov in Seoul
    expect(seoulDate(0, lateUtc)).toBe("2026-11-02");
    expect(seoulDate(1, lateUtc)).toBe("2026-11-03");
  });

  it("rejects dates that don't exist", () => {
    expect(isRealDate("2026-11-30")).toBe(true);
    expect(isRealDate("2026-02-30")).toBe(false);
    expect(isRealDate("2026-2-3")).toBe(false);
  });
});
