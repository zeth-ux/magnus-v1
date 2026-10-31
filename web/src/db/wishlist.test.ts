import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeUser, pgliteDb, type TestDb } from "./test-db";

let db: TestDb;
beforeAll(async () => {
  db = await pgliteDb();
}, 60_000);
afterAll(async () => {
  await db?.close();
});

const ISBN = "9780571364879";

describe("wishlist", () => {
  it("each reader sees and edits only their own wishlist; counts are shared, names are not", async () => {
    const aina = await makeUser(db, "WishAina");
    const hafiz = await makeUser(db, "WishHafiz");
    await db.as(aina, "insert into public.books (isbn, title) values ($1, 'Klara and the Sun') on conflict do nothing", [ISBN]);
    await db.as(aina, "insert into public.wishlist (user_id, isbn) values ($1, $2)", [aina, ISBN]);
    await db.as(hafiz, "insert into public.wishlist (user_id, isbn) values ($1, $2)", [hafiz, ISBN]);
    await expect(db.as(hafiz, "insert into public.wishlist (user_id, isbn) values ($1, $2)", [aina, "9780099448822"])).rejects.toThrow();

    expect(await db.as(aina, "select user_id from public.wishlist")).toEqual([{ user_id: aina }]);
    // Counts the other readers only (Hafiz sees Aina, not himself).
    const [{ wish_count: n }] = await db.as(hafiz, "select public.wish_count($1)", [ISBN]);
    expect(Number(n)).toBe(1);

    await db.as(hafiz, "delete from public.wishlist where user_id = $1", [aina]); // RLS: removes nothing of Aina's
    expect(await db.as(aina, "select 1 from public.wishlist")).toHaveLength(1);
  });

  it("wished_and_available lists available copies of wished books, not your own, paused, lent or withdrawn ones, nor other readers' wishes", async () => {
    const reader = await makeUser(db, "Wisher");
    const owner = await makeUser(db, "Lister");
    await db.as(reader, "insert into public.books (isbn, title) values ('9780099448822', 'Norwegian Wood') on conflict do nothing");
    await db.as(reader, "insert into public.wishlist (user_id, isbn) values ($1, '9780099448822')", [reader]);
    const [{ id: theirs }] = await db.as(owner, "insert into public.copies (owner_id, isbn, mode) values ($1, '9780099448822', 'give') returning id", [owner]);
    await db.as(reader, "insert into public.copies (owner_id, isbn, mode) values ($1, '9780099448822', 'give')", [reader]);
    const [{ id: paused }] = await db.as(owner, "insert into public.copies (owner_id, isbn, mode) values ($1, '9780099448822', 'give') returning id", [owner]);
    await db.as(owner, "update public.copies set status = 'paused' where id = $1", [paused]);

    const [{ id: withdrawn }] = await db.as(owner, "insert into public.copies (owner_id, isbn, mode) values ($1, '9780099448822', 'give') returning id", [owner]);
    await db.as(owner, "select public.withdraw_copy($1)", [withdrawn]);
    // Someone else wishes for another book that is on the shelf: not in my list.
    const other = await makeUser(db, "OtherWisher");
    await db.as(other, "insert into public.books (isbn, title) values ('9780804429573', 'Another') on conflict do nothing");
    await db.as(other, "insert into public.wishlist (user_id, isbn) values ($1, '9780804429573')", [other]);
    await db.as(owner, "insert into public.copies (owner_id, isbn, mode) values ($1, '9780804429573', 'give')", [owner]);

    const rows = await db.as(reader, "select copy_id, owner_name from public.wished_and_available()");
    expect(rows).toEqual([{ copy_id: theirs, owner_name: "Lister" }]);
  });

  it("isn't open to anonymous visitors", async () => {
    await db.admin("set role anon");
    try {
      await expect(db.admin("select * from public.wishlist")).rejects.toThrow(/permission denied/);
      await expect(db.admin("select public.wish_count('9780099448822')")).rejects.toThrow(/permission denied/);
      await expect(db.admin("select * from public.wished_and_available()")).rejects.toThrow(/permission denied/);
    } finally {
      await db.admin("reset role");
    }
  });
});
