"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { GOLD_LINES } from "./motifs";

/** L8 · The close: the name returns at full width in songket gold on kayu. */
export function Closing() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          "[data-wordmark]",
          { scale: 0.9, transformOrigin: "0% 100%" },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom bottom", scrub: true },
          },
        );
      });
    },
    { scope: root },
  );

  return (
    <footer ref={root} className="on-dark relative overflow-hidden bg-kayu text-bone">
      <svg
        viewBox="0 120 1280 140"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-x-0 top-4 h-24 w-full opacity-50"
        fill="none"
        stroke="#c9a24a"
        strokeWidth={1.6}
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d={GOLD_LINES[0]} transform="translate(-860 0)" />
        <path d={GOLD_LINES[0]} transform="translate(-420 0)" />
        <path d={GOLD_LINES[0]} />
      </svg>

      <div className="mx-auto flex w-full max-w-[1312px] flex-col gap-16 px-4 pt-36 pb-10 sm:px-8 lg:pt-44">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <p className="max-w-[32rem] font-display text-[clamp(1.6rem,4vw,2.25rem)] leading-[1.2] font-medium">
            Jom, list your first book. The breeze does the rest.
          </p>
          <Link
            href="/login"
            className="rounded-full bg-songket px-8 py-5 text-lg font-bold text-kayu no-underline transition-[background-color,transform] duration-200 hover:bg-bone active:scale-[0.98]"
          >
            Join the Ansan pilot
          </Link>
        </div>

        <p
          data-wordmark=""
          aria-hidden="true"
          className="-ml-[0.04em] font-display text-[clamp(7rem,27vw,23rem)] leading-[0.8] font-semibold tracking-[-0.04em] text-songket"
        >
          Bayu
        </p>

        <div className="flex flex-col justify-between gap-4 text-sm text-kayu-muted sm:flex-row sm:items-center">
          <span>A breeze between readers, made in Ansan.</span>
          <nav aria-label="Footer" className="flex gap-6">
            <a href="#how" className="text-kayu-muted hover:text-songket">How it works</a>
            <a href="#safety" className="text-kayu-muted hover:text-songket">Safety</a>
            <a href="#faq" className="text-kayu-muted hover:text-songket">FAQ</a>
            <Link href="/login" className="text-kayu-muted hover:text-songket">Join</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
