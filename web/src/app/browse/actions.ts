"use server";

import { refresh } from "next/cache";
import { requireUser } from "@/lib/supabase/user";

export type RequestState = { status: "idle" } | { status: "error"; message: string } | { status: "requested" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
/** Errors raised by our own database functions carry a message meant for readers. */
const FRIENDLY_CODES = new Set(["23514", "23505", "P0002", "42501"]);

export async function requestCopy(_prev: RequestState, form: FormData): Promise<RequestState> {
  const { supabase } = await requireUser("/browse");
  const copyId = String(form.get("copyId") ?? "");
  const returnByRaw = String(form.get("returnBy") ?? "");
  if (!UUID.test(copyId)) return { status: "error", message: "That book link isn't right." };
  const returnBy = returnByRaw === "" ? null : DATE.test(returnByRaw) ? returnByRaw : undefined;
  if (returnBy === undefined) return { status: "error", message: "Pick a return date." };

  const { error } = await supabase.rpc("request_copy", { p_copy: copyId, p_return_by: returnBy });
  if (error) {
    if (FRIENDLY_CODES.has(error.code ?? "")) {
      const message = error.message.charAt(0).toUpperCase() + error.message.slice(1);
      return { status: "error", message: message.endsWith(".") ? message : `${message}.` };
    }
    console.error("[browse] request_copy failed", error.code);
    return { status: "error", message: "Couldn't send your request. Try again in a moment." };
  }
  refresh();
  return { status: "requested" };
}
