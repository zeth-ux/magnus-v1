"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

/** The name, built large: each letter knocked out of an arch-topped block. */
const BLOCKS = [
  { letter: "B", bg: "#3b2618", ink: "#eeeeea", height: "100%" },
  { letter: "a", bg: "#6e1f1f", ink: "#eeeeea", height: "78%" },
  { letter: "y", bg: "#2f7a4d", ink: "#eeeeea", height: "90%" },
  { letter: "u", bg: "#c9a24a", ink: "#3b2618", height: "70%" },
];

export function Closing() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // The blocks rise into place, one after another, as the page ends.
        gsap.fromTo(
          "[data-block]",
          { yPercent: 45 },
          {
            yPercent: 0,
            ease: "power2.out",
            stagger: 0.12,
            scrollTrigger: { trigger: "[data-blocks]", start: "top bottom", end: "bottom 85%", scrub: 0.6 },
          },
        );
      });
    },
    { scope: root },
  );

  return (
    <footer ref={root} className="bg-bone text-ink">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-14 px-4 pt-14 pb-10 sm:px-8">
        <div
          data-blocks=""
          aria-label="Bayu"
          role="img"
          className="flex h-[26svh] items-end gap-1 overflow-hidden md:h-[34svh]"
        >
          {BLOCKS.map((b) => (
            <div
              key={b.letter}
              data-block=""
              className="arch flex flex-1 items-end justify-center pb-[6svh]"
              style={{ background: b.bg, color: b.ink, height: b.height }}
            >
              <span className="font-display text-[clamp(4rem,14vw,13rem)] leading-[0.8] font-semibold">
                {b.letter}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-8 text-[15px] md:grid-cols-12">
          <nav aria-label="Footer" className="col-span-2 flex flex-wrap gap-x-8 gap-y-3 md:col-span-8">
            <a href="#how" className="text-ink hover:text-pandan">How it works</a>
            <a href="#safety" className="text-ink hover:text-pandan">Safety</a>
            <a href="#faq" className="text-ink hover:text-pandan">FAQ</a>
            <Link href="/login" className="text-ink hover:text-pandan">Sign in</Link>
          </nav>
          <p className="col-span-2 text-muted md:col-span-4 md:text-right">
            A breeze between readers, made in Ansan.
          </p>
        </div>
        <div className="flex items-center justify-between text-[15px] text-muted">
          <span>© 2026 Bayu</span>
          <Link
            href="/login"
            className="btn-arch bg-ink px-5 pt-3 pb-2.5 font-semibold text-bone no-underline transition-colors duration-200 hover:bg-kayu"
          >
            Join the pilot
          </Link>
        </div>
      </div>
    </footer>
  );
}
