import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { listCopy, makeUser, pgliteDb, type TestDb } from "./test-db";

let db: TestDb;
beforeAll(async () => {
  db = await pgliteDb();
}, 60_000);
afterAll(async () => {
  await db?.close();
});

const sees = async (user: string, copy: string) => (await db.as(user, "select id from public.copies where id = $1", [copy])).length === 1;

describe("who can see a copy", () => {
  it("a withdrawn copy disappears for other readers, but not for its owner or people in a request for it", async () => {
    const owner = await makeUser(db, "VisOwner");
    const asker = await makeUser(db, "VisAsker");
    const stranger = await makeUser(db, "VisStranger");
    const copy = await listCopy(db, owner);
    await listCopy(db, asker);
    expect(await sees(stranger, copy)).toBe(true);
    await db.as(asker, "select public.request_copy($1)", [copy]);
    await db.as(owner, "select public.withdraw_copy($1)", [copy]);
    expect(await sees(stranger, copy)).toBe(false);
    expect(await sees(owner, copy)).toBe(true);
    expect(await sees(asker, copy)).toBe(true); // their (now cancelled) request still shows the title
  });

  it("a given-away copy stays visible to both readers after the new owner withdraws it (the card's stamps need its title)", async () => {
    const giver = await makeUser(db, "GiveA");
    const taker = await makeUser(db, "GiveB");
    const stranger = await makeUser(db, "GiveStranger");
    const copy = await listCopy(db, giver);
    await listCopy(db, taker);
    const [{ request_copy: id }] = await db.as(taker, "select public.request_copy($1)", [copy]);
    await db.as(giver, "select public.respond_request($1, true)", [id]);
    await db.as(giver, "select public.confirm_handover($1)", [id]);
    await db.as(taker, "select public.confirm_handover($1)", [id]);
    await db.as(taker, "select public.withdraw_copy($1)", [copy]);
    expect(await sees(giver, copy)).toBe(true);
    expect(await sees(taker, copy)).toBe(true);
    expect(await sees(stranger, copy)).toBe(false);
  });

  it("paused copies stay visible (the owner can put them back)", async () => {
    const owner = await makeUser(db, "PauseOwner");
    const stranger = await makeUser(db, "PauseStranger");
    const copy = await listCopy(db, owner);
    await db.as(owner, "update public.copies set status = 'paused' where id = $1", [copy]);
    expect(await sees(stranger, copy)).toBe(true);
  });
});
