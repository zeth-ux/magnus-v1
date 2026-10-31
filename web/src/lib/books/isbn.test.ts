import { describe, expect, it } from "vitest";
import { isbn10to13, isValidIsbn10, isValidIsbn13, normalizeIsbn } from "./isbn";

describe("ISBN", () => {
  it("accepts a valid ISBN-13 with or without hyphens", () => {
    expect(normalizeIsbn("978-0-571-36487-9")).toBe("9780571364879"); // Klara and the Sun
    expect(normalizeIsbn("ISBN 9780571364879")).toBe("9780571364879");
  });

  it("converts ISBN-10 to ISBN-13", () => {
    expect(isValidIsbn10("0099448823")).toBe(true); // Norwegian Wood (Vintage)
    expect(isbn10to13("0099448823")).toBe("9780099448822");
    expect(normalizeIsbn("0-09-944882-3")).toBe("9780099448822");
  });

  it("handles an X check digit", () => {
    expect(isValidIsbn10("080442957X")).toBe(true);
    expect(normalizeIsbn("0-8044-2957-x")).toBe("9780804429573");
  });

  it("rejects bad checksums, wrong lengths and non-book barcodes", () => {
    expect(normalizeIsbn("9780571364878")).toBeNull();
    expect(normalizeIsbn("12345")).toBeNull();
    expect(normalizeIsbn("8801234567893")).toBeNull(); // a product EAN, not a book
    expect(isValidIsbn13("9790000000002")).toBe(false);
  });
});
