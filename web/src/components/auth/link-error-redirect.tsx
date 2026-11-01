"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { finishSignInFromUrl } from "@/lib/auth/finish-sign-in";

/**
 * Finishes a sign-in that lands on the landing page (see
 * lib/auth/finish-sign-in.ts for the cases and the safety checks). Runs in the
 * browser because the landing page is static and the URL hash never reaches a
 * server.
 */
export function LinkErrorRedirect() {
  useEffect(() => {
    void finishSignInFromUrl(window.location, () => createSupabaseBrowserClient()?.auth ?? null, {
      replaceUrl: (url) => window.history.replaceState(null, "", url),
      go: (url) => window.location.replace(url),
    });
  }, []);
  return null;
}
