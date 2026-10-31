"use server";

import { requireUser } from "@/lib/supabase/user";
import { friendlyError } from "@/lib/supabase/friendly-error";

export type ReportState = { status: "idle" } | { status: "error"; message: string; reason: string } | { status: "done"; blocked: boolean };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Report a problem (optionally about a request) and, if asked, block the other reader. */
export async function sendReport(_prev: ReportState, form: FormData): Promise<ReportState> {
  const { supabase } = await requireUser("/report");
  const reason = String(form.get("reason") ?? "").trim().replace(/\r\n/g, "\n");
  const requestRaw = String(form.get("request") ?? "");
  const blockRaw = String(form.get("block") ?? "");
  const request = UUID.test(requestRaw) ? requestRaw : null;
  if ([...reason].length < 5 || [...reason].length > 2000) return { status: "error", message: "Tell us what happened (5 to 2000 characters).", reason };

  const { error } = await supabase.rpc("report_problem", { p_reason: reason, p_request: request });
  if (error) return { status: "error", message: friendlyError(error, "Couldn't send your report. Try again.", "report"), reason };

  // Block only the other reader in this request (looked up on the server, never taken from the form).
  if (request && blockRaw === "on") {
    const { data: r } = await supabase.from("requests").select("owner_id, requester_id").eq("id", request).maybeSingle();
    const { data: me } = await supabase.auth.getUser();
    const row = r as { owner_id: string; requester_id: string } | null;
    if (row && me.user) {
      const other = row.owner_id === me.user.id ? row.requester_id : row.owner_id;
      const blocked = await supabase.rpc("block_reader", { p_user: other });
      if (blocked.error) return { status: "error", message: friendlyError(blocked.error, "Your report was sent, but blocking didn't work. Try again.", "block"), reason: "" };
      return { status: "done", blocked: true };
    }
  }
  return { status: "done", blocked: false };
}
