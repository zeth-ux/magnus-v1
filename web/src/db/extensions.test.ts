import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { listCopy, makeUser, pgliteDb, type TestDb } from "./test-db";

let db: TestDb;
beforeAll(async () => {
  db = await pgliteDb();
}, 60_000);
afterAll(async () => {
  await db?.close();
});

// Days from today in Seoul, the same calendar public.today() uses (UTC is a day behind before 9am KST).
const day = (n: number) => new Date(Date.now() + n * 86_400_000).toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });

/** A 4-week lend, handed over, due in 7 days. */
async function onLoan(name: string) {
  const owner = await makeUser(db, `${name}Owner`);
  const reader = await makeUser(db, `${name}Reader`);
  const copy = await listCopy(db, owner, "lend", "4_weeks");
  await listCopy(db, reader);
  const [{ request_copy: id }] = await db.as(reader, "select public.request_copy($1, $2::date)", [copy, day(7)]);
  await db.as(owner, "select public.respond_request($1, true)", [id]);
  await db.as(owner, "select public.confirm_handover($1)", [id]);
  await db.as(reader, "select public.confirm_handover($1)", [id]);
  return { owner, reader, id: id as string };
}
const dueOf = async (id: string) => (await db.admin("select return_by::text as d from public.requests where id = $1", [id]))[0].d;

describe("loan extensions", () => {
  it("the borrower asks, the lender approves, and the due date moves", async () => {
    const { owner, reader, id } = await onLoan("Ext");
    const [{ ask_extension: e }] = await db.as(reader, "select public.ask_extension($1, $2::date)", [id, day(14)]);
    await expect(db.as(reader, "select public.answer_extension($1, true)", [e])).rejects.toThrow(/only the owner/);
    expect(await db.as(owner, "select public.answer_extension($1, true)", [e])).toEqual([{ answer_extension: "approved" }]);
    expect(await db.as(owner, "select public.answer_extension($1, true)", [e])).toEqual([{ answer_extension: "approved" }]); // idempotent
    expect(await dueOf(id)).toBe(day(14));
  });

  it("declining keeps the date; asking again replaces an open ask", async () => {
    const { owner, reader, id } = await onLoan("Decline");
    const [{ ask_extension: first }] = await db.as(reader, "select public.ask_extension($1, $2::date)", [id, day(10)]);
    const [{ ask_extension: second }] = await db.as(reader, "select public.ask_extension($1, $2::date)", [id, day(12)]);
    await expect(db.as(owner, "select public.answer_extension($1, true)", [first])).rejects.toThrow(/was changed/);
    await db.as(owner, "select public.answer_extension($1, false)", [second]);
    expect(await dueOf(id)).toBe(day(7));
    await expect(db.as(owner, "select public.answer_extension($1, true)", [second])).rejects.toThrow(/was changed/);
  });

  it("refuses earlier dates, dates past the lend period, the owner asking, outsiders, and finished loans", async () => {
    const { owner, reader, id } = await onLoan("ExtRules");
    const stranger = await makeUser(db, "ExtStranger");
    await expect(db.as(reader, "select public.ask_extension($1, $2::date)", [id, day(6)])).rejects.toThrow(/after the current due date/);
    await expect(db.as(reader, "select public.ask_extension($1, $2::date)", [id, day(29)])).rejects.toThrow(/longer than the owner lends/);
    await expect(db.as(owner, "select public.ask_extension($1, $2::date)", [id, day(14)])).rejects.toThrow(/only the reader borrowing/);
    await expect(db.as(stranger, "select public.ask_extension($1, $2::date)", [id, day(14)])).rejects.toThrow(/not found/);
    const [{ ask_extension: e }] = await db.as(reader, "select public.ask_extension($1, $2::date)", [id, day(14)]);
    expect(await db.as(stranger, "select * from public.loan_extensions where request_id = $1", [id])).toHaveLength(0);
    await expect(db.as(stranger, "select public.answer_extension($1, true)", [e])).rejects.toThrow(/not found/);
    await db.as(reader, "select public.confirm_return($1)", [id]);
    await expect(db.as(reader, "select public.ask_extension($1, $2::date)", [id, day(15)])).rejects.toThrow(/already being returned/);
    await db.as(owner, "select public.confirm_return($1)", [id]);
    await expect(db.as(owner, "select public.answer_extension($1, true)", [e])).rejects.toThrow(/already being returned/);
  });

  it("an approved extension also moves R4: an overdue book can't be reported once more time is agreed", async () => {
    const { owner, reader, id } = await onLoan("ExtR4");
    // Long overdue: past the due date plus the 14-day grace period.
    await db.admin("update public.requests set return_by = current_date - 20 where id = $1", [id]);
    const [{ ask_extension: e }] = await db.as(reader, "select public.ask_extension($1, $2::date)", [id, day(5)]);
    await db.as(owner, "select public.answer_extension($1, true)", [e]);
    await expect(db.as(owner, "select public.report_not_returned($1)", [id])).rejects.toThrow(/report it after/);
  });

  it("asking for the same date twice uses one ask (a double tap is safe)", async () => {
    const { reader, id } = await onLoan("ExtTwice");
    const [{ ask_extension: a }] = await db.as(reader, "select public.ask_extension($1, $2::date)", [id, day(10)]);
    const [{ ask_extension: b }] = await db.as(reader, "select public.ask_extension($1, $2::date)", [id, day(10)]);
    expect(b).toBe(a);
    expect(await db.admin("select status from public.loan_extensions where request_id = $1", [id])).toEqual([{ status: "asked" }]);
  });

  it("saying no twice is fine; changing your mind after answering isn't", async () => {
    const { owner, reader, id } = await onLoan("ExtNoTwice");
    const [{ ask_extension: e }] = await db.as(reader, "select public.ask_extension($1, $2::date)", [id, day(10)]);
    expect(await db.as(owner, "select public.answer_extension($1, false)", [e])).toEqual([{ answer_extension: "declined" }]);
    expect(await db.as(owner, "select public.answer_extension($1, false)", [e])).toEqual([{ answer_extension: "declined" }]);
    await expect(db.as(owner, "select public.answer_extension($1, true)", [e])).rejects.toThrow(/was changed/);
  });

  it("an overdue borrower must pick a date after today", async () => {
    const { reader, id } = await onLoan("ExtOverdue");
    await db.admin("update public.requests set return_by = current_date - 5 where id = $1", [id]);
    // After the old due date, but not after today (in Seoul).
    await expect(db.as(reader, "select public.ask_extension($1, $2::date)", [id, day(0)])).rejects.toThrow(/after today/);
  });

  it("an ask whose date has passed can't be approved", async () => {
    const { owner, reader, id } = await onLoan("ExtStale");
    const [{ ask_extension: e }] = await db.as(reader, "select public.ask_extension($1, $2::date)", [id, day(10)]);
    await db.admin("update public.loan_extensions set new_return_by = current_date - 1, old_return_by = current_date - 2 where id = $1", [e]);
    await expect(db.as(owner, "select public.answer_extension($1, true)", [e])).rejects.toThrow(/already passed/);
  });

  it("only works on a lend that has been handed over", async () => {
    const owner = await makeUser(db, "ExtEarlyOwner");
    const reader = await makeUser(db, "ExtEarlyReader");
    const lend = await listCopy(db, owner, "lend", "4_weeks");
    const give = await listCopy(db, owner);
    await listCopy(db, reader);
    const [{ request_copy: accepted }] = await db.as(reader, "select public.request_copy($1, $2::date)", [lend, day(7)]);
    await db.as(owner, "select public.respond_request($1, true)", [accepted]);
    await expect(db.as(reader, "select public.ask_extension($1, $2::date)", [accepted, day(10)])).rejects.toThrow(/only while you are borrowing/);
    await db.as(reader, "select public.cancel_request($1)", [accepted]);
    const [{ request_copy: gift }] = await db.as(reader, "select public.request_copy($1)", [give]);
    await db.as(owner, "select public.respond_request($1, true)", [gift]);
    await db.as(owner, "select public.confirm_handover($1)", [gift]);
    await db.as(reader, "select public.confirm_handover($1)", [gift]);
    await expect(db.as(reader, "select public.ask_extension($1, $2::date)", [gift, day(10)])).rejects.toThrow(/only while you are borrowing/);
  });

  it("an unanswered ask is closed once the return starts, and can't be approved after", async () => {
    const { owner, reader, id } = await onLoan("ExtClose");
    const [{ ask_extension: e }] = await db.as(reader, "select public.ask_extension($1, $2::date)", [id, day(14)]);
    await db.as(reader, "select public.confirm_return($1)", [id]);
    expect(await db.admin("select status from public.loan_extensions where id = $1", [e])).toEqual([{ status: "closed" }]);
    await expect(db.as(owner, "select public.answer_extension($1, true)", [e])).rejects.toThrow(/already being returned/);
    expect(await dueOf(id)).toBe(day(7));
  });

  it("signed-in readers can't write extensions directly", async () => {
    const { reader, id } = await onLoan("ExtForge");
    await expect(
      db.as(reader, "insert into public.loan_extensions (request_id, asked_by, old_return_by, new_return_by, status) values ($1, $2, current_date, current_date + 20, 'approved')", [id, reader]),
    ).rejects.toThrow(/permission denied/);
    const [{ ask_extension: e }] = await db.as(reader, "select public.ask_extension($1, $2::date)", [id, day(10)]);
    await expect(db.as(reader, "update public.loan_extensions set status = 'approved' where id = $1", [e])).rejects.toThrow(/permission denied/);
  });

  it("stops after 5 asks on one loan", async () => {
    const { reader, id } = await onLoan("ExtLimit");
    for (let i = 0; i < 5; i++) await db.as(reader, "select public.ask_extension($1, $2::date)", [id, day(8 + i)]);
    await expect(db.as(reader, "select public.ask_extension($1, $2::date)", [id, day(20)])).rejects.toThrow(/5 times/);
  });

  it("isn't open to anonymous visitors", async () => {
    await db.admin("set role anon");
    try {
      await expect(db.admin("select public.ask_extension(gen_random_uuid(), current_date + 3)")).rejects.toThrow(/permission denied/);
      await expect(db.admin("select public.answer_extension(gen_random_uuid(), true)")).rejects.toThrow(/permission denied/);
      await expect(db.admin("select * from public.loan_extensions")).rejects.toThrow(/permission denied/);
    } finally {
      await db.admin("reset role");
    }
  });
});
