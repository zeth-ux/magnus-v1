import { describe, expect, it } from "vitest";
import { composeShelf, dressCopy, type PublicShelfRow } from "./dress";

const row = (i: number, extra: Partial<PublicShelfRow> = {}): PublicShelfRow => ({
  copy_id: `00000000-0000-0000-0000-00000000000${i}`,
  isbn: `978000000000${i}`,
  title: `Book ${i}`,
  authors: ["An Author"],
  mode: "lend",
  lend_max: "4_weeks",
  area: "Gojan-dong",
  ...extra,
});

describe("dressing real copies for the shelf", () => {
  it("gives the same ISBN the same look every time, within the shelf's sizes", () => {
    const a = dressCopy(row(1));
    const b = dressCopy(row(1, { copy_id: "another" }));
    expect([a.colour, a.pattern, a.thick, a.length]).toEqual([b.colour, b.pattern, b.thick, b.length]);
    expect(a.thick).toBeGreaterThanOrEqual(40);
    expect(a.thick).toBeLessThan(88);
    expect(a.length).toBeGreaterThanOrEqual(0.82);
    expect(a.length).toBeLessThanOrEqual(1);
  });

  it("keeps owners anonymous and labels the lend period", () => {
    expect(dressCopy(row(2))).toMatchObject({ owner: "A reader", area: "Gojan-dong", lendFor: "4 weeks", sample: false, note: "" });
    expect(dressCopy(row(3, { mode: "give", lend_max: null })).lendFor).toBeUndefined();
  });

  it("puts real copies first and fills up with samples", () => {
    const shelf = composeShelf([row(1), row(2)], 9);
    expect(shelf).toHaveLength(9);
    expect(shelf.slice(0, 2).every((c) => c.sample === false)).toBe(true);
    expect(shelf.slice(2).every((c) => c.sample === true)).toBe(true);
    expect(composeShelf(Array.from({ length: 12 }, (_, i) => row(i % 10)), 9)).toHaveLength(9);
  });
});
