"use server";

import { requireUser } from "@/lib/supabase/user";
import { friendlyError } from "@/lib/supabase/friendly-error";

export type RateState = { status: "idle" } | { status: "error"; message: string } | { status: "done"; up: boolean };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function rateHandover(_prev: RateState, form: FormData): Promise<RateState> {
  const { supabase } = await requireUser("/activity");
  const request = String(form.get("request") ?? "");
  const upRaw = String(form.get("up") ?? "");
  if (!UUID.test(request) || (upRaw !== "true" && upRaw !== "false")) return { status: "error", message: "That didn't work. Refresh and try again." };
  const up = upRaw === "true";
  const { error } = await supabase.rpc("rate_handover", { p_request: request, p_up: up });
  if (error) return { status: "error", message: friendlyError(error, "Couldn't save that. Try again.", "rate") };
  return { status: "done", up };
}
