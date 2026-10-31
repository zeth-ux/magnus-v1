import { describe, expect, it } from "vitest";
import { addDays, ownerLine, ownerOps, requesterLine, requesterOps, type Row } from "./steps";

const base: Row = {
  id: "r1",
  mode: "lend",
  status: "requested",
  return_by: "2026-11-20",
  owner_id: "o",
  requester_id: "q",
  owner_handed_over: false,
  requester_received: false,
  owner_got_back: false,
  requester_returned: false,
  updated_at: "2026-11-01T00:00:00Z",
  copy: null,
  owner: null,
  requester: null,
};
const ctx = (today = "2026-11-01", copyBusy = false) => ({ today, copyBusy });
const ops = (list: { op: string }[]) => list.map((o) => o.op);

describe("request steps", () => {
  it("owners accept or decline a new request; requesters can cancel", () => {
    expect(ops(ownerOps(base, ctx()))).toEqual(["accept", "decline"]);
    expect(ops(requesterOps(base, "2026-11-01"))).toEqual(["cancel"]);
  });

  it("no Accept once another reader is accepted for the same copy", () => {
    expect(ops(ownerOps(base, ctx("2026-11-01", true)))).toEqual(["decline"]);
    expect(ownerLine(base, ctx("2026-11-01", true))).toMatch(/already accepted another reader/);
  });

  it("after accepting, each side confirms their half of the handover once", () => {
    const accepted = { ...base, status: "accepted" as const };
    expect(ops(ownerOps(accepted, ctx()))).toEqual(["handover", "cancel"]);
    expect(ops(requesterOps(accepted, "2026-11-01"))).toEqual(["handover", "cancel"]);
    expect(ops(ownerOps({ ...accepted, owner_handed_over: true }, ctx()))).toEqual(["cancel"]);
    expect(ops(requesterOps({ ...accepted, requester_received: true }, "2026-11-01"))).toEqual(["cancel"]);
  });

  it("a lend whose return date passed before the meet-up can only be cancelled", () => {
    const stale = { ...base, status: "accepted" as const, return_by: "2026-11-01" };
    expect(ops(ownerOps(stale, ctx("2026-11-01")))).toEqual(["cancel"]);
    expect(ops(requesterOps(stale, "2026-11-01"))).toEqual(["cancel"]);
    expect(requesterLine(stale, "2026-11-01")).toMatch(/return date has passed/);
  });

  it("gives work the same way, without dates", () => {
    const give = { ...base, mode: "give" as const, return_by: null, status: "accepted" as const };
    expect(ops(ownerOps(give, ctx("2030-01-01")))).toEqual(["handover", "cancel"]);
  });

  it("on loan: both confirm the return; the lender can report only after due + 14 days", () => {
    const loan = { ...base, status: "on_loan" as const };
    expect(ops(ownerOps(loan, ctx("2026-12-04")))).toEqual(["returned"]);
    expect(ops(ownerOps(loan, ctx("2026-12-05")))).toEqual(["returned", "report"]);
    expect(ops(requesterOps(loan, "2026-12-05"))).toEqual(["returned"]);
  });

  it("no report once either side says the book is back", () => {
    const loan = { ...base, status: "on_loan" as const };
    expect(ops(ownerOps({ ...loan, requester_returned: true }, ctx("2027-01-01")))).toEqual(["returned"]);
    expect(ops(ownerOps({ ...loan, owner_got_back: true }, ctx("2027-01-01")))).toEqual([]);
    expect(ownerLine({ ...loan, owner_got_back: true }, ctx("2027-01-01"))).toMatch(/confirmed it's back/);
    expect(requesterLine({ ...loan, owner_got_back: true }, "2027-01-01")).toMatch(/Confirm to unlock/);
    expect(ops(requesterOps({ ...loan, requester_returned: true }, "2027-01-01"))).toEqual([]);
  });

  it("finished requests offer nothing", () => {
    for (const status of ["declined", "cancelled", "handed_over", "returned", "forfeited"] as const) {
      expect(ownerOps({ ...base, status }, ctx())).toEqual([]);
      expect(requesterOps({ ...base, status }, "2026-11-01")).toEqual([]);
    }
  });

  it("adds days across month ends", () => {
    expect(addDays("2026-11-20", 14)).toBe("2026-12-04");
  });
});
