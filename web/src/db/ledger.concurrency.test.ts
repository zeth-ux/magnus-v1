/**
 * Concurrency (ADR 003: "available credits never go below 0, including under
 * concurrent requests"). Needs two real connections at once, so it runs
 * against a real Postgres server: set TEST_DATABASE_URL (CI does).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { credits, listCopy, makeUser, POSTGRES_URL, postgresDb } from "./test-db";

type Db = Awaited<ReturnType<typeof postgresDb>>;

describe.skipIf(!POSTGRES_URL)("concurrent credit spending (real Postgres)", () => {
  let db: Db;
  beforeAll(async () => {
    db = await postgresDb();
  }, 60_000);
  afterAll(async () => {
    await db?.close();
  });

  it("two handovers racing on one credit: exactly one wins", async () => {
    for (let round = 0; round < 10; round++) {
      const o1 = await makeUser(db, `RaceOwnerA${round}`);
      const o2 = await makeUser(db, `RaceOwnerB${round}`);
      const reader = await makeUser(db, `Racer${round}`);
      const c1 = await listCopy(db, o1);
      const c2 = await listCopy(db, o2);
      await listCopy(db, reader); // exactly 1 credit
      const ids: string[] = [];
      for (const [owner, copy] of [[o1, c1], [o2, c2]] as const) {
        const [{ request_copy: id }] = await db.as(reader, "select public.request_copy($1)", [copy]);
        await db.as(owner, "select public.respond_request($1, true)", [id]);
        await db.as(owner, "select public.confirm_handover($1)", [id]);
        ids.push(id as string);
      }

      const results = await Promise.allSettled(ids.map((id) => db.as(reader, "select public.confirm_handover($1)", [id])));
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      expect(await credits(db, reader)).toEqual({ balance: 0, locked: 0, available: 0 });
    }
  });

  it("a lend lock and a give racing on one credit: exactly one wins", async () => {
    const lender = await makeUser(db, "RaceLender");
    const giver = await makeUser(db, "RaceGiver");
    const reader = await makeUser(db, "RaceReader");
    const lend = await listCopy(db, lender, "lend", "4_weeks");
    const give = await listCopy(db, giver);
    await listCopy(db, reader);
    const returnBy = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
    const [{ request_copy: r1 }] = await db.as(reader, "select public.request_copy($1, $2::date)", [lend, returnBy]);
    const [{ request_copy: r2 }] = await db.as(reader, "select public.request_copy($1)", [give]);
    for (const [owner, id] of [[lender, r1], [giver, r2]] as const) {
      await db.as(owner, "select public.respond_request($1, true)", [id]);
      await db.as(owner, "select public.confirm_handover($1)", [id]);
    }
    const results = await Promise.allSettled([r1, r2].map((id) => db.as(reader, "select public.confirm_handover($1)", [id])));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const c = await credits(db, reader);
    expect(c.available).toBe(0);
    expect(c.available).toBeGreaterThanOrEqual(0);
  });

  it("racing requests can't get past the 3 open requests limit", async () => {
    const reader = await makeUser(db, "Rusher");
    await listCopy(db, reader);
    const owner = await makeUser(db, "Shelf");
    const copies = [];
    for (let i = 0; i < 6; i++) copies.push(await listCopy(db, owner));
    await Promise.allSettled(copies.map((c) => db.as(reader, "select public.request_copy($1)", [c])));
    const [row] = await db.admin(
      "select count(*)::int as n from public.requests where requester_id = $1 and status in ('requested', 'accepted')",
      [reader],
    );
    expect(Number(row.n)).toBe(3);
  });
});
