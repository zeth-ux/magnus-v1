"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/lib/gsap";
import {
  ART_VIEWBOX,
  BOOK_LEFT,
  BOOK_RIGHT,
  CarvedPanel,
  FLIGHT_PATH,
  FlyingBook,
  GOLD_LINES,
  SPINE_ORIGIN,
  WIND_LINES,
} from "./motifs";

/**
 * L2-L3 · Scene 1: the wind arrives, lifts a book's pages, and carries it
 * through a carved Malay panel; the kayu (timber) world opens behind it.
 *
 * The markup below IS the finished picture (kayu, gold panel, the book flown,
 * the second line of copy). That's what people see with reduced motion or if
 * JavaScript fails. When motion is allowed, the script makes the section tall,
 * pins the stage, and scrubs a timeline from the start state to this one.
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
        const flight = section.querySelector<SVGPathElement>("[data-flight]");
        const flyer = section.querySelector<SVGGElement>("[data-flyer]");
        if (!flight || !flyer) return;
        section.classList.add("is-live");
        // The flyer's markup puts it at the end of its flight (the finished
        // picture). Reset to identity so MotionPath's alignment starts clean.
        gsap.set(flyer, { x: 0, y: 0, rotation: 0 });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.6,
          },
        });

        // 0 → 0.3: the wind draws itself across the sky; the pages lift.
        tl.fromTo(q("[data-wind]"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.3, stagger: 0.04 }, 0)
          .fromTo(
            q("[data-page]"),
            { rotation: 0 },
            { rotation: (i: number) => -14 - i * 13, svgOrigin: SPINE_ORIGIN, duration: 0.22, stagger: 0.03 },
            0.06,
          )
          .fromTo(q("[data-line1]"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.1 }, 0.08)
          // 0.2 → 0.45: the carved panel appears in the wind's path.
          .fromTo(q("[data-panel] path"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.25, stagger: 0.01 }, 0.2)
          .to(q("[data-line1]"), { autoAlpha: 0, y: -16, duration: 0.08 }, 0.36)
          // 0.25 → 0.75: a book lifts off the reader's copy and rides the wind through the panel.
          .fromTo(flyer, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04 }, 0.27)
          .to(
            flyer,
            {
              motionPath: { path: flight, align: flight, alignOrigin: [0.5, 0.5] },
              rotation: -12,
              duration: 0.5,
              ease: "power1.inOut",
              immediateRender: true,
            },
            0.27,
          )
          // 0.5 → 0.8: as the book passes through, the kayu world opens outward from the panel.
          .fromTo(
            q("[data-kayu]"),
            { clipPath: "circle(0% at 50% 50%)" },
            { clipPath: "circle(150% at 50% 50%)", duration: 0.3, ease: "power2.in" },
            0.5,
          )
          .fromTo(q("[data-panel]"), { attr: { stroke: "#7a5838" } }, { attr: { stroke: "#c9a24a" }, duration: 0.15 }, 0.55)
          // 0.65 → 0.95: songket-gold linework draws on the timber; the second line arrives.
          .fromTo(q("[data-gold]"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.25, stagger: 0.04 }, 0.65)
          .fromTo(q("[data-line2]"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.1 }, 0.82)
          .to({}, { duration: 0.05 }); // a short rest at the end before the page moves on

        // Positions depend on layout: recompute once the fonts have loaded.
        document.fonts?.ready.then(() => ScrollTrigger.refresh());

        return () => section.classList.remove("is-live");
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      aria-label="The wind carries a book through a carved panel"
      className="scene"
      style={{ "--hold": 3 } as React.CSSProperties}
    >
      <div className="scene-stage bg-sky-light text-ink">
        {/* Sky layer: wind lines and the reader's open book. */}
        <svg
          viewBox={ART_VIEWBOX}
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <g strokeWidth={2} opacity={0.55}>
            {WIND_LINES.map((d) => (
              <path key={d} d={d} data-wind="" />
            ))}
          </g>
          <g strokeWidth={2}>
            <path d={BOOK_LEFT} fill="#f1efea" />
            <path d={BOOK_RIGHT} fill="#f1efea" />
            {[0, 1, 2].map((i) => (
              <path key={i} d={BOOK_RIGHT} fill="#ffffff" data-page="" />
            ))}
          </g>
        </svg>

        {/* Kayu layer: opens outward from the panel. Finished state = fully open. */}
        <div data-kayu="" className="absolute inset-0 bg-kayu" style={{ clipPath: "circle(150% at 50% 50%)" }}>
          <svg
            viewBox={ART_VIEWBOX}
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 h-full w-full"
            fill="none"
            stroke="#c9a24a"
            strokeWidth={1.8}
            strokeLinecap="round"
            opacity={0.6}
            aria-hidden="true"
          >
            {GOLD_LINES.map((d) => (
              <path key={d} d={d} data-gold="" />
            ))}
          </svg>
        </div>

        {/* Panel and the flying book sit above both worlds. */}
        <svg
          viewBox={ART_VIEWBOX}
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d={FLIGHT_PATH} data-flight="" stroke="none" />
          <g data-panel="" stroke="#c9a24a" strokeWidth={2.4}>
            <CarvedPanel />
          </g>
          <g data-flyer="" stroke="#2b2a28" strokeWidth={2} transform="translate(980 132) rotate(-12)">
            <FlyingBook />
          </g>
        </svg>

        {/* Copy. Line 1 belongs to the sky; line 2 (the finished state) to the kayu. */}
        <div className="pointer-events-none absolute inset-x-0 top-[9vh] mx-auto w-full max-w-[1312px] px-4 sm:px-8 lg:top-auto lg:bottom-[14vh]">
          <div className="relative max-w-[26rem]">
            <p
              data-line1=""
              className="invisible absolute inset-x-0 top-0 font-display text-[clamp(1.6rem,4.4vw,2.25rem)] leading-[1.2] font-medium text-ink opacity-0"
            >
              Your finished book still has places to go.
            </p>
            <p
              data-line2=""
              className="font-display text-[clamp(1.6rem,4.4vw,2.25rem)] leading-[1.2] font-medium text-bone"
            >
              Like the bayu, a book only stops by.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
