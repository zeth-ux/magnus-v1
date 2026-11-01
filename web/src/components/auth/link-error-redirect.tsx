"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { parseSessionHash } from "@/lib/auth/session-hash";
import { safeRedirectPath } from "@/lib/safe-redirect";

/** Characters Supabase uses in a PKCE code. Anything else is ignored. */
const SAFE = /^[A-Za-z0-9_-]{6,200}$/;

/**
 * Finishes a sign-in that lands on the landing page.
 *   #access_token=...&refresh_token=...  an email link (implicit flow): save the
 *                                        session in this browser, then go on
 *   ?code=...                            a PKCE code: pass it to /auth/callback
 *   #error=...&error_code=...            expired, used or old link: /login explains
 * Supabase sends readers here (the Site URL) whenever the return address isn't
 * on its list, so this must work whatever that list says. The hash never
 * reaches a server; the tokens are removed from the address bar straight away.
 * Runs in the browser because the landing page is static.
 */
export function LinkErrorRedirect() {
  useEffect(() => {
    const { search, hash, pathname } = window.location;
    const params = new URLSearchParams(search);
    const session = parseSessionHash(hash);

    if (session) {
      // Don't leave the tokens in the address bar or the history.
      window.history.replaceState(null, "", pathname + search);
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        window.location.replace("/login?error=link");
        return;
      }
      void supabase.auth
        .setSession({ access_token: session.accessToken, refresh_token: session.refreshToken })
        .then(({ error }) => window.location.replace(error ? "/login?error=link" : safeRedirectPath(params.get("next"))));
      return;
    }

    const code = params.get("code");
    if (code && SAFE.test(code)) {
      window.location.replace(`/auth/callback?code=${encodeURIComponent(code)}`);
    } else if (/[#&]error(_code)?=/.test(hash)) {
      window.location.replace("/login?error=link");
    }
  }, []);
  return null;
}
