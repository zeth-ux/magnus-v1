import type { Metadata } from "next";
import Link from "next/link";
import { BayuMark } from "@/components/bayu-mark";

export const metadata: Metadata = { title: "Page not found" };

/** Shown for any address that doesn't exist. */
export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-start justify-center gap-6 bg-paper px-6 text-ink sm:px-16">
      <BayuMark className="h-12 w-12" />
      <p className="text-[15px] font-semibold tracking-[0.12em] text-cobalt uppercase">404</p>
      <h1 className="page-title">This page blew away.</h1>
      <p className="max-w-[30rem] text-[17px] leading-relaxed text-ink/80">
        The link may be old, or the book may have found a new home. Try the shelf instead.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/browse" className="btn-primary">
          Browse the shelf
        </Link>
        <Link href="/" className="btn-quiet">
          Home
        </Link>
      </div>
    </main>
  );
}
