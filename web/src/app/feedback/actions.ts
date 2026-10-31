"use server";

import { requireUser } from "@/lib/supabase/user";
import { friendlyError } from "@/lib/supabase/friendly-error";

export type FeedbackState = { status: "idle" } | { status: "error"; message: string; text: string } | { status: "done" };

export async function sendFeedback(_prev: FeedbackState, form: FormData): Promise<FeedbackState> {
  const { supabase } = await requireUser("/feedback");
  const text = String(form.get("message") ?? "").trim().replace(/\r\n/g, "\n");
  if ([...text].length < 3 || [...text].length > 2000) return { status: "error", message: "Write a few words (up to 2000 characters).", text };
  const { error } = await supabase.rpc("send_feedback", { p_message: text });
  if (error) return { status: "error", message: friendlyError(error, "Couldn't send it. Try again.", "feedback"), text };
  return { status: "done" };
}
