import { describe, expect, it } from "vitest";
import { stampDate, stampFor, toStamps, type LedgerRow } from "./history";

const row = (kind: LedgerRow["kind"], delta: number, locked = 0): LedgerRow => ({
  id: 1,
  kind,
  delta,
  locked_delta: locked,
  ref_id: "x",
  created_at: "2026-11-01T15:30:00Z",
});

describe("library card history", () => {
  it("describes every kind of credit movement", () => {
    expect(stampFor(row("starter_grant", 1), "Circe")).toEqual({ amount: "+1", text: "Starter credit for listing “Circe”", tone: "plus" });
    expect(stampFor(row("give_transfer", 1), "Circe").text).toBe("Gave “Circe”");
    expect(stampFor(row("give_transfer", -1), null)).toEqual({ amount: "−1", text: "Took a book", tone: "minus" });
    expect(stampFor(row("lend_lock", 0, 1), "Pachinko").amount).toBe("Held 1");
    expect(stampFor(row("lend_unlock", 0, -1), "Pachinko").text).toBe("Returned “Pachinko”");
    expect(stampFor(row("lend_forfeit", -1, -1), "Pachinko").tone).toBe("minus");
    expect(stampFor(row("lend_forfeit", 1), "Pachinko").tone).toBe("plus");
  });

  it("dates stamps in Seoul time", () => {
    expect(stampDate("2026-11-01T15:30:00Z")).toBe("2 Nov 2026");
    expect(toStamps([row("give_transfer", 1)], () => "Circe")[0]).toMatchObject({ date: "2 Nov 2026", amount: "+1" });
  });
});
