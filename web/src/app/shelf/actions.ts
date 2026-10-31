"use server";

import { refresh } from "next/cache";
import { requireUser } from "@/lib/supabase/user";
import { friendlyError } from "@/lib/supabase/friendly-error";
import { CONDITIONS, LEND_MAX } from "@/lib/books/validate";

export type CopyState = { status: "idle" } | { status: "error"; message: string } | { status: "done"; message: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const str = (form: FormData, k: string) => (typeof form.get(k) === "string" ? (form.get(k) as string) : "");

/** Owner actions on one of their copies: save details, pause, put back, take off the shelf. */
export async function updateCopy(_prev: CopyState, form: FormData): Promise<CopyState> {
  const { supabase, user } = await requireUser("/shelf");
  const id = str(form, "copy");
  const op = str(form, "op");
  if (!UUID.test(id)) return { status: "error", message: "That didn't work. Refresh and try again." };

  const { data: copy } = await supabase.from("copies").select("id, mode, status").eq("id", id).eq("owner_id", user.id).maybeSingle();
  if (!copy) return { status: "error", message: "That book isn't on your shelf." };
  const c = copy as { id: string; mode: "give" | "lend"; status: string };

  if (op === "withdraw") {
    const { error } = await supabase.rpc("withdraw_copy", { p_copy: id });
    if (error) return { status: "error", message: friendlyError(error, "Couldn't take it off the shelf. Try again.", "shelf:withdraw") };
    refresh();
    return { status: "done", message: "Taken off the shelf. Open requests for it were cancelled." };
  }

  let patch: Record<string, unknown>;
  let done: string;
  if (op === "pause" || op === "resume") {
    const from = op === "pause" ? "available" : "paused";
    if (c.status !== from) return { status: "error", message: "Refresh the page: this book has changed." };
    patch = { status: op === "pause" ? "paused" : "available" };
    done = op === "pause" ? "Paused. Nobody can request it until you put it back." : "Back on the shelf.";
  } else if (op === "save") {
    const noteRaw = form.get("note");
    const note = typeof noteRaw === "string" ? noteRaw.trim().replace(/\r\n/g, "\n") : "";
    const condition = str(form, "condition");
    const lendMax = str(form, "lendMax");
    if (note.length > 280) return { status: "error", message: "Keep the note to 280 characters." };
    if (!Object.hasOwn(CONDITIONS, condition)) return { status: "error", message: "Choose the book's condition." };
    if (c.mode === "lend" && !Object.hasOwn(LEND_MAX, lendMax)) return { status: "error", message: "Choose how long you'd lend it for." };
    patch = { note: note || null, condition, ...(c.mode === "lend" ? { lend_max: lendMax } : {}) };
    done = "Saved.";
  } else {
    return { status: "error", message: "That didn't work. Refresh and try again." };
  }

  const { data, error } = await supabase.from("copies").update(patch).eq("id", id).eq("owner_id", user.id).select("id");
  if (error) return { status: "error", message: friendlyError(error, "Couldn't save that. Try again.", `shelf:${op}`) };
  if (!data?.length) return { status: "error", message: "That book isn't on your shelf." };
  refresh();
  return { status: "done", message: done };
}
