"use server";

import { refresh } from "next/cache";
import { requireUser } from "@/lib/supabase/user";
import { friendlyError } from "@/lib/supabase/friendly-error";
import { isRealDate } from "@/lib/dates";

export type RequestState = { status: "idle" } | { status: "error"; message: string } | { status: "requested" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function requestCopy(_prev: RequestState, form: FormData): Promise<RequestState> {
  const { supabase } = await requireUser("/browse");
  const copyId = String(form.get("copyId") ?? "");
  const returnByRaw = String(form.get("returnBy") ?? "");
  if (!UUID.test(copyId)) return { status: "error", message: "That book link isn't right." };
  if (returnByRaw !== "" && !isRealDate(returnByRaw)) return { status: "error", message: "Pick a return date from the calendar." };

  const { error } = await supabase.rpc("request_copy", { p_copy: copyId, p_return_by: returnByRaw || null });
  if (error) return { status: "error", message: friendlyError(error, "Couldn't send your request. Try again in a moment.", "browse") };
  refresh();
  return { status: "requested" };
}
