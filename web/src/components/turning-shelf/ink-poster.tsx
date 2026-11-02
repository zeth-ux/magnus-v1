"use client";

import { useId, useRef } from "react";
import type { ShelfCopy } from "@/content/shelf";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { PrintCover } from "./print-art";

/** Ink blots that grow to reveal the cover: centre (in a 474 x 900 cover) and delay (ms). */
const BLOTS: [number, number, number][] = [
  [150, 330, 0],
  [340, 600, 120],
  [250, 120, 220],
  [90, 760, 300],
  [400, 250, 360],
  [260, 860, 420],
  [230, 470, 180],
];

/**
 * A book's cover, large, revealed like ink spreading on paper: seven blots with
 * ragged (turbulence-displaced) edges grow until they merge into the cover.
 * The mask is removed once the ink has spread, so the cover never depends on
 * it (a browser that can't mask HTML with SVG just shows the cover).
 * Reduced motion: the cover is simply there.
 */
export function InkPoster({ copy, delay = 0, className = "" }: { copy: ShelfCopy; delay?: number; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/:/g, "");
  const maskId = `ink-${uid}`;
  const filterId = `inkf-${uid}`;

  useGSAP(
    () => {
      const el = root.current!;
      const poster = el.querySelector<HTMLElement>("[data-poster]")!;
      const circles = Array.from(el.querySelectorAll<SVGCircleElement>("[data-blot]"));
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // Blot positions are drawn for a 474 x 900 page; fit them to the poster's own box.
        const box = poster.getBoundingClientRect();
        const k = box.width / 474 || 1;
        const ky = box.height / 900 || k;
        el.querySelector("feDisplacementMap")?.setAttribute("scale", String(120 * k));
        poster.style.maskImage = `url(#${maskId})`;
        poster.style.webkitMaskImage = `url(#${maskId})`;
        const tl = gsap.timeline({
          delay,
          onComplete: () => {
            poster.style.maskImage = "";
            poster.style.webkitMaskImage = "";
          },
        });
        circles.forEach((c, i) => {
          c.setAttribute("cx", String(BLOTS[i][0] * k));
          c.setAttribute("cy", String(BLOTS[i][1] * ky));
          tl.fromTo(c, { attr: { r: 0 } }, { attr: { r: 720 * k }, duration: 1.25, ease: "power3.out" }, BLOTS[i][2] / 1000);
        });
        return () => {
          poster.style.maskImage = "";
          poster.style.webkitMaskImage = "";
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className={className}>
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="3" seed="7" />
            <feDisplacementMap in="SourceGraphic" scale="120" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="-400" y="-400" width="2400" height="3200">
            <g filter={`url(#${filterId})`}>
              {BLOTS.map((_, i) => (
                <circle key={i} data-blot="" r="0" fill="#fff" />
              ))}
            </g>
          </mask>
        </defs>
      </svg>
      <div data-poster="" className="relative h-full w-full">
        <PrintCover copy={copy} className="rounded-[2px]" />
      </div>
    </div>
  );
}
