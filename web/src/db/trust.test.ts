import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { listCopy, makeUser, pgliteDb, type TestDb } from "./test-db";

let db: TestDb;
beforeAll(async () => {
  db = await pgliteDb();
}, 60_000);
afterAll(async () => {
  await db?.close();
});

async function handedOver(name: string) {
  const owner = await makeUser(db, `${name}Owner`);
  const reader = await makeUser(db, `${name}Reader`);
  const copy = await listCopy(db, owner);
  await listCopy(db, reader);
  const [{ request_copy: id }] = await db.as(reader, "select public.request_copy($1)", [copy]);
  await db.as(owner, "select public.respond_request($1, true)", [id]);
  await db.as(owner, "select public.confirm_handover($1)", [id]);
  await db.as(reader, "select public.confirm_handover($1)", [id]);
  return { owner, reader, id: id as string };
}

describe("ratings", () => {
  it("each side rates the other once per handover; the count is shared, who rated is not", async () => {
    const { owner, reader, id } = await handedOver("Rate");
    await db.as(reader, "select public.rate_handover($1, true)", [id]);
    await db.as(reader, "select public.rate_handover($1, false)", [id]);
    await db.as(reader, "select public.rate_handover($1, true)", [id]); // changed their mind: still one rating
    await db.as(owner, "select public.rate_handover($1, true)", [id]);
    const [{ smooth_handovers: n }] = await db.as(reader, "select public.smooth_handovers($1)", [owner]);
    expect(Number(n)).toBe(1);
    expect(await db.as(owner, "select * from public.handover_ratings where rater_id <> $1", [owner])).toHaveLength(0);
  });

  it("only after the book changed hands, only by the two readers", async () => {
    const owner = await makeUser(db, "EarlyOwner");
    const reader = await makeUser(db, "EarlyReader");
    const stranger = await makeUser(db, "Nosy");
    const copy = await listCopy(db, owner);
    await listCopy(db, reader);
    const [{ request_copy: id }] = await db.as(reader, "select public.request_copy($1)", [copy]);
    await expect(db.as(reader, "select public.rate_handover($1, true)", [id])).rejects.toThrow(/changed hands/);
    await expect(db.as(stranger, "select public.rate_handover($1, true)", [id])).rejects.toThrow(/not found/);
  });
});

describe("blocking", () => {
  it("stops new requests both ways and cancels open ones between the two readers", async () => {
    const owner = await makeUser(db, "Blocker");
    const pest = await makeUser(db, "Pest");
    const a = await listCopy(db, owner);
    const b = await listCopy(db, owner);
    const theirs = await listCopy(db, pest);
    const [{ request_copy: open }] = await db.as(pest, "select public.request_copy($1)", [a]);
    await db.as(owner, "select public.block_reader($1)", [pest]);
    const [row] = await db.admin("select status from public.requests where id = $1", [open]);
    expect(row.status).toBe("cancelled");
    // The blocked reader isn't told why; the blocker is reminded they blocked.
    await expect(db.as(pest, "select public.request_copy($1)", [b])).rejects.toThrow(/not available right now/);
    await expect(db.as(owner, "select public.request_copy($1)", [theirs])).rejects.toThrow(/you blocked this reader/);
    expect(await db.as(pest, "select * from public.blocks")).toHaveLength(0); // the blocked reader can't see the block
    await db.as(owner, "delete from public.blocks where blocked_id = $1", [pest]);
    await db.as(pest, "select public.request_copy($1)", [b]);
  });

  it("can't block yourself or nobody", async () => {
    const u = await makeUser(db, "Self");
    await expect(db.as(u, "select public.block_reader($1)", [u])).rejects.toThrow(/reader not found/);
    await expect(db.as(u, "select public.block_reader(gen_random_uuid())")).rejects.toThrow(/reader not found/);
  });
});

describe("blocking and loans", () => {
  it("a block doesn't end a loan: the book can still be returned, or reported after the grace period", async () => {
    const owner = await makeUser(db, "LoanBlocker");
    const borrower = await makeUser(db, "LoanBlocked");
    const copy = await listCopy(db, owner, "lend", "4_weeks");
    await listCopy(db, borrower);
    const due = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
    const [{ request_copy: id }] = await db.as(borrower, "select public.request_copy($1, $2::date)", [copy, due]);
    await db.as(owner, "select public.respond_request($1, true)", [id]);
    await db.as(owner, "select public.confirm_handover($1)", [id]);
    await db.as(borrower, "select public.confirm_handover($1)", [id]);
    await db.as(borrower, "select public.block_reader($1)", [owner]);
    const [r] = await db.admin("select status from public.requests where id = $1", [id]);
    expect(r.status).toBe("on_loan");
    await db.admin("update public.requests set return_by = current_date - 15 where id = $1", [id]);
    await db.as(owner, "select public.report_not_returned($1)", [id]);
    const [after] = await db.admin("select status from public.requests where id = $1", [id]);
    expect(after.status).toBe("forfeited");
  });

  it("two friends passing a book back and forth count once in each other's smooth handovers", async () => {
    const a = await makeUser(db, "Farm1");
    const b = await makeUser(db, "Farm2");
    const book = await listCopy(db, a);
    await listCopy(db, b);
    for (let i = 0; i < 3; i++) {
      const [from, to] = i % 2 === 0 ? [a, b] : [b, a];
      if (i > 0) await db.as(from, "update public.copies set status = 'available' where id = $1", [book]);
      const [{ request_copy: id }] = await db.as(to, "select public.request_copy($1)", [book]);
      await db.as(from, "select public.respond_request($1, true)", [id]);
      await db.as(from, "select public.confirm_handover($1)", [id]);
      await db.as(to, "select public.confirm_handover($1)", [id]);
      await db.as(to, "select public.rate_handover($1, true)", [id]);
    }
    const [{ smooth_handovers: n }] = await db.as(a, "select public.smooth_handovers($1)", [b]);
    expect(Number(n)).toBe(1);
  });
});

describe("reports and feedback", () => {
  it("are written through functions and can't be read back by readers", async () => {
    const { owner, reader, id } = await handedOver("Report");
    await db.as(reader, "select public.report_problem($1, $2)", ["They never turned up the second time", id]);
    await db.as(owner, "select public.send_feedback($1)", ["Love the shelf!"]);
    const [report] = await db.admin("select reporter_id, reported_id from public.reports where request_id = $1", [id]);
    expect(report).toEqual({ reporter_id: reader, reported_id: owner });
    await expect(db.as(reader, "select * from public.reports")).rejects.toThrow(/permission denied/);
    await expect(db.as(owner, "select * from public.feedback")).rejects.toThrow(/permission denied/);
    await expect(db.as(owner, "insert into public.feedback (user_id, message) values ($1, 'hey there')", [owner])).rejects.toThrow(/permission denied/);
  });

  it("need a few words, and only the two readers can report a request", async () => {
    const { id } = await handedOver("Short");
    const stranger = await makeUser(db, "Outsider");
    await expect(db.as(stranger, "select public.send_feedback('ok')")).rejects.toThrow(/a few words/);
    await expect(db.as(stranger, "select public.report_problem($1, $2)", ["Something bad happened", id])).rejects.toThrow(/not found/);
  });

  it("a report can block the other reader in the same step", async () => {
    const { owner, reader, id } = await handedOver("ReportBlock");
    await db.as(reader, "select public.report_problem($1, $2, true)", ["Rude at the meet-up", id]);
    expect(await db.as(reader, "select blocked_id from public.blocks")).toEqual([{ blocked_id: owner }]);
  });

  it("have daily limits", async () => {
    const u = await makeUser(db, "Chatty");
    for (let i = 0; i < 20; i++) await db.as(u, "select public.send_feedback($1)", [`Idea number ${i}`]);
    await expect(db.as(u, "select public.send_feedback('one more idea')")).rejects.toThrow(/plenty for today/);
    for (let i = 0; i < 10; i++) await db.as(u, "select public.report_problem($1)", [`Problem number ${i}`]);
    await expect(db.as(u, "select public.report_problem('another problem')")).rejects.toThrow(/a lot of reports/);
  });

  it("aren't open to anonymous visitors", async () => {
    await db.admin("set role anon");
    await expect(db.admin("select public.send_feedback('hello world')")).rejects.toThrow(/permission denied/);
    await expect(db.admin("select public.smooth_handovers(gen_random_uuid())")).rejects.toThrow(/permission denied/);
    await db.admin("reset role");
  });
});
