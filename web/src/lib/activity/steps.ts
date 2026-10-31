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
  copy: { id: string; books: { title: string } | null } | null;
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

export function ownerLine(r: Row, today: string) {
  if (r.status === "requested") return r.mode === "lend" ? `Wants to borrow it until ${pretty(r.return_by!)}.` : "Would like it.";
  if (r.status === "accepted")
    return r.owner_handed_over ? "You've confirmed the handover. Waiting for them to confirm too." : "Agree where to meet, then confirm the handover when you've given it.";
  // on_loan
  const due = r.return_by!;
  if (r.requester_returned) return "They say they've returned it. Confirm once you have it back.";
  return due < today ? `Was due back ${pretty(due)}.` : `Due back ${pretty(due)}.`;
}

export function ownerOps(r: Row, today: string): Op[] {
  if (r.status === "requested")
    return [
      { op: "accept", label: "Accept", primary: true },
      { op: "decline", label: "Decline" },
    ];
  if (r.status === "accepted")
    return [
      ...(r.owner_handed_over ? [] : [{ op: "handover", label: "I handed it over", primary: true } as Op]),
      { op: "cancel", label: "Cancel" },
    ];
  // on_loan (a lend)
  const ops: Op[] = r.owner_got_back ? [] : [{ op: "returned", label: "I got it back", primary: true }];
  if (!r.requester_returned && r.return_by && addDays(r.return_by, 14) < today) ops.push({ op: "report", label: "Report not returned" });
  return ops;
}

export function requesterLine(r: Row) {
  if (r.status === "requested") return "Waiting for the owner to answer.";
  if (r.status === "accepted")
    return r.requester_received ? "You've confirmed you got it. Waiting for the owner to confirm too." : "Accepted! Agree where to meet, then confirm when you have the book.";
  return r.requester_returned ? "You've said you returned it. Waiting for the owner to confirm." : `Yours until ${pretty(r.return_by!)}.`;
}

export function requesterOps(r: Row): Op[] {
  if (r.status === "requested") return [{ op: "cancel", label: "Cancel request" }];
  if (r.status === "accepted")
    return [
      ...(r.requester_received ? [] : [{ op: "handover", label: "I've got the book", primary: true } as Op]),
      { op: "cancel", label: "Cancel" },
    ];
  return r.requester_returned ? [] : [{ op: "returned", label: "I returned it", primary: true }];
}

