"use server";

import { refresh } from "next/cache";
import { requireUser } from "@/lib/supabase/user";
import { friendlyError } from "@/lib/supabase/friendly-error";
import { seoulLocalToIso } from "@/lib/activity/meetup-time";

export type MeetupState =
  | { status: "idle" }
  | { status: "error"; message: string; values?: { place: string; at: string; note: string } }
  | { status: "done"; message: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const str = (form: FormData, k: string) => (typeof form.get(k) === "string" ? (form.get(k) as string) : "");

/** Propose a place and time (a datetime-local value, read as Seoul time). */
export async function proposeMeetup(_prev: MeetupState, form: FormData): Promise<MeetupState> {
  const { supabase } = await requireUser("/activity");
  const request = str(form, "request");
  const place = str(form, "place").trim().replace(/\s+/g, " ");
  const at = str(form, "at");
  const note = str(form, "note").trim();
  const values = { place, at, note };
  if (!UUID.test(request)) return { status: "error", message: "That didn't work. Refresh and try again.", values };
  if (place.length < 2 || place.length > 80) return { status: "error", message: "Say where to meet (2 to 80 characters).", values };
  const iso = seoulLocalToIso(at);
  if (!iso) return { status: "error", message: "Pick a day and time.", values };
  if (note.length > 200) return { status: "error", message: "Keep the note to 200 characters.", values };

  const { error } = await supabase.rpc("propose_meetup", { p_request: request, p_place: place, p_at: iso, p_note: note || null });
  if (error) return { status: "error", message: friendlyError(error, "Couldn't send that. Try again in a moment.", "meetup:propose"), values };
  refresh();
  return { status: "done", message: "Sent. They'll see it in Activity." };
}

export async function agreeMeetup(_prev: MeetupState, form: FormData): Promise<MeetupState> {
  const { supabase } = await requireUser("/activity");
  const meetup = str(form, "meetup");
  if (!UUID.test(meetup)) return { status: "error", message: "That didn't work. Refresh and try again." };
  const { error } = await supabase.rpc("agree_meetup", { p_meetup: meetup });
  if (error) return { status: "error", message: friendlyError(error, "Couldn't confirm that. Try again in a moment.", "meetup:agree") };
  refresh();
  return { status: "done", message: "Agreed. See you there!" };
}
