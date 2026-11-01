"use client";

import { useEffect } from "react";

/** Characters Supabase uses in a PKCE code. Anything else is ignored. */
const SAFE = /^[A-Za-z0-9_-]{6,200}$/;

/**
 * Sign-in links that end up on the landing page instead of /auth/callback.
 *
 * Supabase sends a reader to the Site URL (this page) when the address the app
 * asked for doesn't match its Redirect URLs list, so the sign-in still has to
 * be finished here:
 *   ?code=...                  a good link: pass the code to /auth/callback
 *   #error=...&error_code=...  expired, used or old link: /login explains
 * Only a well-formed code is forwarded, to our own /auth/callback, which checks
 * it with Supabase (and it only works in the browser that asked for the link).
 * Where to go next is the callback's default (DEFAULT_AFTER_LOGIN). Runs in the browser because the landing page is
 * static (and the hash never reaches the server).
 */
export function LinkErrorRedirect() {
  useEffect(() => {
    const { search, hash } = window.location;
    const params = new URLSearchParams(search);
    const code = params.get("code");

    if (code && SAFE.test(code)) {
      window.location.replace(`/auth/callback?code=${encodeURIComponent(code)}`);
    } else if (/[#&]error(_code)?=/.test(hash)) {
      window.location.replace("/login?error=link");
    }
  }, []);
  return null;
}
