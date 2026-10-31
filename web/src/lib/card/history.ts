/**
 * The library card's stamped history: one line per credit_ledger row the
 * reader can see (their own). Pure, so the wording is tested.
 */
export type LedgerRow = {
  id: number;
  kind: "starter_grant" | "give_transfer" | "lend_lock" | "lend_unlock" | "lend_forfeit";
  delta: number;
  locked_delta: number;
  ref_id: string;
  created_at: string;
};

export type Stamp = { id: number; amount: string; text: string; date: string; tone: "plus" | "minus" | "held" };

export function describe(row: LedgerRow, title: string | null): Omit<Stamp, "id" | "date"> {
  const book = title ? `“${title}”` : "a book";
  switch (row.kind) {
    case "starter_grant":
      return { amount: "+1", text: `Starter credit for listing ${book}`, tone: "plus" };
    case "give_transfer":
      return row.delta > 0
        ? { amount: "+1", text: `Gave ${book}`, tone: "plus" }
        : { amount: "−1", text: `Took ${book}`, tone: "minus" };
    case "lend_lock":
      return { amount: "Held 1", text: `Borrowing ${book}`, tone: "held" };
    case "lend_unlock":
      return { amount: "Freed 1", text: `Returned ${book}`, tone: "plus" };
    case "lend_forfeit":
      return row.delta > 0
        ? { amount: "+1", text: `Kept the deposit: ${book} wasn't returned`, tone: "plus" }
        : { amount: "−1", text: `Deposit went to the lender: ${book} wasn't returned`, tone: "minus" };
  }
}

/** "1 Nov" in Seoul time. */
export const stampDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Seoul", day: "numeric", month: "short" }).format(new Date(iso));

export function toStamps(rows: LedgerRow[], titleOf: (row: LedgerRow) => string | null): Stamp[] {
  return rows.map((r) => ({ id: r.id, date: stampDate(r.created_at), ...describe(r, titleOf(r)) }));
}
