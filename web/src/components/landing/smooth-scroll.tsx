"use client";

import Lenis from "lenis";
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/lib/gsap";

/** The live Lenis instance (null on touch or reduced motion), so a dialog can pause it. */
export const smooth: { lenis: Lenis | null } = { lenis: null };

/**
 * Weighted, smooth wheel scrolling (Lenis), kept in sync with ScrollTrigger.
 * Only for a fine pointer (mouse/trackpad) and when motion is OK; native touch
 * scrolling is better. gsap.matchMedia() tears it down if either setting
 * changes while the page is open. Native scroll stays the truth: no
 * scroll-jacking, the scrollbar and keyboard work as usual. Also re-measures
 * every scroll trigger once the web fonts have loaded (text heights change).
 */
export function SmoothScroll() {
  useGSAP(() => {
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    const mm = gsap.matchMedia();
    mm.add(`${MOTION_OK} and (pointer: fine)`, () => {
      const lenis = new Lenis({ lerp: 0.12, smoothWheel: true });
      smooth.lenis = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      return () => {
        gsap.ticker.remove(tick);
        gsap.ticker.lagSmoothing(500, 33); // GSAP's default
        lenis.destroy();
        smooth.lenis = null;
      };
    });
  });

  return null;
}
