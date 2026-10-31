"use client";

import { useEffect } from "react";

/** Registers the offline-page service worker (production only, so development stays simple). */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // No service worker means no offline page; the app itself still works.
    });
  }, []);
  return null;
}
