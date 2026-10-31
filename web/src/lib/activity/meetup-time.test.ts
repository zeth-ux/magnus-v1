import { describe, expect, it } from "vitest";
import { formatSeoul, seoulLocalToIso, seoulPickerMin } from "./meetup-time";

describe("meet-up times (Seoul)", () => {
  it("reads a picker value as Seoul time", () => {
    expect(seoulLocalToIso("2026-11-07T15:00")).toBe("2026-11-07T06:00:00.000Z");
    expect(seoulLocalToIso("2026-11-01T08:30")).toBe("2026-10-31T23:30:00.000Z");
  });

  it("rejects impossible or malformed values", () => {
    expect(seoulLocalToIso("2026-11-31T10:00")).toBeNull();
    expect(seoulLocalToIso("2026-11-07 15:00")).toBeNull();
    expect(seoulLocalToIso("2026-11-07T25:00")).toBeNull();
  });

  it("shows instants in Seoul time", () => {
    expect(formatSeoul("2026-11-07T06:00:00.000Z")).toBe("Sat 7 Nov, 3:00 pm");
  });

  it("starts the picker at the next hour in Seoul", () => {
    expect(seoulPickerMin(new Date("2026-11-01T15:30:00Z"))).toBe("2026-11-02T01:00");
  });
});
