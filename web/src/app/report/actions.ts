"use server";

import { requireUser } from "@/lib/supabase/user";
import { friendlyError } from "@/lib/supabase/friendly-error";

export type ReportState = { status: "idle" } | { status: "error"; message: string; reason: string } | { status: "done"; blocked: boolean };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Report a problem (optionally about a request) and, if asked, block the other
 * reader in it. Both happen in one database call, so a report is never sent
 * without the block the reader asked for. Who to block is worked out in the
 * database from the request, never taken from the form.
 */
export async function sendReport(_prev: ReportState, form: FormData): Promise<ReportState> {
  const { supabase } = await requireUser("/report");
  const reason = String(form.get("reason") ?? "").trim().replace(/\r\n/g, "\n");
  const requestRaw = String(form.get("request") ?? "");
  const request = UUID.test(requestRaw) ? requestRaw : null;
  const block = request !== null && String(form.get("block") ?? "") === "on";
  if ([...reason].length < 5 || [...reason].length > 2000) return { status: "error", message: "Tell us what happened (5 to 2000 characters).", reason };

  const { error } = await supabase.rpc("report_problem", { p_reason: reason, p_request: request, p_block: block });
  if (error) return { status: "error", message: friendlyError(error, "Couldn't send your report. Try again.", "report"), reason };
  return { status: "done", blocked: block };
}
