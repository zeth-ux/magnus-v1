import { describe, expect, it } from "vitest";
import { activeIndex, bookX, copiesFor, dims, nearestTarget, openness, push, wrapRel } from "./geometry";

const D = dims(400);

describe("turning shelf geometry", () => {
  it("opens only the centre book", () => {
    expect(openness(0)).toBe(1);
    expect(openness(1)).toBe(0);
    expect(openness(-2)).toBe(0);
    expect(openness(0.5)).toBeCloseTo(0.5);
  });

  it("moves smoothly: no jump anywhere as s slides", () => {
    for (let r = -3; r < 3; r += 0.01) {
      expect(Math.abs(bookX(r + 0.01, D) - bookX(r, D))).toBeLessThan((D.ws + D.gap + D.d) * 0.03);
    }
    expect(push(1)).toBe(0.5);
    expect(push(-1)).toBe(-0.5);
  });

  it("makes room for the open cover: neighbours sit clear of it", () => {
    // The book next to the open one must start after half the cover.
    expect(bookX(1, D) - D.ws / 2).toBeGreaterThan(D.d / 2);
    expect(bookX(-1, D) + D.ws / 2).toBeLessThan(-D.d / 2);
  });

  it("wraps endlessly", () => {
    expect(wrapRel(29, 0, 30)).toBe(-1);
    expect(wrapRel(1, 0, 30)).toBe(1);
    expect(wrapRel(0, 29.5, 30)).toBeCloseTo(0.5);
  });

  it("finds the active book and the shortest way to another", () => {
    expect(activeIndex(-1, 9)).toBe(8);
    expect(activeIndex(18.4, 9)).toBe(0);
    expect(nearestTarget(18, 8, 9)).toBe(17); // one step back, not eight forward
    expect(nearestTarget(18, 3, 9)).toBe(21);
  });

  it("renders enough copies for a short shelf", () => {
    expect(copiesFor(4)).toBe(6);
    expect(copiesFor(20)).toBe(3);
  });
});
