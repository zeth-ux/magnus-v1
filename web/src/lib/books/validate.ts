/**
 * Server-side validation for the profile and add-a-book forms (CLAUDE.md:
 * validate all user input on the server). Pure functions: easy to test.
 */
import { normalizeIsbn } from "./isbn";

export const AREAS = [
  "Sa-dong (ERICA)",
  "Il-dong",
  "Bono-dong",
  "Gojan-dong",
  "Jungang-dong",
  "Wa-dong",
  "Choji-dong",
  "Seonbu-dong",
  "Hosu-dong",
  "Other part of Ansan",
] as const;

export const LEND_MAX = { "2_weeks": "2 weeks", "4_weeks": "4 weeks", "2_months": "2 months", flexible: "Flexible" } as const;
export const CONDITIONS = { like_new: "Like new", good: "Good", worn: "Well read" } as const;

export type FieldErrors = Record<string, string>;
export type Parsed<T> = { ok: true; value: T } | { ok: false; errors: FieldErrors };

const text = (form: FormData, key: string) => {
  const v = form.get(key);
  return typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
};

export type ProfileInput = { displayName: string; area: string; whatsapp: string | null };

/** WhatsApp in international form: "+60 12-345 6789" → "+60123456789". */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, "");
  return /^\+[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

export function parseProfile(form: FormData): Parsed<ProfileInput> {
  const errors: FieldErrors = {};
  const displayName = text(form, "displayName");
  const area = text(form, "area");
  const phoneRaw = text(form, "whatsapp");

  if (displayName.length < 1 || displayName.length > 40) errors.displayName = "Use 1 to 40 characters.";
  if (!(AREAS as readonly string[]).includes(area)) errors.area = "Pick your area of Ansan.";
  const whatsapp = phoneRaw === "" ? null : normalizePhone(phoneRaw);
  if (phoneRaw !== "" && !whatsapp) errors.whatsapp = "Start with + and your country code, e.g. +60 12 345 6789 or +82 10 1234 5678.";

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: { displayName, area, whatsapp } };
}

export type CopyInput = {
  isbn: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  year: number | null;
  mode: "give" | "lend";
  lendMax: keyof typeof LEND_MAX | null;
  condition: keyof typeof CONDITIONS;
  note: string | null;
};

export function parseCopy(form: FormData): Parsed<CopyInput> {
  const errors: FieldErrors = {};
  const isbn = normalizeIsbn(text(form, "isbn"));
  const title = text(form, "title");
  const authors = text(form, "authors")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean)
    .slice(0, 10);
  const mode = text(form, "mode");
  const lendMax = text(form, "lendMax");
  const condition = text(form, "condition");
  const note = text(form, "note");
  const coverRaw = text(form, "coverUrl");
  const yearRaw = Number.parseInt(text(form, "year"), 10);

  if (!isbn) errors.isbn = "That doesn't look like a book's ISBN. Check the 13 digits under the barcode.";
  if (title.length < 1 || title.length > 300) errors.title = "Add the book's title.";
  if (authors.some((a) => a.length > 120)) errors.authors = "That author name is too long.";
  if (mode !== "give" && mode !== "lend") errors.mode = "Choose give or lend.";
  if (mode === "lend" && !(lendMax in LEND_MAX)) errors.lendMax = "Choose how long you'd lend it for.";
  if (!(condition in CONDITIONS)) errors.condition = "Choose the book's condition.";
  if (note.length > 280) errors.note = "Keep the note to 280 characters.";

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      isbn: isbn!,
      title,
      authors,
      coverUrl: /^https:\/\/[^\s]+$/.test(coverRaw) && coverRaw.length <= 500 ? coverRaw : null,
      year: Number.isFinite(yearRaw) && yearRaw >= 1450 && yearRaw <= 2100 ? yearRaw : null,
      mode: mode as "give" | "lend",
      lendMax: mode === "lend" ? (lendMax as keyof typeof LEND_MAX) : null,
      condition: condition as keyof typeof CONDITIONS,
      note: note === "" ? null : note,
    },
  };
}
