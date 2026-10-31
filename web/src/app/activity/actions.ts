"use server";

import { refresh } from "next/cache";
import { requireUser } from "@/lib/supabase/user";
import { friendlyError } from "@/lib/supabase/friendly-error";

export type ActState = { status: "idle" } | { status: "error"; message: string } | { status: "done"; message: string };

/** Each button maps to one database function; nothing else can be called from here. */
const OPS = {
  accept: { fn: "respond_request", args: (id: string) => ({ p_request: id, p_accept: true }), done: "Accepted." },
  decline: { fn: "respond_request", args: (id: string) => ({ p_request: id, p_accept: false }), done: "Declined." },
  cancel: { fn: "cancel_request", args: (id: string) => ({ p_request: id }), done: "Cancelled." },
  handover: { fn: "confirm_handover", args: (id: string) => ({ p_request: id }), done: "Confirmed. Thanks!" },
  returned: { fn: "confirm_return", args: (id: string) => ({ p_request: id }), done: "Confirmed." },
  report: { fn: "report_not_returned", args: (id: string) => ({ p_request: id }), done: "Reported. The held credit is now yours." },
} as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function act(_prev: ActState, form: FormData): Promise<ActState> {
  const { supabase } = await requireUser("/activity");
  const id = String(form.get("request") ?? "");
  const op = String(form.get("op") ?? "");
  if (!UUID.test(id) || !Object.hasOwn(OPS, op)) return { status: "error", message: "That didn't work. Refresh and try again." };
  const spec = OPS[op as keyof typeof OPS];

  const { error } = await supabase.rpc(spec.fn, spec.args(id));
  if (error) return { status: "error", message: friendlyError(error, "That didn't go through. Try again in a moment.", `activity:${op}`) };
  refresh();
  return { status: "done", message: spec.done };
}
