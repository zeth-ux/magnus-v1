"use client";

import { useEffect } from "react";

/**
 * When Supabase can't use a sign-in link (expired, already used, or an older
 * email), it sends the reader to the Site URL, our landing page, with the
 * reason in the URL hash (#error=access_denied&error_code=otp_expired...).
 * The landing page alone would look like a loop, so send them to the login
 * page, which explains it and lets them ask for a new link.
 * The hash never reaches the server, so this has to run in the browser.
 */
export function LinkErrorRedirect() {
  useEffect(() => {
    const hash = window.location.hash;
    if (/[#&]error(_code)?=/.test(hash)) window.location.replace("/login?error=link");
  }, []);
  return null;
}
