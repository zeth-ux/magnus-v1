"use client";

/**
 * Android Chrome fires `beforeinstallprompt` once per full page load, usually
 * early and on whatever page the reader opened first. This store catches it
 * from the root layout so the Install button on /me can still use it later.
 */
export type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

let saved: InstallEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function catchInstallPrompt() {
  const onPrompt = (e: Event) => {
    e.preventDefault();
    saved = e as InstallEvent;
    notify();
  };
  const onInstalled = () => {
    saved = null;
    notify();
  };
  window.addEventListener("beforeinstallprompt", onPrompt);
  window.addEventListener("appinstalled", onInstalled);
  return () => {
    window.removeEventListener("beforeinstallprompt", onPrompt);
    window.removeEventListener("appinstalled", onInstalled);
  };
}

export function subscribeInstallPrompt(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getInstallPrompt = () => saved;

/** Use the saved prompt once (the browser allows that only once). */
export async function showInstallPrompt() {
  const e = saved;
  saved = null;
  notify();
  try {
    await e?.prompt();
  } catch {
    // Already used or dismissed: nothing to do.
  }
}
