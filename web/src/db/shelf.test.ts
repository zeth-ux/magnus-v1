import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { listCopy, makeUser, pgliteDb, type TestDb } from "./test-db";

let db: TestDb;
beforeAll(async () => {
  db = await pgliteDb();
}, 60_000);
afterAll(async () => {
  await db?.close();
});

describe("the shelf, read side", () => {
  it("public_shelf shows available copies with the area, never the owner's name", async () => {
    const aina = await makeUser(db, "Aina");
    const copy = await listCopy(db, aina, "lend", "4_weeks");
    await db.admin("set role anon");
    const rows = await db.admin("select * from public.public_shelf(10)");
    await db.admin("reset role");
    const row = rows.find((r) => r.copy_id === copy);
    expect(row).toMatchObject({ mode: "lend", lend_max: "4_weeks", area: "Sa-dong" });
    expect(Object.keys(row!)).not.toContain("owner_name");
    expect(JSON.stringify(rows)).not.toContain("Aina");
  });

  it("public_shelf leaves out paused copies", async () => {
    const u = await makeUser(db, "Pauser");
    const copy = await listCopy(db, u);
    await db.as(u, "update public.copies set status = 'paused' where id = $1", [copy]);
    const rows = await db.admin("select copy_id from public.public_shelf(48)");
    expect(rows.map((r) => r.copy_id)).not.toContain(copy);
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
