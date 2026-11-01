import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { listCopy, makeUser, nextIsbn, pgliteDb, type TestDb } from "./test-db";

/**
 * The test database starts like a new Supabase project: no automatic table
 * privileges. These run the app's direct table calls (web/src/app/**) as a
 * signed-in reader, and pin the exact list of privileges, so a missing or extra
 * grant fails here instead of on the live site.
 */
let db: TestDb;
beforeAll(async () => {
  db = await pgliteDb();
}, 60_000);
afterAll(async () => {
  await db?.close();
});

describe("table privileges", () => {
  it("are exactly what the app needs (anon: none)", async () => {
    const tables = await db.admin(`
      select table_name || ' ' || grantee || ' ' || string_agg(privilege_type, ',' order by privilege_type) as g
      from information_schema.role_table_grants
      where table_schema = 'public' and grantee in ('anon', 'authenticated')
      group by table_name, grantee order by 1`);
    expect(tables.map((r) => r.g)).toEqual([
      "app_settings authenticated SELECT",
      "blocks authenticated DELETE,SELECT",
      "books authenticated SELECT",
      "copies authenticated SELECT",
      "credit_ledger authenticated SELECT",
      "handover_ratings authenticated SELECT",
      "loan_extensions authenticated SELECT",
      "meetups authenticated SELECT",
      "profile_contacts authenticated SELECT",
      "profiles authenticated SELECT",
      "requests authenticated SELECT",
      "wishlist authenticated DELETE,SELECT",
    ]);
    // Column-level writes (privileges granted only on some columns).
    const columns = await db.admin(`
      select cp.table_name || ' ' || cp.privilege_type || ' ' || string_agg(cp.column_name, ',' order by cp.column_name) as g
      from information_schema.column_privileges cp
      where cp.table_schema = 'public' and cp.grantee in ('anon', 'authenticated') and cp.privilege_type in ('INSERT', 'UPDATE')
        and not exists (
          select 1 from information_schema.role_table_grants t
          where t.table_schema = 'public' and t.table_name = cp.table_name and t.grantee = cp.grantee and t.privilege_type = cp.privilege_type)
      group by cp.table_name, cp.privilege_type order by 1`);
    expect(columns.map((r) => r.g)).toEqual([
      "books INSERT authors,cover_url,isbn,published_year,title",
      "copies INSERT condition,isbn,lend_max,mode,note,owner_id",
      "copies UPDATE condition,lend_max,note,status",
      "profile_contacts INSERT id,whatsapp",
      "profile_contacts UPDATE id,whatsapp",
      "profiles INSERT area,display_name,id",
      "profiles UPDATE area,display_name,id",
      "wishlist INSERT isbn,user_id",
    ]);
    const anon = await db.admin(`select count(*)::int as n from information_schema.column_privileges where table_schema = 'public' and grantee = 'anon'`);
    expect(anon[0].n).toBe(0);
  });

  it("let a signed-in reader do everything the app does", async () => {
    const me = await makeUser(db, "GrantsMe");
    const other = await makeUser(db, "GrantsOther");
    // Me: profile and WhatsApp upserts, both the insert and the update path.
    const upsertProfile = "insert into public.profiles (id, display_name, area) values ($1, $2, 'Gojan') on conflict (id) do update set id = excluded.id, display_name = excluded.display_name, area = excluded.area";
    await db.as(me, upsertProfile, [me, "Me"]);
    await db.as(me, upsertProfile, [me, "Me again"]);
    const upsertContact = "insert into public.profile_contacts (id, whatsapp) values ($1, $2) on conflict (id) do update set id = excluded.id, whatsapp = excluded.whatsapp";
    await db.as(me, upsertContact, [me, "+60123456789"]);
    await db.as(me, upsertContact, [me, "+60123456780"]);
    expect(await db.as(me, "select whatsapp from public.profile_contacts where id = $1", [me])).toEqual([{ whatsapp: "+60123456780" }]);
    // Add a book: ensureBook (insert, do nothing on conflict), twice by two readers; list a copy.
    const isbn = nextIsbn();
    const ensureBook = "insert into public.books (isbn, title, authors) values ($1, 'A', '{}') on conflict (isbn) do nothing";
    await db.as(me, ensureBook, [isbn]);
    await db.as(other, ensureBook, [isbn]);
    const [{ id: copy }] = await db.as(me, "insert into public.copies (owner_id, isbn, mode, lend_max, condition, note) values ($1, $2, 'give', null, 'good', null) returning id", [me, isbn]);
    // Shelf: edit and pause your copy, reading back its id.
    expect(await db.as(me, "update public.copies set note = 'Pass it on', condition = 'good' where id = $1 returning id", [copy])).toHaveLength(1);
    expect(await db.as(me, "update public.copies set status = 'paused' where id = $1 and status = 'available' returning id", [copy])).toHaveLength(1);
    // Reads and security-invoker functions (Browse, book page, Activity, card).
    for (const t of ["profiles", "books", "copies", "requests", "meetups", "handover_ratings", "loan_extensions", "credit_ledger", "app_settings", "blocks"]) {
      await db.as(me, `select count(*) from public.${t}`);
    }
    await db.as(me, "select public.setting('max_flexible_lend_days')");
    await db.as(me, "select * from public.search_shelf('', null)");
    await db.as(me, "select * from public.wished_and_available()");
    await db.as(me, "select public.my_waiting_count()");
    // Wishlist: add twice (on conflict do nothing), read, remove.
    const wish = "insert into public.wishlist (user_id, isbn) values ($1, $2) on conflict (user_id, isbn) do nothing";
    await db.as(me, wish, [me, isbn]);
    await db.as(me, wish, [me, isbn]);
    await db.as(me, "delete from public.wishlist where user_id = $1 and isbn = $2", [me, isbn]);
    // Unblock (blocking itself is a function).
    await db.as(me, "select public.block_reader($1)", [other]);
    await db.as(me, "delete from public.blocks where blocker_id = $1 and blocked_id = $2", [me, other]);
    expect(await db.as(me, "select * from public.blocks")).toHaveLength(0);
  });

  it("stop a signed-in reader writing where only functions should", async () => {
    const me = await makeUser(db, "GrantsWrite");
    const copy = await listCopy(db, me);
    const refused = [
      ["update public.copies set owner_id = gen_random_uuid() where id = $1", [copy]],
      ["update public.copies set mode = 'lend' where id = $1", [copy]],
      ["delete from public.copies where id = $1", [copy]],
      ["insert into public.copies (owner_id, isbn, mode, created_at) select $1, isbn, 'give', '2100-01-01' from public.copies where id = $2", [me, copy]],
      ["update public.books set title = 'Hacked'", []],
      ["insert into public.credit_ledger (user_id, kind, delta, ref_id) values ($1, 'starter_grant', 1, gen_random_uuid())", [me]],
      ["update public.requests set status = 'returned'", []],
      ["update public.meetups set status = 'agreed'", []],
      ["update public.loan_extensions set status = 'approved'", []],
      ["insert into public.handover_ratings (request_id, rater_id, ratee_id, thumbs_up) values (gen_random_uuid(), $1, $1, true)", [me]],
      ["insert into public.blocks (blocker_id, blocked_id) values ($1, gen_random_uuid())", [me]],
      ["update public.app_settings set value = 99", []],
      ["insert into public.feedback (user_id, message) values ($1, 'x')", [me]],
      ["select * from public.reports", []],
      ["select * from public.credit_balances", []],
      ["delete from public.profiles where id = $1", [me]],
      ["update public.profiles set created_at = '2000-01-01' where id = $1", [me]],
    ] as const;
    for (const [sql, params] of refused) {
      await expect(db.as(me, sql, [...params]), sql).rejects.toThrow(/permission denied/);
    }
  });

  it("give a signed-out visitor no table access, only the public shelf function", async () => {
    await db.admin("set role anon");
    try {
      for (const t of ["profiles", "profile_contacts", "books", "copies", "requests", "credit_ledger", "wishlist", "app_settings", "meetups", "handover_ratings", "loan_extensions", "blocks", "reports", "feedback", "credit_balances"]) {
        await expect(db.admin(`select count(*) from public.${t}`), t).rejects.toThrow(/permission denied/);
      }
      await db.admin("select * from public.public_shelf(5)");
    } finally {
      await db.admin("reset role");
    }
  });
});
