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

  it("caps the wishlist at 200 books", async () => {
    const reader = await makeUser(db, "Wisher");
    await db.admin("insert into public.books (isbn, title) select '979' || lpad(g::text, 10, '0'), 'W' from generate_series(1, 201) g on conflict do nothing");
    await db.admin(`insert into public.wishlist (user_id, isbn) select '${reader}', '979' || lpad(g::text, 10, '0') from generate_series(1, 200) g`);
    await expect(db.as(reader, "insert into public.wishlist (user_id, isbn) values ($1, $2)", [reader, "9790000000201"])).rejects.toThrow(/wishlist is full/);
  });
});
