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
    expect((await credits(db, reader)).available).toBe(0);
  });

  it("both people confirming the handover at the same moment moves credits once", async () => {
    for (let round = 0; round < 5; round++) {
      const owner = await makeUser(db, `SameMomentOwner${round}`);
      const reader = await makeUser(db, `SameMomentReader${round}`);
      const copy = await listCopy(db, owner);
      await listCopy(db, reader);
      const [{ request_copy: id }] = await db.as(reader, "select public.request_copy($1)", [copy]);
      await db.as(owner, "select public.respond_request($1, true)", [id]);
      await Promise.all([owner, reader].map((u) => db.as(u, "select public.confirm_handover($1)", [id])));
      expect(await credits(db, owner)).toMatchObject({ balance: 2 });
      expect(await credits(db, reader)).toMatchObject({ balance: 0 });
    }
  });

  // Smoke test: the timing that triggered a deadlock with FOR UPDATE is hard to hit on purpose,
  // so this checks the common case; the fix itself is FOR NO KEY UPDATE in lock_person().
  it("a new request during someone's handover goes through", async () => {
    for (let round = 0; round < 5; round++) {
      const owner = await makeUser(db, `DeadOwner${round}`);
      const reader = await makeUser(db, `DeadReader${round}`);
      const first = await listCopy(db, owner);
      const second = await listCopy(db, owner);
      await listCopy(db, reader);
      for (let i = 0; i < 2; i++) {
        const f = await makeUser(db, `DeadFriend${round}${i}`);
        await listCopy(db, f);
        const mine = await listCopy(db, reader);
        const [{ request_copy: gid }] = await db.as(f, "select public.request_copy($1)", [mine]);
        await db.as(reader, "select public.respond_request($1, true)", [gid]);
        await db.as(reader, "select public.confirm_handover($1)", [gid]);
        await db.as(f, "select public.confirm_handover($1)", [gid]);
      }
      const [{ request_copy: id }] = await db.as(reader, "select public.request_copy($1)", [first]);
      await db.as(owner, "select public.respond_request($1, true)", [id]);
      await db.as(owner, "select public.confirm_handover($1)", [id]);
      const results = await Promise.allSettled([
        db.as(reader, "select public.confirm_handover($1)", [id]),
        db.as(reader, "select public.request_copy($1)", [second]),
      ]);
      expect(results.map((r) => (r.status === "rejected" ? String(r.reason) : "ok"))).toEqual(["ok", "ok"]);
    }
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
