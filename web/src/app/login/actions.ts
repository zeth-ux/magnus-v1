"use server";

import { headers } from "next/headers";
import { productionOrigin } from "@/lib/site/canonical";
import { normaliseSiteOrigin } from "@/lib/auth/site-origin";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { redirect } from "next/navigation";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { codeErrorMessage, normaliseCode } from "@/lib/auth/otp";

export type MagicLinkState =
  | { status: "idle" }
  | { status: "sent"; email: string; sentAt: number }
  | { status: "error"; message: string; email: string };

// Deliberately simple: the real check is Supabase sending the email.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Where Supabase should send people back to after they click the email link.
 *
 * In production this MUST come from NEXT_PUBLIC_SITE_URL. Never build it from
 * request headers there: whoever sends the request controls Host and
 * X-Forwarded-Host, and a forged host would put a real sign-in code inside a
 * link to someone else's website. Locally, the request's own host is fine.
 */
async function siteOrigin(): Promise<string | null> {
  // On production the email link goes to the same one address the proxy
  // redirects to, so the session lands where the reader will use it.
  const production = productionOrigin({
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  });
  if (production) return production;
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    const origin = normaliseSiteOrigin(configured);
    if (!origin) console.error("[auth] NEXT_PUBLIC_SITE_URL isn't a usable address");
    return origin;
  }
  if (process.env.NODE_ENV === "production") {
    console.error("[auth] NEXT_PUBLIC_SITE_URL is not set in production");
    return null;
  }
  const host = (await headers()).get("host") ?? "localhost:3000";
  return `http://${host}`;
}

export async function sendMagicLink(
  _prev: MagicLinkState,
  formData: FormData,
): Promise<MagicLinkState> {
  // Validate on the server, never trust the form.
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = safeRedirectPath(String(formData.get("next") ?? ""));

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return {
      status: "error",
      email,
      message: "That email doesn't look right. Check it and try again.",
    };
  }

  // The email link uses the implicit flow (the session comes back in the URL
  // hash, finished by components/auth/link-error-redirect.tsx), so it works in
  // whichever browser the phone opens it in. The PKCE flow needs a key saved
  // in the browser that asked, which fails when Gmail opens the link itself.
  // This client only sends the email: nothing to remember, no cookies.
  const env = getSupabaseEnv();
  const supabase = env
    ? createClient(env.url, env.publishableKey, {
        auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      })
    : null;
  const origin = await siteOrigin();
  if (!supabase || !origin) {
    return { status: "error", email, message: "Sign-in isn't set up yet. Try again soon." };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/?next=${encodeURIComponent(next)}`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    // Log the code (never the email) so failed sends can be debugged in Vercel logs.
    console.error("[auth] signInWithOtp failed:", error.code ?? error.status);
    if (error.code === "over_email_send_rate_limit") {
      return {
        status: "error",
        email,
        // Supabase uses this code for both the 60-second resend wait and the hourly cap.
        message: "We've just emailed you, or our email is busy right now. If you have an email from us, use the newest. Otherwise try again in a few minutes.",
      };
    }
    return {
      status: "error",
      email,
      message: "We couldn't send the email just now. Wait a minute and try again.",
    };
  }
  return { status: "sent", email, sentAt: Date.now() };
}

export type CodeState = { status: "idle" } | { status: "error"; message: string };

/**
 * Sign in with the code from the email. Works for new and returning readers
 * alike (Supabase's email OTP), in whatever browser or installed app the
 * reader is using: nothing has to be opened from the email.
 * Supabase limits how often codes can be checked, and each code works once.
 */
export async function verifyCode(_prev: CodeState, formData: FormData): Promise<CodeState> {
  // Validate on the server, never trust the form.
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const token = normaliseCode(formData.get("code"));
  const next = safeRedirectPath(String(formData.get("next") ?? ""));
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { status: "error", message: "Something went wrong with your email. Start again with your email address." };
  }
  if (!token) {
    return { status: "error", message: "Type the code from the email: 6 digits (some emails have 8)." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", message: "Sign-in isn't set up yet. Try again soon." };

  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) {
    console.error("[auth] verifyOtp (code) failed:", error.code ?? error.status);
    return { status: "error", message: codeErrorMessage(error.code) };
  }
  // The session cookies are set on this response; go where the reader was heading.
  redirect(next);
}
