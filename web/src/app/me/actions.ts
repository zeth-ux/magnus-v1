"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/user";
import { parseProfile, type FieldErrors } from "@/lib/books/validate";
import { safeRedirectPath } from "@/lib/safe-redirect";

export type ProfileState =
  | { status: "idle" }
  | { status: "error"; errors: FieldErrors; message?: string }
  | { status: "saved" };

export async function saveProfile(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const parsed = parseProfile(form);
  if (!parsed.ok) return { status: "error", errors: parsed.errors };
  const { supabase, user } = await requireUser("/me");
  const { displayName, area, whatsapp } = parsed.value;

  const profile = await supabase
    .from("profiles")
    .upsert({ id: user.id, display_name: displayName, area }, { onConflict: "id" });
  if (profile.error) return { status: "error", errors: {}, message: "Couldn't save your profile. Try again in a moment." };

  const contact = await supabase.from("profile_contacts").upsert({ id: user.id, whatsapp }, { onConflict: "id" });
  if (contact.error) return { status: "error", errors: {}, message: "Saved your name and area, but not the WhatsApp number. Try again." };

  const next = safeRedirectPath(typeof form.get("next") === "string" ? (form.get("next") as string) : null);
  if (next !== "/welcome" && next !== "/") redirect(next);
  return { status: "saved" };
}
