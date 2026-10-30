import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/safe-redirect";

/**
 * Where the magic-link email and Google sign-in send people back to.
 * Handles both link styles Supabase can send:
 *   ?code=...                 (PKCE flow: Google, and the default magic link)
 *   ?token_hash=...&type=...  (custom email templates)
 * On success, redirects to a safe `next` path; on failure, back to /login.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeRedirectPath(searchParams.get("next"));
  const failure = NextResponse.redirect(`${origin}/login?error=link`);

  const supabase = await createSupabaseServerClient();
  if (!supabase) return failure;

  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return failure;
  }

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return failure;
}
