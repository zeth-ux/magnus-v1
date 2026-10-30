"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { SAMPLE_RANTAU } from "@/content/landing";

/**
 * Scene 2 · One copy's rantau (its journey away from home).
 * While the stage holds, scrolling down carries you sideways through three
 * postcards (Ansan → Seoul → KL). A gold route draws along the way, a passport
 * stamp slams down at each city, and the last reader's warkah unfolds.
 *
 * Finished picture (reduced motion / no JS): the three postcards stacked.
 */
export function RantauScene() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        const q = gsap.utils.selector(section);
        const track = q("[data-track]")[0] as HTMLElement | undefined;
        if (!track) return;
        section.classList.add("is-live");

        const travel = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
        travel
          .to(track, { x: () => -(track.scrollWidth - window.innerWidth), duration: 1 }, 0)
          .fromTo(q("[data-route]"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 1 }, 0);

        // Things that happen as each postcard reaches the middle of the screen.
        q("[data-card]").forEach((card) => {
          const stamp = card.querySelector("[data-pass-stamp]");
          const arch = card.querySelector("[data-card-arch]");
          if (arch) {
            gsap.fromTo(arch, { clipPath: "inset(100% 0% 0% 0% round 999px 999px 0 0)" }, {
              clipPath: "inset(0% 0% 0% 0% round 999px 999px 0 0)",
              duration: 0.9,
              ease: "expo.out",
              scrollTrigger: { trigger: card, containerAnimation: travel, start: "left 70%", toggleActions: "play none none reverse" },
            });
          }
          if (stamp) {
            gsap.fromTo(
              stamp,
              { scale: 2.8, rotation: -25, autoAlpha: 0 },
              {
                scale: 1,
                rotation: -8,
                autoAlpha: 1,
                duration: 0.35,
                ease: "power4.in",
                scrollTrigger: { trigger: card, containerAnimation: travel, start: "left 45%", toggleActions: "play none none reverse" },
              },
            );
          }
        });

        gsap.fromTo(
          q("[data-warkah]"),
          { rotationX: -95, autoAlpha: 0, transformOrigin: "50% 0%", transformPerspective: 900 },
          {
            rotationX: 0,
            autoAlpha: 1,
            duration: 0.8,
            ease: "back.out(1.4)",
            scrollTrigger: { trigger: q("[data-card]").at(-1), containerAnimation: travel, start: "left 25%", toggleActions: "play none none reverse" },
          },
        );

        document.fonts?.ready.then(() => ScrollTrigger.refresh());
        return () => section.classList.remove("is-live");
      });
    },
    { scope: root },
  );

  const stops = SAMPLE_RANTAU.stops;

  return (
    <section
      ref={root}
      aria-labelledby="rantau-heading"
      className="scene group on-dark bg-merah text-bone"
      style={{ "--hold": 2.5 } as React.CSSProperties}
    >
      <div className="scene-stage stack-when-static">
        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 pt-20 sm:px-8 group-[.is-live]:absolute group-[.is-live]:inset-x-0 group-[.is-live]:top-0 group-[.is-live]:pt-[7vh]">
          <h2
            id="rantau-heading"
            className="max-w-[16ch] font-display text-[clamp(2.25rem,4.4vw,4rem)] leading-[1.02] font-medium tracking-[-0.02em]"
          >
            Every copy has a rantau.
          </h2>
          <p className="mt-3 max-w-[34rem] text-[17px] leading-relaxed">
            Rantau is the journey away from home. After the pilot, each copy will show where it has
            travelled and the notes its readers left. A sample journey of “{SAMPLE_RANTAU.book}”:
          </p>
        </div>

        <div
          data-track=""
          className="relative flex flex-col group-[.is-live]:h-full group-[.is-live]:w-max group-[.is-live]:flex-row"
        >
          {/* The route, drawn along the whole track while you travel. */}
          <svg
            viewBox="0 0 3000 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute top-[58%] left-0 hidden h-[80px] w-full group-[.is-live]:block"
            fill="none"
            aria-hidden="true"
          >
            <path
              data-route=""
              d="M0 50 C 300 0, 600 100, 1000 50 S 1700 0, 2000 50 S 2700 100, 3000 40"
              stroke="#c9a24a"
              strokeWidth={3}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {stops.map((stop, i) => {
            const last = i === stops.length - 1;
            return (
              <article
                key={stop.city}
                data-card=""
                aria-label={`${stop.city}, ${stop.date}`}
                className="relative flex min-h-[86svh] w-full shrink-0 items-end px-6 pt-10 pb-16 sm:px-8 group-[.is-live]:h-full group-[.is-live]:min-h-0 group-[.is-live]:w-screen md:items-end md:pb-[6vh]"
              >
                <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 items-end gap-8 md:grid-cols-12 md:items-center">
                  <p className="order-2 max-w-[24ch] text-xl leading-snug font-semibold md:order-1 md:col-span-4 md:mb-[8vh]">
                    {stop.line}
                  </p>
                  <div className="relative order-1 md:order-2 md:col-span-5 md:col-start-7">
                    <div
                      data-card-arch=""
                      className={`arch flex h-[min(46svh,520px)] w-full flex-col items-center justify-center gap-2 md:h-[min(54svh,560px)] ${last ? "max-md:justify-start max-md:pt-[18%]" : ""}`}
                      style={{ background: stop.field, color: stop.ink }}
                    >
                      <span className="font-display text-[clamp(4rem,9vw,8.5rem)] leading-none font-semibold tracking-[-0.03em]">
                        {stop.city}
                      </span>
                      <span className="text-[17px] font-semibold">{stop.date}</span>
                    </div>
                    <span
                      data-pass-stamp=""
                      aria-hidden="true"
                      className="absolute -top-6 -left-4 flex h-28 w-28 flex-col items-center justify-center rounded-full border-[3px] border-songket bg-merah text-center text-songket md:-left-10 md:h-36 md:w-36"
                      style={{ transform: "rotate(-8deg)" }}
                    >
                      <span className="text-[15px] font-bold">Bayu</span>
                      <span className="font-display text-xl font-semibold md:text-2xl">{stop.city}</span>
                      <span className="text-[13px] font-semibold">{stop.date}</span>
                    </span>
                    {last ? (
                      <figure
                        data-warkah=""
                        className="absolute bottom-[8%] -left-2 flex w-[min(78vw,22rem)] md:-bottom-6 md:-left-24 -rotate-3 flex-col gap-2.5 rounded-[4px] bg-bone px-6 py-5 text-ink"
                      >
                        <figcaption className="text-[15px] font-bold text-merah">Warkah from the last reader</figcaption>
                        <blockquote className="font-display text-xl leading-snug italic">
                          &ldquo;{SAMPLE_RANTAU.warkah}&rdquo;
                        </blockquote>
                        <span className="text-[15px] text-muted">{SAMPLE_RANTAU.from} · sample note</span>
                      </figure>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
