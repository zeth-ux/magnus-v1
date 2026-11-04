import { describe, expect, it } from "vitest";
import { firstSteps } from "./steps";

describe("firstSteps", () => {
  it("starts with the library card", () => {
    const r = firstSteps({ card: false, book: false, ask: false })!;
    expect(r.current).toBe(0);
    expect(r.steps.map((s) => s.href)).toEqual(["/me", "/add", "/browse"]);
  });
  it("points at the first step not done", () => {
    expect(firstSteps({ card: true, book: false, ask: false })!.current).toBe(1);
    expect(firstSteps({ card: true, book: true, ask: false })!.current).toBe(2);
    // Someone who asked before listing still sees the book step.
    expect(firstSteps({ card: true, book: false, ask: true })!.current).toBe(1);
  });
  it("disappears once all three are done", () => {
    expect(firstSteps({ card: true, book: true, ask: true })).toBeNull();
  });
});
