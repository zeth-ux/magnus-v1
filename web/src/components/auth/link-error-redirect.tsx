"use client";

import { useEffect } from "react";

/** Characters Supabase uses in a PKCE code or a token hash. Anything else is ignored. */
const SAFE = /^[A-Za-z0-9_-]{6,200}$/;
const OTP_TYPES = new Set(["email", "magiclink", "signup", "invite"]);

/**
 * Sign-in links that end up on the landing page instead of /auth/callback.
 *
 * Supabase sends a reader to the Site URL (this page) when the address the app
 * asked for doesn't match its Redirect URLs list, so the sign-in still has to
 * be finished here:
 *   ?code=...                       a good link: pass the code to /auth/callback
 *   ?token_hash=...&type=email      the same, for the custom email template
 *   #error=...&error_code=...       expired, used or old link: /login explains
 * Only these exact parameters are forwarded, to our own /auth/callback, which
 * checks them with Supabase. Runs in the browser because the landing page is
 * static (and the hash never reaches the server).
 */
export function LinkErrorRedirect() {
  useEffect(() => {
    const { search, hash } = window.location;
    const params = new URLSearchParams(search);
    const code = params.get("code");
    const tokenHash = params.get("token_hash");
    const type = params.get("type");

    if (code && SAFE.test(code)) {
      window.location.replace(`/auth/callback?code=${encodeURIComponent(code)}&next=%2Fwelcome`);
    } else if (tokenHash && SAFE.test(tokenHash) && type && OTP_TYPES.has(type)) {
      window.location.replace(`/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=${type}&next=%2Fwelcome`);
    } else if (/[#&]error(_code)?=/.test(hash)) {
      window.location.replace("/login?error=link");
    }
  }, []);
  return null;
}
