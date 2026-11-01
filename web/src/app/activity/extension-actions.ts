"use server";

import { refresh } from "next/cache";
import { requireUser } from "@/lib/supabase/user";
import { friendlyError } from "@/lib/supabase/friendly-error";

export type ExtensionState = { status: "idle" } | { status: "error"; message: string; date?: string } | { status: "done"; message: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
/** A real calendar date (JS rolls 2026-02-31 over to 3 March, so check the round trip). */
const isDate = (d: string) => DATE.test(d) && !Number.isNaN(Date.parse(`${d}T00:00:00Z`)) && new Date(`${d}T00:00:00Z`).toISOString().slice(0, 10) === d;
const str = (form: FormData, k: string) => (typeof form.get(k) === "string" ? (form.get(k) as string) : "");

/** The borrower asks to keep the book until a later date. The database checks the limits. */
export async function askExtension(_prev: ExtensionState, form: FormData): Promise<ExtensionState> {
  const { supabase } = await requireUser("/activity");
  const request = str(form, "request");
  const date = str(form, "date");
  if (!UUID.test(request)) return { status: "error", message: "That didn't work. Refresh and try again." };
  if (!isDate(date)) return { status: "error", message: "Pick a date.", date };
  const { error } = await supabase.rpc("ask_extension", { p_request: request, p_new_date: date });
  if (error) return { status: "error", message: friendlyError(error, "Couldn't send that. Try again in a moment.", "extension:ask"), date };
  refresh();
  return { status: "done", message: "Asked. The owner will see it in Activity." };
}

/** The lender says yes (the due date moves) or no. */
export async function answerExtension(_prev: ExtensionState, form: FormData): Promise<ExtensionState> {
  const { supabase } = await requireUser("/activity");
  const extension = str(form, "extension");
  const answer = str(form, "answer");
  if (!UUID.test(extension) || (answer !== "yes" && answer !== "no")) return { status: "error", message: "That didn't work. Refresh and try again." };
  const { error } = await supabase.rpc("answer_extension", { p_extension: extension, p_approve: answer === "yes" });
  if (error) return { status: "error", message: friendlyError(error, "Couldn't save that. Try again in a moment.", "extension:answer") };
  refresh();
  return { status: "done", message: answer === "yes" ? "Done: the new due date is set." : "Okay, the due date stays the same." };
}
