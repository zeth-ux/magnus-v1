"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { SAMPLE_RANTAU } from "@/content/landing";

const DESKTOP_ROUTE =
  "M150 640 C 300 600, 400 460, 560 440 C 700 422, 760 300, 900 300 C 1000 300, 1060 280, 1130 250";
const DESKTOP_STOPS = [
  { x: 150, y: 640 },
  { x: 560, y: 440 },
  { x: 1130, y: 250 },
];
const PHONE_ROUTE = "M78 372 C 170 350, 320 310, 272 222 C 224 140, 50 150, 100 70";
const PHONE_STOPS = [
  { x: 78, y: 372 },
  { x: 272, y: 222 },
  { x: 100, y: 70 },
];

function Route({ d, stops, r }: { d: string; stops: { x: number; y: number }[]; r: number }) {
  return (
    <>
      <path d={d} data-route="" stroke="#c9a24a" strokeWidth={2.4} strokeLinecap="round" fill="none" />
      {stops.map((s, i) => {
        const stop = SAMPLE_RANTAU.stops[i];
        return (
          <g key={stop.city} data-stamp="">
            <circle cx={s.x} cy={s.y} r={r} fill="#6e1f1f" stroke="#c9a24a" strokeWidth={2} />
            <text
              x={s.x}
              y={s.y - 2}
              textAnchor="middle"
              fill="#c9a24a"
              fontSize={r * 0.3}
              fontWeight={700}
              letterSpacing={1}
              style={{ fontFamily: "var(--font-text)" }}
            >
              {stop.city.toUpperCase()}
            </text>
            <text
              x={s.x}
              y={s.y + r * 0.42}
              textAnchor="middle"
              fill="#c9a24a"
              fontSize={r * 0.26}
              style={{ fontFamily: "var(--font-text)" }}
            >
              {stop.date}
            </text>
          </g>
        );
      })}
    </>
  );
}

/**
 * L6 · Scene 2: one copy's rantau (its journey away from home). The route
 * draws itself, a passport stamp presses in at each stop, and a warkah (the
 * last reader's note) unfolds. Finished picture by default; scrubbed when
 * motion is allowed. Desktop and phone have their own drawings.
 */
export function RantauScene() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      const mm = gsap.matchMedia();

      mm.add(
        {
          desktop: `(min-width: 1024px) and ${MOTION_OK}`,
          phone: `(max-width: 1023.98px) and ${MOTION_OK}`,
        },
        (ctx) => {
          section.classList.add("is-live");
          const variant = ctx.conditions?.desktop ? "[data-art=desktop]" : "[data-art=phone]";
          const q = gsap.utils.selector(section);

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: 0.6 },
          });

          tl.fromTo(q(`${variant} [data-route]`), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.72 }, 0.04);
          q(`${variant} [data-stamp]`).forEach((stamp, i) => {
            tl.fromTo(
              stamp,
              { scale: 1.4, autoAlpha: 0, transformOrigin: "50% 50%" },
              { scale: 1, autoAlpha: 1, duration: 0.08, ease: "back.out(2)" },
              [0, 0.36, 0.72][i] ?? 0,
            );
          });
          tl.fromTo(
            q("[data-warkah]"),
            { rotationX: -80, autoAlpha: 0, transformOrigin: "50% 0%", transformPerspective: 900 },
            { rotationX: 0, autoAlpha: 1, duration: 0.16, ease: "power2.out" },
            0.8,
          ).to({}, { duration: 0.06 });

          return () => section.classList.remove("is-live");
        },
      );
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      aria-labelledby="rantau-heading"
      className="scene on-dark"
      style={{ "--hold": 2 } as React.CSSProperties}
    >
      <div className="scene-stage flex flex-col bg-merah text-bone">
        <svg
          data-art="desktop"
          viewBox="0 0 1280 800"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 hidden h-full w-full lg:block"
          role="img"
          aria-label="One copy's journey: Ansan, then Seoul, then Kuala Lumpur"
        >
          <Route d={DESKTOP_ROUTE} stops={DESKTOP_STOPS} r={46} />
        </svg>

        <div className="relative mx-auto w-full max-w-[1312px] px-4 pt-20 sm:px-8 lg:pt-[12vh]">
          <div className="flex max-w-[32rem] flex-col gap-4">
            <h2
              id="rantau-heading"
              className="font-display text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.04] font-medium tracking-[-0.02em]"
            >
              Every copy has a rantau.
            </h2>
            <p className="text-lg leading-relaxed">
              Rantau is the journey away from home. After the pilot, each copy will show where it
              has travelled and the notes its readers left.
            </p>
          </div>
        </div>

        <svg
          data-art="phone"
          viewBox="10 14 340 420"
          className="mx-auto my-4 block min-h-0 w-full max-w-[420px] flex-1 lg:hidden"
          role="img"
          aria-label="One copy's journey: Ansan, then Seoul, then Kuala Lumpur"
        >
          <Route d={PHONE_ROUTE} stops={PHONE_STOPS} r={50} />
        </svg>

        <figure
          data-warkah=""
          className="relative mx-4 mb-10 flex max-w-[22rem] -rotate-2 flex-col gap-2.5 self-center rounded-[4px] bg-bone px-6 py-5 text-ink sm:mx-8 lg:absolute lg:right-[8vw] lg:bottom-[12vh] lg:mx-0 lg:mb-0"
        >
          <figcaption className="text-[13px] font-bold text-merah">Warkah from the last reader</figcaption>
          <blockquote className="font-display text-xl leading-snug italic">
            &ldquo;{SAMPLE_RANTAU.warkah}&rdquo;
          </blockquote>
          <span className="text-sm text-muted">{SAMPLE_RANTAU.from} · sample note</span>
        </figure>
      </div>
    </section>
  );
}
