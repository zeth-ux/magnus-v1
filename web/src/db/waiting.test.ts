import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { listCopy, makeUser, pgliteDb, type TestDb } from "./test-db";

let db: TestDb;
beforeAll(async () => {
  db = await pgliteDb();
}, 60_000);
afterAll(async () => {
  await db?.close();
});

const day = (n: number) => new Date(Date.now() + n * 86_400_000).toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
const waiting = async (u: string) => Number((await db.as(u, "select public.my_waiting_count() as n"))[0].n);

describe("my_waiting_count (the Activity badge)", () => {
  it("counts the next step that's yours, and only yours", async () => {
    const owner = await makeUser(db, "BadgeOwner");
    const reader = await makeUser(db, "BadgeReader");
    const copy = await listCopy(db, owner, "lend", "4_weeks");
    await listCopy(db, reader);
    expect(await waiting(owner)).toBe(0);

    // A new request: the owner's move.
    const [{ request_copy: id }] = await db.as(reader, "select public.request_copy($1, $2::date)", [copy, day(10)]);
    expect([await waiting(owner), await waiting(reader)]).toEqual([1, 0]);

    // Accepted, and the reader suggests a meet-up: the owner's move again.
    await db.as(owner, "select public.respond_request($1, true)", [id]);
    expect([await waiting(owner), await waiting(reader)]).toEqual([0, 0]);
    await db.as(reader, "select public.propose_meetup($1, 'Gojan station', now() + interval '1 day')", [id]);
    expect([await waiting(owner), await waiting(reader)]).toEqual([1, 0]);

    // The owner confirms the handover: now the reader's move.
    await db.as(owner, "select public.confirm_handover($1)", [id]);
    expect(await waiting(reader)).toBe(1);
    await db.as(reader, "select public.confirm_handover($1)", [id]);
    expect([await waiting(owner), await waiting(reader)]).toEqual([0, 0]);

    // The reader asks for more time: the owner's move.
    await db.as(reader, "select public.ask_extension($1, $2::date)", [id, day(14)]);
    expect([await waiting(owner), await waiting(reader)]).toEqual([1, 0]);
  });

  it("a loan due within 3 days (or overdue) waits on the borrower", async () => {
    const owner = await makeUser(db, "DueOwner");
    const reader = await makeUser(db, "DueReader");
    const copy = await listCopy(db, owner, "lend", "4_weeks");
    await listCopy(db, reader);
    const [{ request_copy: id }] = await db.as(reader, "select public.request_copy($1, $2::date)", [copy, day(10)]);
    await db.as(owner, "select public.respond_request($1, true)", [id]);
    await db.as(owner, "select public.confirm_handover($1)", [id]);
    await db.as(reader, "select public.confirm_handover($1)", [id]);
    expect(await waiting(reader)).toBe(0);
    await db.admin("update public.requests set return_by = public.today() + 3 where id = $1", [id]);
    expect(await waiting(reader)).toBe(1);
    await db.admin("update public.requests set return_by = public.today() - 2 where id = $1", [id]);
    expect([await waiting(reader), await waiting(owner)]).toEqual([1, 0]);
    // Once the reader says it's back, it waits on the owner instead.
    await db.as(reader, "select public.confirm_return($1)", [id]);
    expect([await waiting(reader), await waiting(owner)]).toEqual([0, 1]);
  });

  it("counts a request once, however many things wait on it", async () => {
    const owner = await makeUser(db, "OnceOwner");
    const reader = await makeUser(db, "OnceReader");
    const copy = await listCopy(db, owner);
    await listCopy(db, reader);
    const [{ request_copy: id }] = await db.as(reader, "select public.request_copy($1)", [copy]);
    await db.as(owner, "select public.respond_request($1, true)", [id]);
    // The reader suggests a meet-up and confirms they got the book: two things for the owner, one request.
    await db.as(reader, "select public.propose_meetup($1, 'Gojan station', now() + interval '1 day')", [id]);
    await db.as(reader, "select public.confirm_handover($1)", [id]);
    expect(await waiting(owner)).toBe(1);
  });

  it("doesn't count what the page doesn't offer: a busy copy, an expired meet-up, a meet-up after the return started", async () => {
    const owner = await makeUser(db, "EdgeOwner");
    const first = await makeUser(db, "EdgeFirst");
    const second = await makeUser(db, "EdgeSecond");
    const copy = await listCopy(db, owner, "lend", "4_weeks");
    await listCopy(db, first);
    await listCopy(db, second);
    const [{ request_copy: a }] = await db.as(first, "select public.request_copy($1, $2::date)", [copy, day(10)]);
    await db.as(second, "select public.request_copy($1, $2::date)", [copy, day(10)]);
    expect(await waiting(owner)).toBe(2);
    // Accepting the first: the second can only be declined now, so it stops counting.
    await db.as(owner, "select public.respond_request($1, true)", [a]);
    expect(await waiting(owner)).toBe(0);
    // An expired suggestion doesn't count.
    const [{ propose_meetup: m }] = await db.as(first, "select public.propose_meetup($1, 'Cafe', now() + interval '2 hours')", [a]);
    expect(await waiting(owner)).toBe(1);
    await db.admin("update public.meetups set meet_at = now() - interval '1 hour' where id = $1", [m]);
    expect(await waiting(owner)).toBe(0);
    // On loan: a return meet-up from the borrower counts, until the borrower says it's back (then the confirm counts, once).
    await db.as(owner, "select public.confirm_handover($1)", [a]);
    await db.as(first, "select public.confirm_handover($1)", [a]);
    await db.as(first, "select public.propose_meetup($1, 'Library', now() + interval '1 day')", [a]);
    expect(await waiting(owner)).toBe(1);
    await db.as(first, "select public.confirm_return($1)", [a]);
    expect(await waiting(owner)).toBe(1);
  });

  it("a lend whose date passed before the handover waits on both readers (to cancel)", async () => {
    const owner = await makeUser(db, "StaleOwner");
    const reader = await makeUser(db, "StaleReader");
    const copy = await listCopy(db, owner, "lend", "4_weeks");
    await listCopy(db, reader);
    const [{ request_copy: id }] = await db.as(reader, "select public.request_copy($1, $2::date)", [copy, day(5)]);
    await db.as(owner, "select public.respond_request($1, true)", [id]);
    await db.as(owner, "select public.propose_meetup($1, 'Cafe', now() + interval '1 day')", [id]);
    await db.admin("update public.requests set return_by = public.today() where id = $1", [id]);
    expect([await waiting(owner), await waiting(reader)]).toEqual([1, 1]);
  });

  it("a reader with no requests of their own sees 0, though other readers' requests exist; anonymous visitors can't ask", async () => {
    const stranger = await makeUser(db, "BadgeStranger");
    expect(await waiting(stranger)).toBe(0);
    await db.admin("set role anon");
    try {
      await expect(db.admin("select public.my_waiting_count()")).rejects.toThrow(/permission denied/);
    } finally {
      await db.admin("reset role");
    }
  });
});
