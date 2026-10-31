import { describe, expect, it } from "vitest";
import { normalizePhone, parseCopy, parseProfile } from "./validate";

const form = (o: Record<string, string>) => {
  const f = new FormData();
  Object.entries(o).forEach(([k, v]) => f.set(k, v));
  return f;
};

describe("profile validation", () => {
  it("accepts a name, an area and an optional international WhatsApp number", () => {
    expect(parseProfile(form({ displayName: "  Aina  ", area: "Sa-dong (ERICA)", whatsapp: "+60 12-345 6789" }))).toEqual({
      ok: true,
      value: { displayName: "Aina", area: "Sa-dong (ERICA)", whatsapp: "+60123456789" },
    });
    expect(parseProfile(form({ displayName: "Hafiz", area: "Gojan-dong", whatsapp: "" }))).toMatchObject({
      ok: true,
      value: { whatsapp: null },
    });
  });

  it("rejects an empty name, an unknown area and a local-format number", () => {
    const r = parseProfile(form({ displayName: " ", area: "Seoul", whatsapp: "010-1234-5678" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["area", "displayName", "whatsapp"]);
  });

  it("normalises phone numbers", () => {
    expect(normalizePhone("+82 10 1234 5678")).toBe("+821012345678");
    expect(normalizePhone("+0 123")).toBeNull();
  });
});

describe("copy validation", () => {
  const base = { isbn: "978-0-571-36487-9", title: "Klara and the Sun", authors: "Kazuo Ishiguro", condition: "good" };

  it("accepts a give and a lend with a maximum period", () => {
    expect(parseCopy(form({ ...base, mode: "give", lendMax: "4_weeks" }))).toMatchObject({
      ok: true,
      value: { isbn: "9780571364879", mode: "give", lendMax: null, authors: ["Kazuo Ishiguro"], note: null },
    });
    expect(parseCopy(form({ ...base, mode: "lend", lendMax: "2_months", note: "Coffee ring on p. 12" }))).toMatchObject({
      ok: true,
      value: { mode: "lend", lendMax: "2_months", note: "Coffee ring on p. 12" },
    });
  });

  it("needs a lend period for a lend, a valid ISBN and a short note", () => {
    const r = parseCopy(form({ ...base, isbn: "123", mode: "lend", lendMax: "forever", note: "x".repeat(281) }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["isbn", "lendMax", "note"]);
  });

  it("drops a cover URL that isn't https and an impossible year", () => {
    const r = parseCopy(form({ ...base, mode: "give", coverUrl: "javascript:alert(1)", year: "99999" }));
    expect(r).toMatchObject({ ok: true, value: { coverUrl: null, year: null } });
  });
});
