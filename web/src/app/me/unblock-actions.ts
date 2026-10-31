"use server";

import { refresh } from "next/cache";
import { requireUser } from "@/lib/supabase/user";

export type UnblockState = { status: "idle" } | { status: "error"; message: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Unblock a reader. Row level security only lets you delete your own blocks; the blocker_id filter says so too. */
export async function unblockReader(_prev: UnblockState, form: FormData): Promise<UnblockState> {
  const { supabase, user } = await requireUser("/me");
  const reader = String(form.get("reader") ?? "");
  if (!UUID.test(reader)) return { status: "error", message: "That didn't work. Refresh and try again." };
  const { error } = await supabase.from("blocks").delete().eq("blocker_id", user.id).eq("blocked_id", reader);
  if (error) return { status: "error", message: "Couldn't unblock just now. Try again." };
  refresh();
  return { status: "idle" };
}
