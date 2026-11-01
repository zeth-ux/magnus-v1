import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/safe-redirect";

/** The OTP types this app accepts from an email link. Anything else is rejected. */
const ALLOWED_OTP_TYPES: readonly EmailOtpType[] = ["email", "magiclink", "signup", "invite"];

function isAllowedOtpType(value: string | null): value is EmailOtpType {
  return value !== null && (ALLOWED_OTP_TYPES as readonly string[]).includes(value);
}

/**
 * Where the magic-link email and Google sign-in send people back to.
 * Handles both link styles Supabase can send:
 *   ?token_hash=...&type=email  (our email template: works in ANY browser,
 *                                e.g. when Gmail opens the link in its own app)
 *   ?code=...                   (PKCE flow: Google, and Supabase's default
 *                                template; only works in the browser that asked)
 * On success, redirects to a safe `next` path; on failure, back to /login with
 * a reason the login page explains.
 */
export async function GET(request: NextRequest) {
  // A service worker's navigation preload is an invisible copy of this request.
  // It must never use the one-time code, or the real request (the one the
  // reader sees) finds it used and fails. Our worker no longer preloads, but a
  // phone with the old worker still does on its first visit after the update.
  if (request.headers.has("service-worker-navigation-preload")) return new Response(null, { status: 204 });

  const { searchParams, origin } = request.nextUrl;
  const next = safeRedirectPath(searchParams.get("next"));
  const failure = NextResponse.redirect(`${origin}/login?error=link`);

  const supabase = await createSupabaseServerClient();
  if (!supabase) return failure;

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  if (tokenHash && isAllowedOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    console.error("[auth] verifyOtp failed:", error.code ?? error.status);
    return failure;
  }

  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    console.error("[auth] exchangeCodeForSession failed:", error.code ?? error.status);
    return failure;
  }

  return failure;
}
