/**
 * What each person sees and can do at each step of a request (docs/user-flow.md,
 * "Request lifecycle"). Pure functions: the page renders them, the database
 * functions enforce them, and the tests pin them down.
 */
export type Op = { op: "accept" | "decline" | "cancel" | "handover" | "returned" | "report"; label: string; primary?: boolean };

export type Row = {
  id: string;
  mode: "give" | "lend";
  status: "requested" | "accepted" | "declined" | "cancelled" | "handed_over" | "on_loan" | "returned" | "forfeited";
  return_by: string | null;
  owner_id: string;
  requester_id: string;
  owner_handed_over: boolean;
  requester_received: boolean;
  owner_got_back: boolean;
  requester_returned: boolean;
  updated_at: string;
  copy: { id: string; status: string; books: { title: string } | null } | null;
  owner: { display_name: string } | null;
  requester: { display_name: string } | null;
};


/** Ansan's date, matching the database's public.today(). */
export const seoulToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
export const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
export const pretty = (date: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));


export const STATUS_WORDS: Record<Row["status"], string> = {
  requested: "Waiting for an answer",
  accepted: "Accepted",
  declined: "Declined",
  cancelled: "Cancelled",
  handed_over: "Handed over",
  on_loan: "On loan",
  returned: "Returned",
  forfeited: "Kept by the borrower; the held credit went to the lender",
};

/** What else is going on with the same copy (the page works it out from the owner's requests). */
export type Context = { today: string; copyBusy: boolean };

/** A lend whose return date has passed before the handover can't be completed (the database refuses). */
const staleLend = (r: Row, today: string) => r.mode === "lend" && r.return_by !== null && r.return_by <= today;
/** Every lend has a return date (the lend_has_date constraint); this keeps TypeScript and the text honest. */
const dueOf = (r: Row) => r.return_by ?? "";

export function ownerLine(r: Row, { today, copyBusy }: Context): string {
  if (r.status === "requested") {
    if (copyBusy) return "You've already accepted another reader for this book.";
    return r.mode === "lend" ? `Wants to borrow it until ${pretty(dueOf(r))}.` : "Would like it.";
  }
  if (r.status === "accepted") {
    if (staleLend(r, today)) return "The return date has passed before you met. Cancel, and they can ask again with a new date.";
    return r.owner_handed_over ? "You've confirmed the handover. Waiting for them to confirm too." : "Agree where to meet, then confirm the handover when you've given it.";
  }
  if (r.status !== "on_loan") return "";
  if (r.owner_got_back) return "You've confirmed it's back. Waiting for them to confirm too.";
  if (r.requester_returned) return "They say they've returned it. Confirm once you have it back.";
  const due = dueOf(r);
  return due < today ? `Was due back ${pretty(due)}.` : `Due back ${pretty(due)}.`;
}

export function ownerOps(r: Row, { today, copyBusy }: Context): Op[] {
  if (r.status === "requested") {
    const decline: Op = { op: "decline", label: "Decline" };
    return copyBusy ? [decline] : [{ op: "accept", label: "Accept", primary: true }, decline];
  }
  if (r.status === "accepted") {
    const cancel: Op = { op: "cancel", label: "Cancel" };
    if (staleLend(r, today) || r.owner_handed_over) return [cancel];
    return [{ op: "handover", label: "I handed it over", primary: true }, cancel];
  }
  if (r.status !== "on_loan") return [];
  const ops: Op[] = r.owner_got_back ? [] : [{ op: "returned", label: "I got it back", primary: true }];
  // R4 is only for a book that never came back: not once either side says it did.
  if (!r.owner_got_back && !r.requester_returned && r.return_by && addDays(r.return_by, 14) < today) {
    ops.push({ op: "report", label: "Report not returned" });
  }
  return ops;
}

export function requesterLine(r: Row, today: string): string {
  if (r.status === "requested") return "Waiting for the owner to answer.";
  if (r.status === "accepted") {
    if (staleLend(r, today)) return "The return date has passed before you met. Cancel and ask again with a new date.";
    return r.requester_received ? "You've confirmed you got it. Waiting for the owner to confirm too." : "Accepted! Agree where to meet, then confirm when you have the book.";
  }
  if (r.status !== "on_loan") return "";
  if (r.requester_returned) return "You've said you returned it. Waiting for the owner to confirm.";
  if (r.owner_got_back) return "The owner says it's back. Confirm to unlock your credit.";
  return `Yours until ${pretty(dueOf(r))}.`;
}

export function requesterOps(r: Row, today: string): Op[] {
  if (r.status === "requested") return [{ op: "cancel", label: "Cancel request" }];
  if (r.status === "accepted") {
    const cancel: Op = { op: "cancel", label: "Cancel" };
    if (staleLend(r, today) || r.requester_received) return [cancel];
    return [{ op: "handover", label: "I've got the book", primary: true }, cancel];
  }
  if (r.status !== "on_loan") return [];
  return r.requester_returned ? [] : [{ op: "returned", label: "I returned it", primary: true }];
}
