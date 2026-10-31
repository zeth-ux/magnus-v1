import { describe, expect, it } from "vitest";
import { addDays, ownerOps, requesterOps, type Row } from "./steps";

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
const ops = (list: { op: string }[]) => list.map((o) => o.op);

describe("request steps", () => {
  it("owners accept or decline a new request; requesters can cancel", () => {
    expect(ops(ownerOps(base, "2026-11-01"))).toEqual(["accept", "decline"]);
    expect(ops(requesterOps(base))).toEqual(["cancel"]);
  });

  it("after accepting, each side confirms their half of the handover once", () => {
    const accepted = { ...base, status: "accepted" as const };
    expect(ops(ownerOps(accepted, "2026-11-01"))).toEqual(["handover", "cancel"]);
    expect(ops(ownerOps({ ...accepted, owner_handed_over: true }, "2026-11-01"))).toEqual(["cancel"]);
    expect(ops(requesterOps({ ...accepted, requester_received: true }))).toEqual(["cancel"]);
  });

  it("on loan: both confirm the return; the lender can report only after due + 14 days, and not if the borrower says it's back", () => {
    const loan = { ...base, status: "on_loan" as const };
    expect(ops(ownerOps(loan, "2026-12-04"))).toEqual(["returned"]);
    expect(ops(ownerOps(loan, "2026-12-05"))).toEqual(["returned", "report"]);
    expect(ops(ownerOps({ ...loan, requester_returned: true }, "2027-01-01"))).toEqual(["returned"]);
    expect(ops(requesterOps(loan))).toEqual(["returned"]);
    expect(ops(requesterOps({ ...loan, requester_returned: true }))).toEqual([]);
  });

  it("adds days across month ends", () => {
    expect(addDays("2026-11-20", 14)).toBe("2026-12-04");
  });
});
