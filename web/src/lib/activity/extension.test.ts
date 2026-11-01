import { describe, expect, it } from "vitest";
import { extensionView, type Ask } from "./extension";
import type { Row } from "./steps";

const loan = (over: Partial<Row> = {}): Row => ({
  id: "r1",
  mode: "lend",
  status: "on_loan",
  return_by: "2026-11-10",
  owner_id: "owner",
  requester_id: "reader",
  owner_handed_over: true,
  requester_received: true,
  owner_got_back: false,
  requester_returned: false,
  updated_at: "2026-11-01T00:00:00Z",
  copy: null,
  owner: null,
  requester: null,
  ...over,
});
const ask = (id: string, date: string, status: Ask["status"], created_at: string): Ask => ({ id, new_return_by: date, status, created_at });
const ctx = (me: string) => ({ me, today: "2026-11-01", maxDays: 28, other: "Aina" });

describe("extensionView", () => {
  it("the borrower can pick from the day after the due date up to the lend period from today", () => {
    expect(extensionView(loan(), [], ctx("reader"))).toEqual({ kind: "borrower", waiting: null, lastAnswer: null, pick: { min: "2026-11-11", max: "2026-11-29" }, blocked: null });
  });

  it("an overdue borrower can still pick from tomorrow", () => {
    const v = extensionView(loan({ return_by: "2026-10-20" }), [], ctx("reader"));
    expect(v.kind === "borrower" && v.pick).toEqual({ min: "2026-11-02", max: "2026-11-29" });
  });

  it("no picker when the due date is already at the limit, or after 5 asks", () => {
    const atLimit = extensionView(loan({ return_by: "2026-11-29" }), [], ctx("reader"));
    expect(atLimit).toMatchObject({ pick: null, blocked: "period" });
    const five = Array.from({ length: 5 }, (_, i) => ask(`a${i}`, "2026-11-12", "replaced", `2026-11-01T0${i}:00:00Z`));
    const limited = extensionView(loan(), five, ctx("reader"));
    expect(limited).toMatchObject({ pick: null, blocked: "limit" });
  });

  it("shows the open ask and the latest answer, newest first", () => {
    const asks = [ask("a1", "2026-11-15", "declined", "2026-11-01T01:00:00Z"), ask("a2", "2026-11-13", "asked", "2026-11-01T02:00:00Z")];
    const reader = extensionView(loan(), asks, ctx("reader"));
    expect(reader).toMatchObject({ kind: "borrower", waiting: { id: "a2", date: "13 Nov" }, lastAnswer: "Aina said no to 15 Nov." });
    const owner = extensionView(loan(), asks, ctx("owner"));
    expect(owner).toEqual({ kind: "lender", open: { id: "a2", date: "13 Nov", due: "10 Nov" }, lastAnswer: "You said no to 15 Nov." });
  });

  it("nothing once the return has started, for gives, or for outsiders", () => {
    expect(extensionView(loan({ requester_returned: true }), [], ctx("reader")).kind).toBe("none");
    expect(extensionView(loan({ owner_got_back: true }), [], ctx("owner")).kind).toBe("none");
    expect(extensionView(loan({ mode: "give", status: "handed_over", return_by: null }), [], ctx("reader")).kind).toBe("none");
    expect(extensionView(loan(), [], ctx("stranger")).kind).toBe("none");
  });
});
