"use client";

import { useEffect } from "react";
import { finishSignInFromUrl } from "@/lib/auth/finish-sign-in";

/**
 * Finishes a sign-in that lands on the landing page (see
 * lib/auth/finish-sign-in.ts for the cases and the safety checks). Runs in the
 * browser because the landing page is static and the URL hash never reaches a
 * server.
 */
export function LinkErrorRedirect() {
  useEffect(() => {
    // supabase-js is loaded only when a sign-in link actually arrives, so the
    // landing page doesn't download and parse it for every visitor.
    const getClient = async () => (await import("@/lib/supabase/browser")).createSupabaseBrowserClient()?.auth ?? null;
    void finishSignInFromUrl(window.location, getClient, {
      replaceUrl: (url) => window.history.replaceState(null, "", url),
      go: (url) => window.location.replace(url),
    });
  }, []);
  return null;
}
