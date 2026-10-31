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
  if (!UUID.test(id) || !["withdraw", "pause", "resume", "save"].includes(op)) {
    return { status: "error", message: "That didn't work. Refresh and try again." };
  }

  // withdraw_copy() locks the copy and checks ownership itself.
  if (op === "withdraw") {
    const { error } = await supabase.rpc("withdraw_copy", { p_copy: id });
    if (error) return { status: "error", message: friendlyError(error, "Couldn't take it off the shelf. Try again.", "shelf:withdraw") };
    refresh();
    return { status: "done", message: "Taken off the shelf. Open requests for it were cancelled." };
  }

  const { data: copy, error: readError } = await supabase.from("copies").select("id, mode, status").eq("id", id).eq("owner_id", user.id).maybeSingle();
  if (readError) return { status: "error", message: friendlyError(readError, "Couldn't reach your shelf. Try again.", "shelf:read") };
  if (!copy) return { status: "error", message: "That book isn't on your shelf." };
  const c = copy as { id: string; mode: "give" | "lend"; status: string };

  let patch: Record<string, unknown>;
  let done: string;
  let expectStatus: string | null = null;
  if (op === "pause" || op === "resume") {
    const from = op === "pause" ? "available" : "paused";
    if (c.status !== from) return { status: "error", message: "Refresh the page: this book has changed." };
    patch = { status: op === "pause" ? "paused" : "available" };
    expectStatus = from;
    // Requests already waiting stay waiting (they can't be accepted while paused).
    done = op === "pause" ? "Paused. Nobody new can request it, and waiting requests wait until you put it back." : "Back on the shelf.";
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

  let update = supabase.from("copies").update(patch).eq("id", id).eq("owner_id", user.id);
  // Only flip the status if nothing changed it since we looked (e.g. a handover).
  if (expectStatus) update = update.eq("status", expectStatus);
  const { data, error } = await update.select("id");
  if (error) return { status: "error", message: friendlyError(error, "Couldn't save that. Try again.", `shelf:${op}`) };
  if (!data?.length) return { status: "error", message: "Refresh the page: this book has changed." };
  refresh();
  return { status: "done", message: done };
}
