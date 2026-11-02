"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

/**
 * Lines that rise out of their own masks, one after another, when the page
 * arrives. Wrap each line as <span className="mask"><span data-rise>…</span></span>
 * inside <Rise>. Reduced motion (or no JavaScript): the text is simply there.
 */
export function Rise({ children, delay = 0, className = "", as: Tag = "div" }: { children: React.ReactNode; delay?: number; className?: string; as?: "div" | "section" | "header" }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from("[data-rise]", { yPercent: 110, duration: 0.9, ease: "paper", stagger: 0.075, delay });
      });
      return () => mm.revert();
    },
    { scope: root },
  );
  return (
    <Tag ref={root} className={className}>
      {children}
    </Tag>
  );
}
