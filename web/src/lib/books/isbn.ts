/**
 * ISBN helpers. Everything in the database is an ISBN-13 (books.isbn), so
 * scanned or typed ISBN-10s are converted, and both kinds are checksum-checked.
 */

/** Keep digits (and a trailing X for ISBN-10s); drop spaces, hyphens, "ISBN" prefixes. */
function clean(input: string): string {
  return input.toUpperCase().replace(/^ISBN(?:-1[03])?:?/, "").replace(/[^0-9X]/g, "");
}

export function isValidIsbn13(isbn: string): boolean {
  if (!/^97[89]\d{10}$/.test(isbn)) return false;
  const sum = isbn
    .slice(0, 12)
    .split("")
    .reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0);
  return (10 - (sum % 10)) % 10 === Number(isbn[12]);
}

export function isValidIsbn10(isbn: string): boolean {
  if (!/^\d{9}[\dX]$/.test(isbn)) return false;
  const sum = isbn
    .split("")
    .reduce((acc, ch, i) => acc + (ch === "X" ? 10 : Number(ch)) * (10 - i), 0);
  return sum % 11 === 0;
}

export function isbn10to13(isbn10: string): string {
  const core = `978${isbn10.slice(0, 9)}`;
  const sum = core.split("").reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0);
  return `${core}${(10 - (sum % 10)) % 10}`;
}

/** Any ISBN a person might type or scan → a valid ISBN-13, or null. */
export function normalizeIsbn(input: string): string | null {
  const c = clean(input);
  if (c.length === 13 && isValidIsbn13(c)) return c;
  if (c.length === 10 && isValidIsbn10(c)) return isbn10to13(c);
  return null;
}
