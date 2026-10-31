/**
 * The credit ledger and lending lifecycle (ADR 003, R1-R9), tested against the
 * real SQL in supabase/migrations running in Postgres (PGlite, in memory).
 * These are the "required tests" listed in the ADR.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { credits, listCopy, makeUser, pgliteDb, type TestDb } from "./test-db";

let db: TestDb;
beforeAll(async () => {
  db = await pgliteDb();
}, 60_000);
afterAll(async () => {
  await db?.close();
});

/** Request, accept and hand over a copy; returns the request id. */
async function handover(owner: string, taker: string, copy: string, returnBy: string | null = null) {
  const [{ request_copy: id }] = await db.as(taker, "select public.request_copy($1, $2::date)", [copy, returnBy]);
  await db.as(owner, "select public.respond_request($1, true)", [id]);
  await db.as(owner, "select public.confirm_handover($1)", [id]);
  await db.as(taker, "select public.confirm_handover($1)", [id]);
  return id as string;
}

const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

async function ledgerSum(): Promise<number> {
  const [row] = await db.admin("select coalesce(sum(delta), 0)::int as total, count(*) filter (where kind = 'starter_grant')::int as starters from public.credit_ledger");
  return Number(row.total) - Number(row.starters);
}

describe("starter credit (R5)", () => {
  it("is granted with the first listed copy, exactly once", async () => {
    const aina = await makeUser(db, "Aina");
    expect(await credits(db, aina)).toEqual({ balance: 0, locked: 0, available: 0 });
    await listCopy(db, aina);
    expect((await credits(db, aina)).balance).toBe(1);
    await listCopy(db, aina);
    await listCopy(db, aina, "lend");
    expect((await credits(db, aina)).balance).toBe(1);
  });

  it("can't be granted by hand: users can't write to the ledger", async () => {
    const hafiz = await makeUser(db, "Hafiz");
    await expect(
      db.as(hafiz, "insert into public.credit_ledger (user_id, kind, delta, ref_id) values ($1, 'starter_grant', 1, gen_random_uuid())", [hafiz]),
    ).rejects.toThrow(/permission denied/);
  });
});

describe("the ledger is append-only", () => {
  it("rejects updates and deletes, even from the database owner", async () => {
    const u = await makeUser(db, "Owner");
    await listCopy(db, u);
    await expect(db.admin("update public.credit_ledger set delta = 1 where user_id = $1", [u])).rejects.toThrow(/append-only/);
    await expect(db.admin("delete from public.credit_ledger where user_id = $1", [u])).rejects.toThrow(/append-only/);
  });

  it("only shows people their own rows", async () => {
    const a = await makeUser(db, "Siti");
    const b = await makeUser(db, "Badrul");
    await listCopy(db, a);
    await listCopy(db, b);
    const rows = await db.as(a, "select user_id from public.credit_ledger");
    expect(rows.every((r) => r.user_id === a)).toBe(true);
  });
});

describe("give (R1, R2)", () => {
  it("moves nothing until both people confirm, then +1 giver, -1 receiver, and the copy changes hands", async () => {
    const aina = await makeUser(db, "Aina2");
    const hafiz = await makeUser(db, "Hafiz2");
    const klara = await listCopy(db, aina, "give");
    await listCopy(db, hafiz);

    const [{ request_copy: id }] = await db.as(hafiz, "select public.request_copy($1)", [klara]);
    await db.as(aina, "select public.respond_request($1, true)", [id]);
    await db.as(aina, "select public.confirm_handover($1)", [id]);
    expect(await credits(db, aina)).toMatchObject({ balance: 1 });
    expect(await credits(db, hafiz)).toMatchObject({ balance: 1 });

    const [{ confirm_handover: status }] = await db.as(hafiz, "select public.confirm_handover($1)", [id]);
    expect(status).toBe("handed_over");
    expect(await credits(db, aina)).toMatchObject({ balance: 2, available: 2 });
    expect(await credits(db, hafiz)).toMatchObject({ balance: 0, available: 0 });

    const [copy] = await db.admin("select owner_id, status from public.copies where id = $1", [klara]);
    expect(copy).toMatchObject({ owner_id: hafiz, status: "paused" });
  });

  it("double taps don't move credits twice", async () => {
    const giver = await makeUser(db, "Giver");
    const taker = await makeUser(db, "Taker");
    const copy = await listCopy(db, giver);
    await listCopy(db, taker);
    const id = await handover(giver, taker, copy);
    await db.as(giver, "select public.confirm_handover($1)", [id]);
    await db.as(taker, "select public.confirm_handover($1)", [id]);
    expect(await credits(db, giver)).toMatchObject({ balance: 2 });
    expect(await credits(db, taker)).toMatchObject({ balance: 0 });
  });

  it("two friends passing a book back and forth gain nothing", async () => {
    const a = await makeUser(db, "Ping");
    const b = await makeUser(db, "Pong");
    const book = await listCopy(db, a);
    await listCopy(db, b);
    await handover(a, b, book);
    await db.as(b, "update public.copies set status = 'available' where id = $1", [book]);
    await handover(b, a, book);
    expect(await credits(db, a)).toMatchObject({ balance: 1 });
    expect(await credits(db, b)).toMatchObject({ balance: 1 });
  });

  it("every transfer sums to zero: only starter grants add credits", async () => {
    expect(await ledgerSum()).toBe(0);
  });
});

describe("available credits never go below 0 (R6)", () => {
  it("can't request without an available credit", async () => {
    const owner = await makeUser(db, "Owner6");
    const broke = await makeUser(db, "Broke");
    const copy = await listCopy(db, owner);
    await expect(db.as(broke, "select public.request_copy($1)", [copy])).rejects.toThrow(/available credit/);
  });

  it("can't take two books on one credit: the second handover is refused", async () => {
    const o1 = await makeUser(db, "OwnerA");
    const o2 = await makeUser(db, "OwnerB");
    const reader = await makeUser(db, "Reader");
    const c1 = await listCopy(db, o1);
    const c2 = await listCopy(db, o2);
    await listCopy(db, reader); // 1 credit
    const [{ request_copy: r1 }] = await db.as(reader, "select public.request_copy($1)", [c1]);
    const [{ request_copy: r2 }] = await db.as(reader, "select public.request_copy($1)", [c2]);
    for (const [o, r] of [[o1, r1], [o2, r2]] as const) {
      await db.as(o, "select public.respond_request($1, true)", [r]);
      await db.as(o, "select public.confirm_handover($1)", [r]);
    }
    await db.as(reader, "select public.confirm_handover($1)", [r1]);
    await expect(db.as(reader, "select public.confirm_handover($1)", [r2])).rejects.toThrow(/no available credit/);
    expect(await credits(db, reader)).toEqual({ balance: 0, locked: 0, available: 0 });
  });
});

describe("limits (R7)", () => {
  it("allows at most 3 open requests", async () => {
    const reader = await makeUser(db, "Eager");
    await listCopy(db, reader);
    const owner = await makeUser(db, "Lender7");
    const copies = [];
    for (let i = 0; i < 4; i++) copies.push(await listCopy(db, owner));
    for (let i = 0; i < 3; i++) await db.as(reader, "select public.request_copy($1)", [copies[i]]);
    await expect(db.as(reader, "select public.request_copy($1)", [copies[3]])).rejects.toThrow(/3 open requests/);
  });

  it("allows at most 3 books borrowed at once", async () => {
    const reader = await makeUser(db, "Bookworm");
    await listCopy(db, reader);
    // Give the reader 4 credits by giving books away to others.
    const friends = [];
    for (let i = 0; i < 3; i++) {
      const f = await makeUser(db, `Friend${i}`);
      await listCopy(db, f);
      friends.push(f);
      const mine = await listCopy(db, reader);
      await handover(reader, f, mine);
    }
    expect((await credits(db, reader)).available).toBe(4);

    const lender = await makeUser(db, "Library");
    const lends = [];
    for (let i = 0; i < 4; i++) lends.push(await listCopy(db, lender, "lend", "4_weeks"));
    for (let i = 0; i < 3; i++) await handover(lender, reader, lends[i], inDays(14));
    await expect(db.as(reader, "select public.request_copy($1, $2::date)", [lends[3], inDays(14)])).rejects.toThrow(/borrowing 3 books/);
  });

  it("reads the limits from app_settings (configurable)", async () => {
    const [row] = await db.admin("select value from public.app_settings where key = 'max_open_requests'");
    expect(Number(row.value)).toBe(3);
  });
});

describe("limits are checked again at the handover (R7)", () => {
  it("lend requests made earlier can't stack past 3 borrows", async () => {
    const reader = await makeUser(db, "Stacker");
    await listCopy(db, reader);
    for (let i = 0; i < 3; i++) {
      const f = await makeUser(db, `Taker${i}`);
      await listCopy(db, f);
      await handover(reader, f, await listCopy(db, reader));
    }
    const lender = await makeUser(db, "Library2");
    const lends = [];
    for (let i = 0; i < 4; i++) lends.push(await listCopy(db, lender, "lend", "4_weeks"));
    await handover(lender, reader, lends[0], inDays(14)); // 1 borrowed
    const ids = [];
    for (let i = 1; i < 4; i++) {
      const [{ request_copy: id }] = await db.as(reader, "select public.request_copy($1, $2::date)", [lends[i], inDays(14)]);
      await db.as(lender, "select public.respond_request($1, true)", [id]);
      await db.as(lender, "select public.confirm_handover($1)", [id]);
      ids.push(id);
    }
    await db.as(reader, "select public.confirm_handover($1)", [ids[0]]);
    await db.as(reader, "select public.confirm_handover($1)", [ids[1]]); // 3 borrowed now
    await expect(db.as(reader, "select public.confirm_handover($1)", [ids[2]])).rejects.toThrow(/most books allowed/);
  });

  it("a lend whose return date has passed before the meet-up can't be handed over", async () => {
    const lender = await makeUser(db, "Late");
    const borrower = await makeUser(db, "Later");
    const copy = await listCopy(db, lender, "lend", "4_weeks");
    await listCopy(db, borrower);
    const [{ request_copy: id }] = await db.as(borrower, "select public.request_copy($1, $2::date)", [copy, inDays(5)]);
    await db.as(lender, "select public.respond_request($1, true)", [id]);
    await db.admin("update public.requests set return_by = current_date - 1 where id = $1", [id]);
    await db.as(lender, "select public.confirm_handover($1)", [id]);
    await expect(db.as(borrower, "select public.confirm_handover($1)", [id])).rejects.toThrow(/return date has passed/);
  });
});

describe("requests: accept, decline, cancel", () => {
  async function setup(name: string) {
    const owner = await makeUser(db, `${name}Owner`);
    const reader = await makeUser(db, `${name}Reader`);
    const copy = await listCopy(db, owner);
    await listCopy(db, reader);
    const [{ request_copy: id }] = await db.as(reader, "select public.request_copy($1)", [copy]);
    return { owner, reader, copy, id: id as string };
  }
  const statusOf = async (id: string) => (await db.admin("select status from public.requests where id = $1", [id]))[0].status;

  it("declining is final and moves no credits", async () => {
    const { owner, reader, id } = await setup("Decline");
    await db.as(owner, "select public.respond_request($1, false)", [id]);
    await db.as(owner, "select public.respond_request($1, false)", [id]); // idempotent
    expect(await statusOf(id)).toBe("declined");
    await expect(db.as(owner, "select public.respond_request($1, true)", [id])).rejects.toThrow(/already answered/);
    expect(await credits(db, reader)).toMatchObject({ balance: 1 });
  });

  it("either side can cancel before the handover; cancelling twice is safe; not after the handover", async () => {
    const a = await setup("Cancel");
    await db.as(a.reader, "select public.cancel_request($1)", [a.id]);
    await db.as(a.owner, "select public.cancel_request($1)", [a.id]);
    expect(await statusOf(a.id)).toBe("cancelled");

    const b = await setup("Late");
    await db.as(b.owner, "select public.respond_request($1, true)", [b.id]);
    await db.as(b.owner, "select public.confirm_handover($1)", [b.id]);
    await db.as(b.reader, "select public.confirm_handover($1)", [b.id]);
    await expect(db.as(b.reader, "select public.cancel_request($1)", [b.id])).rejects.toThrow(/can no longer be cancelled/);
  });

  it("a copy can only have one accepted reader at a time", async () => {
    const { owner, copy, id } = await setup("Double");
    const second = await makeUser(db, "SecondReader");
    await listCopy(db, second);
    const [{ request_copy: id2 }] = await db.as(second, "select public.request_copy($1)", [copy]);
    await db.as(owner, "select public.respond_request($1, true)", [id]);
    await expect(db.as(owner, "select public.respond_request($1, true)", [id2])).rejects.toThrow(/already accepted another reader/);
  });

  it("when a copy is handed over, other open requests for it are cancelled", async () => {
    const { owner, reader, copy, id } = await setup("Others");
    const other = await makeUser(db, "OtherReader");
    await listCopy(db, other);
    const [{ request_copy: otherId }] = await db.as(other, "select public.request_copy($1)", [copy]);
    await db.as(owner, "select public.respond_request($1, true)", [id]);
    await db.as(owner, "select public.confirm_handover($1)", [id]);
    await db.as(reader, "select public.confirm_handover($1)", [id]);
    expect(await statusOf(otherId as string)).toBe("cancelled");
  });

  it("withdrawing a copy cancels its open requests and keeps its history", async () => {
    const { owner, copy, id } = await setup("Withdraw");
    await db.as(owner, "select public.withdraw_copy($1)", [copy]);
    expect(await statusOf(id)).toBe("cancelled");
    const [c] = await db.admin("select status from public.copies where id = $1", [copy]);
    expect(c.status).toBe("withdrawn");
  });
});

describe("lend lifecycle (R3, R4)", () => {
  it("locks a credit on handover and unlocks it when both confirm the return", async () => {
    const lender = await makeUser(db, "Lender");
    const borrower = await makeUser(db, "Borrower");
    const circe = await listCopy(db, lender, "lend", "4_weeks");
    await listCopy(db, borrower);

    const id = await handover(lender, borrower, circe, inDays(21));
    expect(await credits(db, borrower)).toEqual({ balance: 1, locked: 1, available: 0 });
    expect(await credits(db, lender)).toMatchObject({ balance: 1 }); // R9: lenders don't earn
    const [onLoan] = await db.admin("select status from public.copies where id = $1", [circe]);
    expect(onLoan.status).toBe("on_loan");

    await db.as(borrower, "select public.confirm_return($1)", [id]);
    expect(await credits(db, borrower)).toMatchObject({ locked: 1 });
    await db.as(lender, "select public.confirm_return($1)", [id]);
    await db.as(lender, "select public.confirm_return($1)", [id]); // double tap
    expect(await credits(db, borrower)).toEqual({ balance: 1, locked: 0, available: 1 });
    const [back] = await db.admin("select owner_id, status from public.copies where id = $1", [circe]);
    expect(back).toMatchObject({ owner_id: lender, status: "available" });
  });

  it("refuses a return date past the lender's maximum", async () => {
    const lender = await makeUser(db, "Strict");
    const borrower = await makeUser(db, "Hopeful");
    const copy = await listCopy(db, lender, "lend", "2_weeks");
    await listCopy(db, borrower);
    await expect(db.as(borrower, "select public.request_copy($1, $2::date)", [copy, inDays(30)])).rejects.toThrow(/later than the owner allows/);
  });

  it("forfeits the locked credit to the lender after due date + 14 days, and the loan becomes a give", async () => {
    const lender = await makeUser(db, "Patient");
    const borrower = await makeUser(db, "Forgetful");
    const copy = await listCopy(db, lender, "lend", "flexible");
    await listCopy(db, borrower);
    const id = await handover(lender, borrower, copy, inDays(7));

    await expect(db.as(lender, "select public.report_not_returned($1)", [id])).rejects.toThrow(/report it after/);

    // Jump past the grace period: move the due date back (as an admin, like time passing).
    await db.admin("update public.requests set return_by = current_date - 15 where id = $1", [id]);
    await db.as(lender, "select public.report_not_returned($1)", [id]);
    await db.as(lender, "select public.report_not_returned($1)", [id]); // double tap
    expect(await credits(db, borrower)).toEqual({ balance: 0, locked: 0, available: 0 });
    expect(await credits(db, lender)).toMatchObject({ balance: 2 });
    const [copyRow] = await db.admin("select owner_id from public.copies where id = $1", [copy]);
    expect(copyRow.owner_id).toBe(borrower);
    expect(await ledgerSum()).toBe(0);
  });

  it("the lender can't report a book the borrower says was returned", async () => {
    const lender = await makeUser(db, "Disputer");
    const borrower = await makeUser(db, "Returner");
    const copy = await listCopy(db, lender, "lend", "flexible");
    await listCopy(db, borrower);
    const id = await handover(lender, borrower, copy, inDays(7));
    await db.as(borrower, "select public.confirm_return($1)", [id]);
    await db.admin("update public.requests set return_by = current_date - 30 where id = $1", [id]);
    await expect(db.as(lender, "select public.report_not_returned($1)", [id])).rejects.toThrow(/says this book was returned/);
    expect(await credits(db, borrower)).toMatchObject({ locked: 1, balance: 1 });
  });

  it("the lender can't report a book they've confirmed they got back", async () => {
    const lender = await makeUser(db, "GotBack");
    const borrower = await makeUser(db, "ForgotToTap");
    const copy = await listCopy(db, lender, "lend", "flexible");
    await listCopy(db, borrower);
    const id = await handover(lender, borrower, copy, inDays(7));
    await db.as(lender, "select public.confirm_return($1)", [id]);
    await db.admin("update public.requests set return_by = current_date - 30 where id = $1", [id]);
    await expect(db.as(lender, "select public.report_not_returned($1)", [id])).rejects.toThrow(/confirmed you got this book back/);
    expect(await credits(db, borrower)).toMatchObject({ locked: 1, balance: 1 });
    const [c] = await db.admin("select owner_id from public.copies where id = $1", [copy]);
    expect(c.owner_id).toBe(lender);
  });

  it("only the lender can report", async () => {
    const lender = await makeUser(db, "L2");
    const borrower = await makeUser(db, "B2");
    const copy = await listCopy(db, lender, "lend", "flexible");
    await listCopy(db, borrower);
    const id = await handover(lender, borrower, copy, inDays(7));
    await expect(db.as(borrower, "select public.report_not_returned($1)", [id])).rejects.toThrow(/not found/);
  });
});

describe("lend dates (the copy page's date picker relies on these)", () => {
  it("accepts tomorrow through the owner's maximum, and nothing outside it", async () => {
    const lender = await makeUser(db, "DateLender");
    const borrower = await makeUser(db, "DateBorrower");
    await listCopy(db, borrower);
    const [{ d: today }] = await db.admin("select public.today()::text as d");
    const day = (n: number) => {
      const d = new Date(`${today}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + n);
      return d.toISOString().slice(0, 10);
    };
    const tryDate = async (n: number) => {
      const copy = await listCopy(db, lender, "lend", "4_weeks");
      return db.as(borrower, "select public.request_copy($1, $2::date)", [copy, day(n)]).then(
        async ([{ request_copy: id }]) => {
          await db.as(borrower, "select public.cancel_request($1)", [id]);
          return "ok";
        },
        (e: Error) => e.message,
      );
    };
    expect(await tryDate(0)).toMatch(/after today/);
    expect(await tryDate(1)).toBe("ok");
    expect(await tryDate(28)).toBe("ok");
    expect(await tryDate(29)).toMatch(/later than the owner allows/);
  });
});

describe("errors meant for readers are marked", () => {
  it("carry hint 'bayu', so the app can show them and hide everything else", async () => {
    const a = await makeUser(db, "Hinted");
    const mine = await listCopy(db, a);
    const err = await db.as(a, "select public.request_copy($1)", [mine]).catch((e: { hint?: string; message: string }) => e);
    expect(err).toMatchObject({ hint: "bayu", message: "that is your own book" });
  });
});

describe("guards", () => {
  it("you can't request your own book, or a book that isn't available", async () => {
    const a = await makeUser(db, "Self");
    const mine = await listCopy(db, a);
    await expect(db.as(a, "select public.request_copy($1)", [mine])).rejects.toThrow(/your own book/);
    await db.as(a, "update public.copies set status = 'paused' where id = $1", [mine]);
    const b = await makeUser(db, "Other");
    await listCopy(db, b);
    await expect(db.as(b, "select public.request_copy($1)", [mine])).rejects.toThrow(/not available/);
  });

  it("owners can pause a copy but can't mark it on loan or withdrawn, or hand it to someone", async () => {
    const a = await makeUser(db, "Sneaky");
    const b = await makeUser(db, "Friend");
    const mine = await listCopy(db, a);
    await db.as(a, "update public.copies set status = 'paused' where id = $1", [mine]);
    await expect(db.as(a, "update public.copies set status = 'on_loan' where id = $1", [mine])).rejects.toThrow(/only be paused/);
    await expect(db.as(a, "update public.copies set status = 'withdrawn' where id = $1", [mine])).rejects.toThrow(/only be paused/);
    await expect(db.as(a, "update public.copies set owner_id = $2 where id = $1", [mine, b])).rejects.toThrow(/permission denied/);
    await expect(db.as(a, "delete from public.copies where id = $1", [mine])).rejects.toThrow(/permission denied/);
  });

  it("a lent book can't be put back on the shelf by its owner while it's out", async () => {
    const lender = await makeUser(db, "Flipper");
    const borrower = await makeUser(db, "Holder");
    const copy = await listCopy(db, lender, "lend", "4_weeks");
    await listCopy(db, borrower);
    await handover(lender, borrower, copy, inDays(10));
    await expect(db.as(lender, "update public.copies set status = 'available' where id = $1", [copy])).rejects.toThrow(/only be paused/);
  });

  it("missing settings fail closed instead of switching a limit off", async () => {
    await db.admin("update public.app_settings set key = 'renamed' where key = 'max_open_requests'");
    const owner = await makeUser(db, "Settings");
    const reader = await makeUser(db, "Unlimited");
    const copy = await listCopy(db, owner);
    await listCopy(db, reader);
    await expect(db.as(reader, "select public.request_copy($1)", [copy])).rejects.toThrow(/missing app setting/);
    await db.admin("update public.app_settings set key = 'max_open_requests' where key = 'renamed'");
  });

  it("the ledger refuses amounts its kind doesn't allow, even from the database owner", async () => {
    const u = await makeUser(db, "Minter");
    await expect(
      db.admin("insert into public.credit_ledger (user_id, kind, delta, ref_id) values ($1, 'give_transfer', 0, gen_random_uuid())", [u]),
    ).rejects.toThrow(/ledger_kind_amounts/);
    await expect(
      db.admin("insert into public.credit_ledger (user_id, kind, delta, locked_delta, ref_id) values ($1, 'lend_unlock', 1, -1, gen_random_uuid())", [u]),
    ).rejects.toThrow(/ledger_kind_amounts/);
  });

  it("only the owner can accept, and nobody can edit requests directly", async () => {
    const o = await makeUser(db, "RealOwner");
    const r = await makeUser(db, "Requester");
    const x = await makeUser(db, "Stranger");
    const copy = await listCopy(db, o);
    await listCopy(db, r);
    const [{ request_copy: id }] = await db.as(r, "select public.request_copy($1)", [copy]);
    await expect(db.as(x, "select public.respond_request($1, true)", [id])).rejects.toThrow(/not found/);
    await expect(db.as(r, "select public.respond_request($1, true)", [id])).rejects.toThrow(/not found/);
    await expect(db.as(r, "update public.requests set status = 'accepted' where id = $1", [id])).rejects.toThrow();
    const seen = await db.as(x, "select id from public.requests where id = $1", [id]);
    expect(seen).toHaveLength(0);
  });

  it("a WhatsApp number is only readable by its owner", async () => {
    const a = await makeUser(db, "Private");
    const b = await makeUser(db, "Curious");
    await db.as(a, "insert into public.profile_contacts (id, whatsapp) values ($1, '+60123456789')", [a]);
    expect(await db.as(b, "select whatsapp from public.profile_contacts")).toHaveLength(0);
    expect(await db.as(a, "select whatsapp from public.profile_contacts")).toHaveLength(1);
  });

  it("nobody can read another person's balance", async () => {
    const a = await makeUser(db, "Nosy");
    const b = await makeUser(db, "Target");
    await expect(db.as(a, "select * from public.credits_of($1)", [b])).rejects.toThrow(/permission denied/);
  });
});
