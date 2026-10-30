"use server";

import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/safe-redirect";

export type MagicLinkState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; message: string };

// Deliberately simple: the real check is Supabase sending the email.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Where Supabase should send people back to after they click the email link. */
async function siteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function sendMagicLink(
  _prev: MagicLinkState,
  formData: FormData,
): Promise<MagicLinkState> {
  // Validate on the server, never trust the form.
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = safeRedirectPath(String(formData.get("next") ?? ""));

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { status: "error", message: "That email doesn't look right. Check it and try again." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { status: "error", message: "Sign-in isn't set up yet. Try again soon." };
  }

  const origin = await siteOrigin();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    // Don't leak internals; the most common cause is the email rate limit.
    return {
      status: "error",
      message: "We couldn't send the link just now. Wait a minute and try again.",
    };
  }
  return { status: "sent", email };
}
