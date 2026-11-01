"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { BayuMark } from "@/components/bayu-mark";

/**
 * When a page fails to load (for example the database is briefly unreachable).
 * "Try again" uses retry(), which fetches the page again (reset() would only
 * replay the same failure). The error goes to the logs, never the screen.
 */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const digest = error instanceof Error && "digest" in error ? String((error as { digest?: unknown }).digest) : undefined;
    console.error("[page error]", digest ?? (error instanceof Error ? error.name : "unknown"));
    // Screen-reader users hear that the page changed.
    heading.current?.focus();
  }, [error]);
  return (
    <main className="page-malam on-dark flex min-h-svh flex-col items-start justify-center gap-6 bg-malam px-6 text-paper sm:px-16">
      <BayuMark className="h-12 w-12" />
      <h1 ref={heading} tabIndex={-1} className="font-display text-[clamp(2.2rem,5vw,3.4rem)] leading-[1.04] font-medium tracking-[-0.02em] outline-none">
        A gust knocked this over.
      </h1>
      <p className="max-w-[30rem] text-[17px] leading-relaxed text-paper/80">
        Something went wrong loading this page. Nothing you did is lost. Try again in a moment.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => retry()} className="rounded-full bg-paper px-6 py-3 text-[17px] font-semibold text-malam">
          Try again
        </button>
        <Link href="/" className="rounded-full border-[1.5px] border-paper/60 px-6 py-3 text-[17px] font-semibold text-paper no-underline">
          Home
        </Link>
      </div>
    </main>
  );
}
