/**
 * What the borrower and the lender see about "more time" on a loan. Pure, so
 * the rules are tested here; the database functions (ask_extension,
 * answer_extension) still enforce every one of them.
 */
import { addDays, pretty, type Row } from "./steps";

export type Ask = { id: string; new_return_by: string; status: "asked" | "approved" | "declined" | "replaced" | "closed"; created_at: string };

/** Matches the limit in ask_extension. */
export const MAX_ASKS = 5;

export type ExtensionView =
  | { kind: "none" }
  | {
      kind: "borrower";
      /** The open ask, if any. */
      waiting: { id: string; date: string } | null;
      /** What happened to the last ask that was answered. */
      lastAnswer: string | null;
      /** Date picker bounds, or null when no later date is allowed (and why). */
      pick: { min: string; max: string } | null;
      blocked: "limit" | "period" | null;
    }
  | { kind: "lender"; open: { id: string; date: string; due: string } | null; lastAnswer: string | null };

/** Loans where more time can still be asked for: on loan and nobody has started the return. */
export const canExtend = (r: Row) => r.status === "on_loan" && r.mode === "lend" && !r.owner_got_back && !r.requester_returned && r.return_by !== null;

export function extensionView(
  r: Row,
  asks: Ask[],
  { me, today, maxDays, other }: { me: string; today: string; maxDays: number; other: string },
): ExtensionView {
  if (!canExtend(r) || r.return_by === null) return { kind: "none" };
  const sorted = [...asks].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const open = sorted.find((a) => a.status === "asked") ?? null;
  const answered = sorted.find((a) => a.status === "approved" || a.status === "declined") ?? null;

  if (me === r.owner_id) {
    const lastAnswer = answered ? (answered.status === "approved" ? `You agreed to ${pretty(answered.new_return_by)}.` : `You said no to ${pretty(answered.new_return_by)}.`) : null;
    return { kind: "lender", open: open ? { id: open.id, date: pretty(open.new_return_by), due: pretty(r.return_by) } : null, lastAnswer };
  }
  if (me !== r.requester_id) return { kind: "none" };

  const lastAnswer = answered
    ? answered.status === "approved"
      ? `${other} agreed: it's now due ${pretty(answered.new_return_by)}.`
      : `${other} said no to ${pretty(answered.new_return_by)}.`
    : null;
  const tomorrow = addDays(today, 1);
  const dayAfterDue = addDays(r.return_by, 1);
  const min = dayAfterDue > tomorrow ? dayAfterDue : tomorrow;
  const max = addDays(today, maxDays);
  const blocked = asks.length >= MAX_ASKS ? "limit" : min > max ? "period" : null;
  return {
    kind: "borrower",
    waiting: open ? { id: open.id, date: pretty(open.new_return_by) } : null,
    lastAnswer,
    pick: blocked ? null : { min, max },
    blocked,
  };
}
