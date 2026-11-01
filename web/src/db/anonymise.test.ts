import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { credits, listCopy, makeUser, pgliteDb, type TestDb } from "./test-db";

let db: TestDb;
beforeAll(async () => {
  db = await pgliteDb();
}, 60_000);
afterAll(async () => {
  await db?.close();
});

describe("anonymising a reader (account deletion)", () => {
  it("removes everything personal and keeps the ledger adding up", async () => {
    const leaving = await makeUser(db, "Leaving");
    const friend = await makeUser(db, "Friend");
    const mine = await listCopy(db, leaving);
    const theirs = await listCopy(db, friend);
    await db.as(leaving, "insert into public.profile_contacts (id, whatsapp) values ($1, '+60123456789')", [leaving]);
    await db.as(leaving, "insert into public.wishlist (user_id, isbn) select $1, isbn from public.copies where id = $2", [leaving, theirs]);
    await db.as(leaving, "select public.send_feedback('Love it')");
    // Sign-in data Supabase Auth keeps.
    await db.admin("update auth.users set phone = '+60123456789', raw_user_meta_data = '{\"full_name\":\"Leaving Person\"}' where id = $1", [leaving]);
    await db.admin("insert into auth.identities (user_id, identity_data) values ($1, '{\"email\":\"l@example.com\"}')", [leaving]);
    await db.admin("insert into auth.sessions (user_id) values ($1)", [leaving]);
    await db.admin("insert into auth.refresh_tokens (user_id, token) values ($1::text, 't')", [leaving]);
    await db.admin("insert into auth.one_time_tokens (user_id, relates_to) values ($1, 'l@example.com')", [leaving]);
    await db.admin("update public.copies set note = 'A gift, pass it on' where id = $1", [mine]);
    const pest = await makeUser(db, "Pest");
    await db.as(leaving, "select public.block_reader($1)", [pest]);
    // A finished give (ledger history) and a waiting request.
    const [{ request_copy: gave }] = await db.as(friend, "select public.request_copy($1)", [mine]);
    await db.as(leaving, "select public.respond_request($1, true)", [gave]);
    await db.as(leaving, "select public.propose_meetup($1, 'Gojan station', now() + interval '1 day', 'Red jacket')", [gave]);
    await db.as(leaving, "select public.confirm_handover($1)", [gave]);
    await db.as(friend, "select public.confirm_handover($1)", [gave]);
    const second = await listCopy(db, leaving);
    await db.admin("update public.copies set note = 'Text me on 010-1234-5678' where id = $1", [second]);
    const asker = await makeUser(db, "Asker");
    await listCopy(db, asker);
    const [{ request_copy: waiting }] = await db.as(asker, "select public.request_copy($1)", [second]);
    const friendBefore = await credits(db, friend);

    expect(await db.admin("select public.admin_anonymise_reader($1)", [leaving])).toEqual([{ admin_anonymise_reader: "anonymised" }]);

    expect(await db.admin("select display_name, area from public.profiles where id = $1", [leaving])).toEqual([{ display_name: "Former reader", area: "-" }]);
    expect(await db.admin("select * from public.profile_contacts where id = $1", [leaving])).toHaveLength(0);
    expect(await db.admin("select * from public.wishlist where user_id = $1", [leaving])).toHaveLength(0);
    expect(await db.admin("select * from public.feedback where user_id = $1", [leaving])).toHaveLength(0);
    expect(await db.admin("select * from public.blocks where $1 in (blocker_id, blocked_id)", [leaving])).toHaveLength(0);
    expect(await db.admin("select place, note from public.meetups where proposed_by = $1", [leaving])).toEqual([{ place: "removed", note: null }]);
    expect(await db.admin("select note from public.copies where id = $1", [second])).toEqual([{ note: null }]);
    // A book they gave away belongs to the friend now: its note travels on with it.
    expect(await db.admin("select owner_id, note from public.copies where id = $1", [mine])).toEqual([{ owner_id: friend, note: "A gift, pass it on" }]);
    expect(await db.admin("select status from public.copies where id = $1", [second])).toEqual([{ status: "withdrawn" }]);
    expect(await db.admin("select status from public.requests where id = $1", [waiting])).toEqual([{ status: "cancelled" }]);
    const [auth] = await db.admin("select email, phone, raw_user_meta_data, banned_until > now() + interval '50 years' as banned, banned_until = 'infinity' as infinite from auth.users where id = $1", [leaving]);
    expect(auth).toEqual({ email: `deleted-${leaving}@bayu.invalid`, phone: null, raw_user_meta_data: {}, banned: true, infinite: false });
    for (const t of ["identities", "sessions", "one_time_tokens"]) {
      expect(await db.admin(`select * from auth.${t} where user_id = $1`, [leaving])).toHaveLength(0);
    }
    expect(await db.admin("select * from auth.refresh_tokens where user_id = $1::text", [leaving])).toHaveLength(0);
    // Safe to run again (the runbook says to, an hour later, once old sign-in tokens expire).
    expect(await db.admin("select public.admin_anonymise_reader($1)", [leaving])).toEqual([{ admin_anonymise_reader: "anonymised" }]);
    // History stays: the ledger rows and the finished give are untouched, so credits still add up.
    expect(await db.admin("select status from public.requests where id = $1", [gave])).toEqual([{ status: "handed_over" }]);
    expect(await credits(db, friend)).toEqual(friendBefore);
    const [{ total }] = await db.admin("select sum(delta)::int as total from public.credit_ledger");
    const [{ starters }] = await db.admin("select count(*)::int as starters from public.credit_ledger where kind = 'starter_grant'");
    expect(total).toBe(starters);
  });

  it("refuses while the reader has an accepted request or a loan", async () => {
    const owner = await makeUser(db, "BusyOwner");
    const reader = await makeUser(db, "BusyReader");
    const copy = await listCopy(db, owner);
    await listCopy(db, reader);
    const [{ request_copy: id }] = await db.as(reader, "select public.request_copy($1)", [copy]);
    await db.as(owner, "select public.respond_request($1, true)", [id]);
    await expect(db.admin("select public.admin_anonymise_reader($1)", [reader])).rejects.toThrow(/finish or resolve it first/);
    await expect(db.admin("select public.admin_anonymise_reader(gen_random_uuid())")).rejects.toThrow(/no reader/);
  });

  it("can't be run from the app", async () => {
    const someone = await makeUser(db, "Someone");
    await expect(db.as(someone, "select public.admin_anonymise_reader($1)", [someone])).rejects.toThrow(/permission denied/);
    await db.admin("set role anon");
    try {
      await expect(db.admin("select public.admin_anonymise_reader(gen_random_uuid())")).rejects.toThrow(/permission denied/);
    } finally {
      await db.admin("reset role");
    }
  });
});
