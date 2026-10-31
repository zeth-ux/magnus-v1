import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { listCopy, makeUser, pgliteDb, type TestDb } from "./test-db";

let db: TestDb;
beforeAll(async () => {
  db = await pgliteDb();
}, 60_000);
afterAll(async () => {
  await db?.close();
});

const inHours = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();

async function acceptedRequest(name: string) {
  const owner = await makeUser(db, `${name}Owner`);
  const reader = await makeUser(db, `${name}Reader`);
  const copy = await listCopy(db, owner);
  await listCopy(db, reader);
  const [{ request_copy: id }] = await db.as(reader, "select public.request_copy($1)", [copy]);
  await db.as(owner, "select public.respond_request($1, true)", [id]);
  return { owner, reader, id: id as string };
}

describe("meet-up cards", () => {
  it("one person proposes, the other agrees; the proposer can't agree to their own", async () => {
    const { owner, reader, id } = await acceptedRequest("Meet");
    const [{ propose_meetup: m }] = await db.as(owner, "select public.propose_meetup($1, $2, $3::timestamptz, $4)", [
      id,
      "Jungang station, exit 2",
      inHours(24),
      "I'll wear a green bag",
    ]);
    await expect(db.as(owner, "select public.agree_meetup($1)", [m])).rejects.toThrow(/other reader needs to agree/);
    await db.as(reader, "select public.agree_meetup($1)", [m]);
    await db.as(reader, "select public.agree_meetup($1)", [m]); // idempotent
    const rows = await db.as(reader, "select place, status from public.meetups where request_id = $1", [id]);
    expect(rows).toEqual([{ place: "Jungang station, exit 2", status: "agreed" }]);
  });

  it("suggesting another replaces the live card; the old one can't be agreed any more", async () => {
    const { owner, reader, id } = await acceptedRequest("Counter");
    const [{ propose_meetup: first }] = await db.as(owner, "select public.propose_meetup($1, 'Gojan station', $2::timestamptz)", [id, inHours(5)]);
    const [{ propose_meetup: second }] = await db.as(reader, "select public.propose_meetup($1, 'ERICA library', $2::timestamptz)", [id, inHours(30)]);
    await expect(db.as(reader, "select public.agree_meetup($1)", [first])).rejects.toThrow(/was changed/);
    await db.as(owner, "select public.agree_meetup($1)", [second]);
    const live = await db.as(owner, "select place from public.meetups where request_id = $1 and status in ('proposed', 'agreed')", [id]);
    expect(live).toEqual([{ place: "ERICA library" }]);
  });

  it("refuses past times, far-future times, empty places, outsiders and closed requests", async () => {
    const { owner, id } = await acceptedRequest("Rules");
    const stranger = await makeUser(db, "Stranger");
    await expect(db.as(owner, "select public.propose_meetup($1, 'Cafe', $2::timestamptz)", [id, inHours(-1)])).rejects.toThrow(/in the future/);
    await expect(db.as(owner, "select public.propose_meetup($1, 'Cafe', $2::timestamptz)", [id, inHours(24 * 61)])).rejects.toThrow(/next 60 days/);
    await expect(db.as(owner, "select public.propose_meetup($1, ' ', $2::timestamptz)", [id, inHours(2)])).rejects.toThrow(/say where/);
    await expect(db.as(stranger, "select public.propose_meetup($1, 'Cafe', $2::timestamptz)", [id, inHours(2)])).rejects.toThrow(/not found/);
    expect(await db.as(stranger, "select * from public.meetups where request_id = $1", [id])).toHaveLength(0);
    await db.as(owner, "select public.cancel_request($1)", [id]);
    await expect(db.as(owner, "select public.propose_meetup($1, 'Cafe', $2::timestamptz)", [id, inHours(2)])).rejects.toThrow(/accepted requests/);
  });

  it("can't be written directly", async () => {
    const { owner, id } = await acceptedRequest("Direct");
    await expect(
      db.as(owner, "insert into public.meetups (request_id, proposed_by, place, meet_at) values ($1, $2, 'x place', now())", [id, owner]),
    ).rejects.toThrow(/permission denied/);
  });
});
