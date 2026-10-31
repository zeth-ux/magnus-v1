"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/user";
import { parseProfile, type FieldErrors } from "@/lib/books/validate";
import { safeRedirectPath } from "@/lib/safe-redirect";

export type ProfileValues = { displayName: string; area: string; whatsapp: string };

export type ProfileState =
  | { status: "idle" }
  | { status: "error"; errors: FieldErrors; message?: string; values: ProfileValues; attempt: number }
  | { status: "saved"; values: ProfileValues; attempt: number };

const valuesOf = (form: FormData): ProfileValues => {
  const get = (k: string) => (typeof form.get(k) === "string" ? (form.get(k) as string) : "");
  return { displayName: get("displayName"), area: get("area"), whatsapp: get("whatsapp") };
};

export async function saveProfile(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const { supabase, user } = await requireUser("/me");
  const values = valuesOf(form);
  const fail = (errors: FieldErrors, message?: string): ProfileState => ({ status: "error", errors, message, values, attempt: Date.now() });

  const parsed = parseProfile(form);
  if (!parsed.ok) return fail(parsed.errors);
  const { displayName, area, whatsapp } = parsed.value;

  const profile = await supabase.from("profiles").upsert({ id: user.id, display_name: displayName, area }, { onConflict: "id" });
  if (profile.error) {
    console.error("[me] profile save failed", profile.error.code);
    return fail({}, "Couldn't save your profile. Try again in a moment.");
  }

  const contact = await supabase.from("profile_contacts").upsert({ id: user.id, whatsapp }, { onConflict: "id" });
  if (contact.error) {
    console.error("[me] contact save failed", contact.error.code);
    return fail({}, "Saved your name and area, but not the WhatsApp number. Try again.");
  }

  const nextRaw = form.get("next");
  const next = safeRedirectPath(typeof nextRaw === "string" ? nextRaw : null);
  if (next !== "/welcome" && next !== "/") redirect(next);
  // Re-render the page so the credits card appears for a brand-new profile.
  refresh();
  return { status: "saved", values: { displayName, area, whatsapp: whatsapp ?? "" }, attempt: Date.now() };
}
