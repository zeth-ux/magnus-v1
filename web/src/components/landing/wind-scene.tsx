"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { ART_VIEWBOX, CarvedPanel, GOLD_LINES, WIND_LINES } from "./motifs";

/** Loose pages caught by the wind: each rides one of the wind lines. */
const PAGE_COUNT = 18;

/**
 * L2-L3 · Scene 1 "Through the arch" (the signature moment).
 *
 * The stage holds for ~3 screens while you scroll:
 *   1. The arch (the motif) opens from a window into the whole screen.
 *   2. A storm of loose pages lifts off and rides the awan larat wind lines.
 *   3. The carved panel draws itself in songket gold, then the camera flies
 *      straight through it into the kayu world.
 *
 * The markup is the finished picture (full kayu, gold panel, the line of copy),
 * shown as-is for reduced motion or if JavaScript fails.
 */
export function WindScene() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        const q = gsap.utils.selector(section);
        const winds = Array.from(section.querySelectorAll<SVGPathElement>("[data-wind-path]"));
        if (winds.length === 0) return;
        section.classList.add("is-live");

        // The arch window, measured from the live stage size.
        const archClip = () => {
          const w = window.innerWidth;
          const h = window.innerHeight;
          const archW = Math.min(w * (w < 768 ? 0.78 : 0.34), 560);
          const side = (w - archW) / 2;
          const top = h * (w < 768 ? 0.36 : 0.26);
          return `inset(${top}px ${side}px 0px ${side}px round ${archW / 2}px ${archW / 2}px 0px 0px)`;
        };

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });

        // 1. The window opens into the whole screen.
        tl.fromTo(
          q("[data-kayu]"),
          { clipPath: archClip },
          { clipPath: "inset(0px 0px 0px 0px round 0px 0px 0px 0px)", duration: 0.32, ease: "power2.inOut" },
          0,
        )
          .fromTo(q("[data-sky-line]"), { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -40, duration: 0.08 }, 0.07)
          .fromTo(q("[data-wind]"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.3, stagger: 0.03 }, 0.02);

        // 2. The storm of pages: each rides a wind line, spinning as it goes.
        q("[data-loose-page]").forEach((page, i) => {
          const path = winds[i % winds.length];
          const begin = 0.06 + (i / PAGE_COUNT) * 0.5;
          tl.fromTo(page, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, begin).to(
            page,
            {
              motionPath: {
                path,
                align: path,
                alignOrigin: [0.5, 0.5],
                start: (i * 0.13) % 0.3,
                end: 1,
              },
              rotation: gsap.utils.random(-540, 540),
              scale: gsap.utils.random(0.6, 1.25),
              duration: 0.38,
              ease: "power1.in",
              immediateRender: false,
            },
            begin,
          );
          tl.to(page, { autoAlpha: 0, duration: 0.04 }, begin + 0.34);
        });

        // 3. The carved panel draws itself in gold...
        tl.fromTo(q("[data-panel] path"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.26, stagger: 0.008 }, 0.22)
          // ...then the camera flies through it.
          .fromTo(
            q("[data-panel]"),
            { scale: 1, autoAlpha: 1, transformOrigin: "50% 50%" },
            { scale: 9, autoAlpha: 0, duration: 0.24, ease: "power2.in" },
            0.56,
          )
          .fromTo(q("[data-gold]"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.24, stagger: 0.05 }, 0.66)
          .fromTo(q("[data-kayu-line]"), { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.12 }, 0.8)
          .to({}, { duration: 0.06 });

        document.fonts?.ready.then(() => ScrollTrigger.refresh());
        return () => section.classList.remove("is-live");
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      aria-label="The wind carries the pages through a carved panel"
      className="scene"
      style={{ "--hold": 3 } as React.CSSProperties}
    >
      <div className="scene-stage bg-sky-light text-ink">
        {/* Sky: the line of copy before the window opens. */}
        <div className="absolute inset-x-0 top-[8vh] z-10 mx-auto w-full max-w-[1400px] px-4 sm:px-8">
          <p
            data-sky-line=""
            className="invisible max-w-[22ch] font-display text-[clamp(1.75rem,3.4vw,2.75rem)] leading-[1.12] font-medium opacity-0"
          >
            Your finished book still has places to go.
          </p>
        </div>

        {/* The kayu world, revealed through the arch. Finished state: fully open. */}
        <div data-kayu="" className="absolute inset-0 bg-kayu">
          <svg
            viewBox={ART_VIEWBOX}
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 h-full w-full"
            fill="none"
            stroke="#c9a24a"
            strokeWidth={2}
            strokeLinecap="round"
            opacity={0.7}
            aria-hidden="true"
          >
            {GOLD_LINES.map((d) => (
              <path key={d} d={d} data-gold="" />
            ))}
          </svg>
          <svg
            viewBox={ART_VIEWBOX}
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 h-full w-full"
            fill="none"
            stroke="#c9a24a"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <g data-panel="" opacity={0.18}>
              <CarvedPanel />
            </g>
          </svg>
          <div className="absolute inset-x-0 bottom-[12vh] mx-auto w-full max-w-[1400px] px-4 sm:px-8">
            <p
              data-kayu-line=""
              className="max-w-[18ch] font-display text-[clamp(2.25rem,5.6vw,5rem)] leading-[1.02] font-medium tracking-[-0.02em] text-songket"
            >
              Like the bayu, a book only stops by.
            </p>
          </div>
        </div>

        {/* The wind lines (drawn over everything) and the loose pages riding them. */}
        <svg
          viewBox={ART_VIEWBOX}
          preserveAspectRatio="xMidYMid slice"
          className="pointer-events-none absolute inset-0 h-full w-full"
          fill="none"
          stroke="#c9a24a"
          strokeWidth={1.6}
          strokeLinecap="round"
          opacity={0.55}
          aria-hidden="true"
        >
          {WIND_LINES.map((d) => (
            <path key={d} d={d} data-wind="" data-wind-path="" />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {Array.from({ length: PAGE_COUNT }, (_, i) => (
            <span
              key={i}
              data-loose-page=""
              className="invisible absolute top-1/2 left-1/2 block h-[44px] w-[34px] rounded-[2px] bg-[#fbfaf6] opacity-0 md:h-[64px] md:w-[48px]"
            >
              <span className="absolute top-[22%] left-[16%] block h-[2px] w-[64%] bg-ink/25" />
              <span className="absolute top-[40%] left-[16%] block h-[2px] w-[56%] bg-ink/25" />
              <span className="absolute top-[58%] left-[16%] block h-[2px] w-[62%] bg-ink/25" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
