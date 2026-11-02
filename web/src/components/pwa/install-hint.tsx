"use client";

import { useId, useSyncExternalStore } from "react";
import { getInstallPrompt, subscribeInstallPrompt, showInstallPrompt } from "./install-prompt";

type Platform = "installed" | "ios" | "other";

function readPlatform(): Platform {
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
  if (standalone) return "installed";
  // iPadOS says it's a Mac; a touch screen gives it away.
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  return ios ? "ios" : "other";
}
const noSubscribe = () => () => {};

/**
 * "Add Bayu to your home screen": a real Install button where the browser
 * offers one (Android Chrome), step-by-step words for iPhone and iPad, and
 * nothing once Bayu is already installed. Renders nothing on the server and
 * on the first client render, so hydration always matches.
 */
export function InstallHint() {
  const headingId = useId();
  const platform = useSyncExternalStore<Platform | null>(noSubscribe, readPlatform, () => null);
  const prompt = useSyncExternalStore(subscribeInstallPrompt, getInstallPrompt, () => null);

  if (platform === null || platform === "installed") return null;
  if (platform === "other" && !prompt) return null;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3 card p-6">
      <h2 id={headingId} className="font-display text-xl font-semibold">
        Put Bayu on your home screen
      </h2>
      {platform === "ios" ? (
        <p className="text-[17px] leading-relaxed text-ink/80">
          Open Bayu in Safari, tap the Share button (the square with an arrow), then <strong className="text-ink">Add to Home Screen</strong>.
        </p>
      ) : (
        <button type="button" onClick={() => void showInstallPrompt()} className="btn-primary self-start">
          Install Bayu
        </button>
      )}
    </section>
  );
}
