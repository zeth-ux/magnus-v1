"use client";

import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

/**
 * "Add Bayu to your home screen": a real Install button where the browser
 * offers one (Android Chrome), step-by-step words for iPhone Safari, and
 * nothing once Bayu is already installed.
 */
export function InstallHint() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [platform, setPlatform] = useState<"installed" | "ios" | "other" | null>(null);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    // Reading the device happens after mount, so server and first client render match.
    const id = requestAnimationFrame(() => setPlatform(standalone ? "installed" : ios ? "ios" : "other"));
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);

  if (platform === null || platform === "installed") return null;
  if (platform === "other" && !prompt) return null;

  return (
    <section aria-labelledby="install-heading" className="flex flex-col gap-3 rounded-[10px] border border-paper/25 p-6">
      <h2 id="install-heading" className="font-display text-xl font-semibold">
        Put Bayu on your home screen
      </h2>
      {platform === "ios" ? (
        <p className="text-[17px] leading-relaxed text-paper/80">
          In Safari, tap the Share button (the square with an arrow), then <strong className="text-paper">Add to Home Screen</strong>.
        </p>
      ) : (
        <button
          type="button"
          onClick={async () => {
            await prompt?.prompt();
            setPrompt(null);
          }}
          className="h-11 self-start rounded-full bg-paper px-5 text-[15px] font-semibold text-malam"
        >
          Install Bayu
        </button>
      )}
    </section>
  );
}
