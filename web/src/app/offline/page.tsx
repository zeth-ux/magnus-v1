import type { Metadata, Viewport } from "next";
import { BayuMark } from "@/components/bayu-mark";

export const metadata: Metadata = { title: "You're offline" };
export const viewport: Viewport = { themeColor: "#1c1614", colorScheme: "dark" };

/** Shown by the service worker (public/sw.js) when a page can't load without the internet. */
export default function OfflinePage() {
  return (
    <main className="page-malam flex min-h-svh flex-col items-start justify-center gap-6 bg-malam px-6 text-paper sm:px-16">
      <BayuMark className="h-12 w-12" />
      <h1 className="font-display text-[clamp(2.2rem,5vw,3.4rem)] leading-[1.04] font-medium tracking-[-0.02em]">The wind has dropped.</h1>
      <p className="max-w-[30rem] text-[17px] leading-relaxed text-paper/80">
        You&apos;re offline, and the shelf needs the internet. Check your connection, then try again.
      </p>
      {/* A plain link on purpose: a full reload is what we want once the connection is back. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/browse" className="rounded-full bg-paper px-6 py-3 text-[17px] font-semibold text-malam no-underline">
        Try again
      </a>
    </main>
  );
}
