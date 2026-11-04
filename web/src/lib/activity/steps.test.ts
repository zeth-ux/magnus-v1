import { describe, expect, it } from "vitest";
import { addDays, daysBetween, ownerLine, ownerOps, requestStages, requesterLine, whoseTurn, requesterOps, type Row } from "./steps";

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

describe("the borrower's due-date line", () => {
  const onLoan = { ...base, mode: "lend", status: "on_loan", return_by: "2026-11-10", owner_handed_over: true, requester_received: true } as Row;
  it("counts down in the last 3 days, then says it's late", () => {
    expect(requesterLine(onLoan, "2026-11-01")).toBe("Yours until 10 Nov.");
    expect(requesterLine(onLoan, "2026-11-07")).toBe("Due back in 3 days (10 Nov).");
    expect(requesterLine(onLoan, "2026-11-09")).toBe("Due back in 1 day (10 Nov).");
    expect(requesterLine(onLoan, "2026-11-10")).toBe("Due back today (10 Nov).");
    expect(requesterLine(onLoan, "2026-11-06")).toBe("Yours until 10 Nov.");
    expect(requesterLine(onLoan, "2026-11-12")).toBe("Was due back 10 Nov. Return it soon, or ask the owner for more time.");
  });
  it("daysBetween crosses months and years", () => {
    expect(daysBetween("2026-10-30", "2026-11-02")).toBe(3);
    expect(daysBetween("2026-12-30", "2027-01-02")).toBe(3);
    expect(daysBetween("2026-11-10", "2026-11-08")).toBe(-2);
  });
});

describe("requestStages", () => {
  const base = { owner_handed_over: false, requester_received: false, owner_got_back: false, requester_returned: false };
  const states = (s: ReturnType<typeof requestStages>) => s?.map((x) => x.state).join(",");
  it("walks a gift through asked, accepted, handed over", () => {
    expect(states(requestStages({ ...base, mode: "give", status: "requested" }))).toBe("now,next,next");
    expect(states(requestStages({ ...base, mode: "give", status: "accepted" }))).toBe("done,now,next");
    expect(states(requestStages({ ...base, mode: "give", status: "handed_over" }))).toBe("done,done,done");
  });
  it("walks a loan through to returned", () => {
    expect(requestStages({ ...base, mode: "lend", status: "on_loan" })?.map((s) => s.label)).toEqual(["Asked", "Accepted", "On loan", "Returned"]);
    expect(states(requestStages({ ...base, mode: "lend", status: "on_loan" }))).toBe("done,done,now,next");
    expect(states(requestStages({ ...base, mode: "lend", status: "returned" }))).toBe("done,done,done,done");
  });
  it("shows nothing for requests that stopped", () => {
    for (const status of ["declined", "cancelled", "forfeited"] as const) expect(requestStages({ ...base, mode: "lend", status })).toBeNull();
  });
});

describe("whoseTurn (mirrors my_waiting_count)", () => {
  const today = "2026-11-05";
  const ctx = { today, answerable: true, proposal: null, extensionAsked: false } as const;
  const row = (over: Partial<Row>): Row => ({
    id: "r", mode: "lend", status: "requested", return_by: "2026-12-01", owner_id: "o", requester_id: "q",
    owner_handed_over: false, requester_received: false, owner_got_back: false, requester_returned: false,
    updated_at: "", copy: null, owner: null, requester: null, ...over,
  });
  it("a new request waits on the owner, unless they can't accept it", () => {
    expect(whoseTurn(row({}), "owner", ctx)).toBe("you");
    expect(whoseTurn(row({}), "requester", ctx)).toBe("them");
    expect(whoseTurn(row({}), "owner", { ...ctx, answerable: false })).toBeNull();
    expect(whoseTurn(row({}), "requester", { ...ctx, answerable: false })).toBeNull();
  });
  it("accepted: nobody's turn until someone confirms or suggests a meet-up", () => {
    const r = row({ status: "accepted" });
    expect(whoseTurn(r, "owner", ctx)).toBeNull();
    expect(whoseTurn(r, "requester", { ...ctx, proposal: "them" })).toBe("you");
    expect(whoseTurn(r, "owner", { ...ctx, proposal: "me" })).toBe("them");
    expect(whoseTurn(row({ status: "accepted", requester_received: true }), "owner", ctx)).toBe("you");
    expect(whoseTurn(row({ status: "accepted", requester_received: true }), "requester", ctx)).toBe("them");
  });
  it("a stale lend waits on both (cancel)", () => {
    const r = row({ status: "accepted", return_by: today });
    expect(whoseTurn(r, "owner", ctx)).toBe("you");
    expect(whoseTurn(r, "requester", ctx)).toBe("you");
  });
  it("on loan: the lender waits; the borrower's turn comes 3 days before the due date", () => {
    expect(whoseTurn(row({ status: "on_loan" }), "owner", ctx)).toBeNull();
    expect(whoseTurn(row({ status: "on_loan" }), "requester", ctx)).toBeNull();
    expect(whoseTurn(row({ status: "on_loan", return_by: "2026-11-08" }), "requester", ctx)).toBe("you");
    expect(whoseTurn(row({ status: "on_loan", return_by: "2026-11-08" }), "owner", ctx)).toBe("them");
    expect(whoseTurn(row({ status: "on_loan", requester_returned: true }), "owner", ctx)).toBe("you");
  });
  it("a meet-up suggestion stops counting once either side confirmed the return", () => {
    expect(whoseTurn(row({ status: "on_loan" }), "requester", { ...ctx, proposal: "them" })).toBe("you");
    expect(whoseTurn(row({ status: "on_loan", requester_returned: true }), "requester", { ...ctx, proposal: "them" })).toBe("them"); // the lender must confirm
    expect(whoseTurn(row({ status: "on_loan", owner_got_back: true }), "owner", { ...ctx, proposal: "them" })).toBe("them"); // the borrower must confirm
  });
  it("a 'more time' ask waits on the lender", () => {
    expect(whoseTurn(row({ status: "on_loan" }), "owner", { ...ctx, extensionAsked: true })).toBe("you");
    expect(whoseTurn(row({ status: "on_loan" }), "requester", { ...ctx, extensionAsked: true })).toBe("them");
  });
  it("finished requests wait on nobody", () => {
    for (const status of ["returned", "handed_over", "declined", "cancelled", "forfeited"] as const) {
      expect(whoseTurn(row({ status }), "owner", ctx)).toBeNull();
    }
  });
});

describe("requestStages edge cases", () => {
  const base = { owner_handed_over: false, requester_received: false, owner_got_back: false, requester_returned: false };
  it("returns null for status/mode pairs that can't happen", () => {
    expect(requestStages({ ...base, mode: "give", status: "on_loan" })).toBeNull();
    expect(requestStages({ ...base, mode: "lend", status: "handed_over" })).toBeNull();
  });
});
