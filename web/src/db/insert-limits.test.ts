import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { listCopy, makeUser, pgliteDb, type TestDb } from "./test-db";

let db: TestDb;
beforeAll(async () => {
  db = await pgliteDb();
}, 60_000);
afterAll(async () => {
  await db?.close();
});

describe("limits on adding rows", () => {
  it("allows 30 new listings a day, then explains", async () => {
    const owner = await makeUser(db, "Flooder");
    for (let i = 0; i < 30; i++) await listCopy(db, owner);
    await expect(listCopy(db, owner)).rejects.toThrow(/a lot of books for one day/);
  });

  it("counts only the owner's own listings", async () => {
    const other = await makeUser(db, "Calm");
    await expect(listCopy(db, other)).resolves.toBeTruthy();
  });

  it("caps the shelf at 200 books on it; withdrawn ones don't count", async () => {
    const owner = await makeUser(db, "BigShelf");
    await db.admin("insert into public.books (isbn, title) select '978' || lpad(g::text, 10, '5'), 'B' from generate_series(1, 202) g on conflict do nothing");
    // Listed two days ago, so the daily limit isn't what stops it.
    await db.admin(`insert into public.copies (owner_id, isbn, mode, created_at) select '${owner}', '978' || lpad(g::text, 10, '5'), 'give', now() - interval '2 days' from generate_series(1, 199) g`);
    await expect(listCopy(db, owner)).resolves.toBeTruthy(); // the 200th
    await expect(listCopy(db, owner)).rejects.toThrow(/shelf is full/);
    await db.admin(`update public.copies set status = 'withdrawn' where id = (select id from public.copies where owner_id = '${owner}' limit 1)`);
    await expect(listCopy(db, owner)).resolves.toBeTruthy();
  });

  it("never stops a reader at the cap from receiving a given book (gives change owner, they don't insert)", async () => {
    const full = await makeUser(db, "FullShelf");
    const giver = await makeUser(db, "Giver200");
    await listCopy(db, full); // a listing of their own (earns the starter credit to spend)
    await db.admin("insert into public.books (isbn, title) select '978' || lpad(g::text, 10, '6'), 'F' from generate_series(1, 199) g on conflict do nothing");
    await db.admin(`insert into public.copies (owner_id, isbn, mode, created_at) select '${full}', '978' || lpad(g::text, 10, '6'), 'give', now() - interval '2 days' from generate_series(1, 199) g`);
    const copy = await listCopy(db, giver);
    const [{ request_copy: id }] = await db.as(full, "select public.request_copy($1)", [copy]);
    await db.as(giver, "select public.respond_request($1, true)", [id]);
    await db.as(giver, "select public.confirm_handover($1)", [id]);
    await db.as(full, "select public.confirm_handover($1)", [id]);
    const [row] = await db.admin("select owner_id from public.copies where id = $1", [copy]);
    expect(row.owner_id).toBe(full);
  });

  it("re-adding a wishlist book at the cap does nothing instead of saying 'full'", async () => {
    const reader = await makeUser(db, "Rewisher");
    await db.admin("insert into public.books (isbn, title) select '979' || lpad((g + 5000)::text, 10, '0'), 'R' from generate_series(1, 200) g on conflict do nothing");
    await db.admin(`insert into public.wishlist (user_id, isbn) select '${reader}', '979' || lpad((g + 5000)::text, 10, '0') from generate_series(1, 200) g`);
    await expect(db.as(reader, "insert into public.wishlist (user_id, isbn) values ($1, $2) on conflict do nothing", [reader, "9790000005001"])).resolves.toBeDefined();
  });

  it("caps the wishlist at 200 books", async () => {
    const reader = await makeUser(db, "Wisher");
    await db.admin("insert into public.books (isbn, title) select '979' || lpad(g::text, 10, '0'), 'W' from generate_series(1, 201) g on conflict do nothing");
    await db.admin(`insert into public.wishlist (user_id, isbn) select '${reader}', '979' || lpad(g::text, 10, '0') from generate_series(1, 200) g`);
    await expect(db.as(reader, "insert into public.wishlist (user_id, isbn) values ($1, $2)", [reader, "9790000000201"])).rejects.toThrow(/wishlist is full/);
  });
});
