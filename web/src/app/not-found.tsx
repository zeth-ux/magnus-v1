import type { Metadata } from "next";
import Link from "next/link";
import { BayuMark } from "@/components/bayu-mark";

export const metadata: Metadata = { title: "Page not found" };

/** Shown for any address that doesn't exist. */
export default function NotFound() {
  return (
    <main className="page-malam on-dark flex min-h-svh flex-col items-start justify-center gap-6 bg-malam px-6 text-paper sm:px-16">
      <BayuMark className="h-12 w-12" />
      <p className="text-[15px] font-semibold tracking-[0.12em] text-songket uppercase">404</p>
      <h1 className="font-display text-[clamp(2.2rem,5vw,3.4rem)] leading-[1.04] font-medium tracking-[-0.02em]">This page blew away.</h1>
      <p className="max-w-[30rem] text-[17px] leading-relaxed text-paper/80">
        The link may be old, or the book may have found a new home. Try the shelf instead.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/browse" className="rounded-full bg-paper px-6 py-3 text-[17px] font-semibold text-malam no-underline">
          Browse the shelf
        </Link>
        <Link href="/" className="rounded-full border-[1.5px] border-paper/60 px-6 py-3 text-[17px] font-semibold text-paper no-underline">
          Home
        </Link>
      </div>
    </main>
  );
}
