import { describe as group, expect, it } from "vitest";
import { describe, stampDate, toStamps, type LedgerRow } from "./history";

const row = (kind: LedgerRow["kind"], delta: number, locked = 0): LedgerRow => ({
  id: 1,
  kind,
  delta,
  locked_delta: locked,
  ref_id: "x",
  created_at: "2026-11-01T15:30:00Z",
});

group("library card history", () => {
  it("describes every kind of credit movement", () => {
    expect(describe(row("starter_grant", 1), "Circe")).toEqual({ amount: "+1", text: "Starter credit for listing “Circe”", tone: "plus" });
    expect(describe(row("give_transfer", 1), "Circe").text).toBe("Gave “Circe”");
    expect(describe(row("give_transfer", -1), null)).toEqual({ amount: "−1", text: "Took a book", tone: "minus" });
    expect(describe(row("lend_lock", 0, 1), "Pachinko").amount).toBe("Held 1");
    expect(describe(row("lend_unlock", 0, -1), "Pachinko").text).toBe("Returned “Pachinko”");
    expect(describe(row("lend_forfeit", -1, -1), "Pachinko").tone).toBe("minus");
    expect(describe(row("lend_forfeit", 1), "Pachinko").tone).toBe("plus");
  });

  it("dates stamps in Seoul time", () => {
    expect(stampDate("2026-11-01T15:30:00Z")).toBe("2 Nov");
    expect(toStamps([row("give_transfer", 1)], () => "Circe")[0]).toMatchObject({ date: "2 Nov", amount: "+1" });
  });
});
