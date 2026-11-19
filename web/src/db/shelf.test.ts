import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { listCopy, makeUser, pgliteDb, type TestDb } from "./test-db";
import { AREAS } from "@/lib/books/validate";

let db: TestDb;
beforeAll(async () => {
  db = await pgliteDb();
}, 60_000);
afterAll(async () => {
  await db?.close();
});

describe("the open shelf (signed-out browsing)", () => {
  const SAFE = ["area", "authors", "condition", "copy_id", "cover_url", "isbn", "lend_max", "mode", "title"];

  it("public_search_shelf shows the book, give/lend, condition and area: never the owner, their note or the listing time", async () => {
    const owner = await makeUser(db, "Noor");
    const copy = await listCopy(db, owner, "lend", "4_weeks");
    await db.as(owner, "update public.copies set note = 'WhatsApp me on +821012345678' where id = $1", [copy]);
    await db.admin("set role anon");
    const rows = await db.admin("select * from public.public_search_shelf(null, null)");
    await db.admin("reset role");
    const row = rows.find((r) => r.copy_id === copy);
    expect(row).toBeDefined();
    // Test readers live in "Sa-dong", which isn't one of the app's areas, so the public sees "Ansan".
    expect(row).toMatchObject({ mode: "lend", lend_max: "4_weeks", area: "Ansan" });
    expect(Object.keys(row!).sort()).toEqual(SAFE);
    expect(JSON.stringify(rows)).not.toMatch(/Noor|WhatsApp|\+8210/);
    expect(JSON.stringify(rows)).not.toContain(owner);
  });

  it("public_search_shelf searches title and author, filters give/lend, and caps the search text", async () => {
    const u = await makeUser(db, "Seeker");
    const isbn = "9780143127550";
    await db.as(u, "insert into public.books (isbn, title, authors) values ($1, 'Pachinko', '{Min Jin Lee}')", [isbn]);
    await db.as(u, "insert into public.copies (owner_id, isbn, mode) values ($1, $2, 'give')", [u, isbn]);
    await db.admin("set role anon");
    try {
      expect(await db.admin("select title from public.public_search_shelf('pachinko', null)")).toEqual([{ title: "Pachinko" }]);
      expect(await db.admin("select 1 from public.public_search_shelf('MIN JIN', null)")).toHaveLength(1);
      expect(await db.admin("select 1 from public.public_search_shelf('pachinko', 'lend')")).toHaveLength(0);
      expect(await db.admin("select 1 from public.public_search_shelf('%', null)")).toHaveLength(0);
      // A huge search is cut to 100 characters, not refused with an error.
      await db.admin("select 1 from public.public_search_shelf($1, null)", ["x".repeat(10_000)]);
    } finally {
      await db.admin("reset role");
    }
  });

  it("only available books: paused, lent-out and withdrawn copies don't open or show up in search", async () => {
    const owner = await makeUser(db, "Hana");
    const borrower = await makeUser(db, "Bora");
    await listCopy(db, borrower);
    const open = await listCopy(db, owner, "give");
    const paused = await listCopy(db, owner, "give");
    const withdrawn = await listCopy(db, owner, "give");
    const lent = await listCopy(db, owner, "lend", "4_weeks");
    await db.as(owner, "update public.copies set status = 'paused', note = 'my flat is 302' where id = $1", [paused]);
    await db.as(owner, "update public.copies set note = 'call me' where id = $1", [open]);
    await db.as(owner, "select public.withdraw_copy($1)", [withdrawn]);
    const due = new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10);
    const [{ request_copy: req }] = await db.as(borrower, "select public.request_copy($1, $2::date)", [lent, due]);
    await db.as(owner, "select public.respond_request($1, true)", [req]);
    await db.as(owner, "select public.confirm_handover($1)", [req]);
    await db.as(borrower, "select public.confirm_handover($1)", [req]);
    expect((await db.admin("select status from public.copies where id = $1", [lent]))[0].status).toBe("on_loan");

    await db.admin("set role anon");
    try {
      const [row] = await db.admin("select * from public.public_copy($1)", [open]);
      expect(row).toBeDefined();
      expect(Object.keys(row).sort()).toEqual([...SAFE, "published_year"].sort());
      expect(JSON.stringify(row)).not.toMatch(/Hana|call me/);
      // Missing, paused, lent out or withdrawn all look the same: nothing (so nobody can tell a book is out with someone).
      for (const id of [paused, withdrawn, lent]) {
        expect(await db.admin("select * from public.public_copy($1)", [id]), id).toHaveLength(0);
      }
      const listed = (await db.admin("select copy_id from public.public_search_shelf(null, null)")).map((r) => r.copy_id);
      expect(listed).toContain(open);
      for (const id of [paused, withdrawn, lent]) expect(listed).not.toContain(id);
      expect(await db.admin("select * from public.public_copy($1)", ["00000000-0000-4000-8000-000000000000"])).toHaveLength(0);
    } finally {
      await db.admin("reset role");
    }
  });
});

describe("areas the public can see", () => {
  it("are only the app's own list of areas, or plain \"Ansan\" (never what someone typed)", async () => {
    for (const area of AREAS) {
      expect((await db.admin("select public.public_area($1) as a", [area]))[0].a, area).toBe(area);
    }
    for (const typed of ["Gojan-dong, Lotte apt 104-302", "sa-dong (erica)", "", null]) {
      expect((await db.admin("select public.public_area($1) as a", [typed]))[0].a, String(typed)).toBe("Ansan");
    }
  });

  it("a typed address never reaches the open shelf or the landing page", async () => {
    const u = await makeUser(db, "Typist");
    const copy = await listCopy(db, u, "give");
    // Straight through the API, past the app's form.
    await db.as(u, "update public.profiles set area = 'Gojan-dong, Lotte apt 104-302' where id = $1", [u]);
    await db.admin("set role anon");
    try {
      for (const sql of ["select * from public.public_search_shelf(null, null)", "select * from public.public_shelf(24)"]) {
        expect(JSON.stringify(await db.admin(sql)), sql).not.toContain("104-302");
      }
      const [row] = await db.admin("select area from public.public_copy($1)", [copy]);
      expect(row.area).toBe("Ansan");
    } finally {
      await db.admin("reset role");
    }
  });
});

describe("the shelf, read side", () => {
  it("public_shelf shows exactly the book, give/lend and area: no name, note or listing time", async () => {
    const aina = await makeUser(db, "Aina");
    const copy = await listCopy(db, aina, "lend", "4_weeks");
    await db.as(aina, "update public.copies set note = 'WhatsApp me on +821012345678' where id = $1", [copy]);
    await db.admin("set role anon");
    const rows = await db.admin("select * from public.public_shelf(24)");
    await db.admin("reset role");
    const row = rows.find((r) => r.copy_id === copy);
    expect(row).toBeDefined();
    expect(row).toMatchObject({ mode: "lend", lend_max: "4_weeks", area: "Ansan" });
    expect(Object.keys(row!).sort()).toEqual(["area", "authors", "copy_id", "isbn", "lend_max", "mode", "title"]);
    expect(JSON.stringify(rows)).not.toMatch(/Aina|WhatsApp/);
  });

  it("public_shelf leaves out paused, withdrawn and lent copies, and caps the count", async () => {
    const u = await makeUser(db, "Pauser");
    const borrower = await makeUser(db, "Borrow");
    await listCopy(db, borrower);
    const paused = await listCopy(db, u);
    const withdrawn = await listCopy(db, u);
    const lent = await listCopy(db, u, "lend", "4_weeks");
    await db.as(u, "update public.copies set status = 'paused' where id = $1", [paused]);
    await db.as(u, "select public.withdraw_copy($1)", [withdrawn]);
    const due = new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10);
    const [{ request_copy: id }] = await db.as(borrower, "select public.request_copy($1, $2::date)", [lent, due]);
    await db.as(u, "select public.respond_request($1, true)", [id]);
    await db.as(u, "select public.confirm_handover($1)", [id]);
    await db.as(borrower, "select public.confirm_handover($1)", [id]);
    const ids = (await db.admin("select copy_id from public.public_shelf(24)")).map((r) => r.copy_id);
    expect(ids).not.toContain(paused);
    expect(ids).not.toContain(withdrawn);
    expect(ids).not.toContain(lent);
    for (let i = 0; i < 26; i++) await listCopy(db, u);
    expect(await db.admin("select 1 from public.public_shelf(1000)")).toHaveLength(24);
  });

  it("search_shelf finds by title or author, filters give/lend, and isn't open to anonymous visitors", async () => {
    const u = await makeUser(db, "Searcher");
    const isbn = "9780571364879";
    await db.as(u, "insert into public.books (isbn, title, authors) values ($1, 'Klara and the Sun', '{Kazuo Ishiguro}')", [isbn]);
    await db.as(u, "insert into public.copies (owner_id, isbn, mode) values ($1, $2, 'give')", [u, isbn]);

    const byTitle = await db.as(u, "select title, owner_name from public.search_shelf('klara', null)");
    expect(byTitle).toEqual([{ title: "Klara and the Sun", owner_name: "Searcher" }]);
    expect(await db.as(u, "select 1 from public.search_shelf('ISHIGURO', null)")).toHaveLength(1);
    expect(await db.as(u, "select 1 from public.search_shelf('klara', 'lend')")).toHaveLength(0);
    expect(await db.as(u, "select 1 from public.search_shelf('%', null)")).toHaveLength(0);

    await db.admin("set role anon");
    await expect(db.admin("select * from public.search_shelf(null, null)")).rejects.toThrow(/permission denied/);
    await db.admin("reset role");
  });
});
