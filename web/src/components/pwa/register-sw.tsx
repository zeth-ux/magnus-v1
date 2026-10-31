"use client";

import { useEffect } from "react";
import { catchInstallPrompt } from "./install-prompt";

/**
 * Registers the offline-page service worker (production only, so development
 * stays simple), and catches Android's install prompt on whichever page the
 * reader opens first.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    const stop = catchInstallPrompt();
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
        // No service worker means no offline page; the app itself still works.
      });
    }
    return stop;
  }, []);
  return null;
}
