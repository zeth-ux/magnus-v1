import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { lookupIsbn } = await import("./lookup");

const json = (body: unknown, ok = true) => ({ ok, json: async () => body }) as Response;

describe("book lookup", () => {
  it("uses Google Books when it knows the book (and forces https covers)", async () => {
    const f = vi.fn(async () =>
      json({
        items: [
          {
            volumeInfo: {
              title: "Klara and the Sun",
              authors: ["Kazuo Ishiguro"],
              publishedDate: "2021-03-02",
              imageLinks: { thumbnail: "http://books.google.com/x.jpg" },
            },
          },
        ],
      }),
    );
    const book = await lookupIsbn("9780571364879", f as unknown as typeof fetch);
    expect(book).toEqual({
      isbn: "9780571364879",
      title: "Klara and the Sun",
      authors: ["Kazuo Ishiguro"],
      coverUrl: "https://books.google.com/x.jpg",
      year: 2021,
    });
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("falls back to Open Library when Google has nothing", async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(json({ totalItems: 0 }))
      .mockResolvedValueOnce(
        json({
          "ISBN:9780099448822": {
            title: "Norwegian Wood",
            authors: [{ name: "Haruki Murakami" }],
            publish_date: "2000",
            cover: { medium: "https://covers.openlibrary.org/b/id/1-M.jpg" },
          },
        }),
      );
    const book = await lookupIsbn("9780099448822", f as unknown as typeof fetch);
    expect(book?.title).toBe("Norwegian Wood");
    expect(book?.authors).toEqual(["Haruki Murakami"]);
    expect(book?.year).toBe(2000);
  });

  it("returns null (never throws) when both sources fail", async () => {
    const f = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(json({}, false));
    expect(await lookupIsbn("9780000000002", f as unknown as typeof fetch)).toBeNull();
  });
});
