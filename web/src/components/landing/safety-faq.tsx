"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { FAQ, SAFETY_POINTS } from "@/content/landing";

// Index cards in the light tints of the shelf books (dark text on each).
const CARD_COLOURS = ["#d8dcf2", "#f1d9b5", "#c9d8c3", "#f4d3df", "#cfe9e4"];

/**
 * Safety, then the FAQ filed like index cards in a drawer: each card's tab is
 * an arch (the motif), tabs step right, cards overlap. Native <details> with a
 * shared name: one card open at a time, and it all works without JavaScript.
 */
export function SafetyFaq() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from("[data-safe]", {
          x: -40,
          autoAlpha: 0,
          duration: 0.9,
          ease: "expo.out",
          stagger: 0.12,
          scrollTrigger: { trigger: "[data-safe-list]", start: "top 92%", once: true },
        });
        // The cards drop into the drawer one after another.
        gsap.from("[data-card-faq]", {
          y: -80,
          autoAlpha: 0,
          rotation: () => gsap.utils.random(-4, 4),
          duration: 0.8,
          ease: "back.out(1.6)",
          stagger: 0.09,
          scrollTrigger: { trigger: "[data-drawer]", start: "top 92%", once: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-label="Safety and questions" className="bg-malam text-paper">
      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-20 px-4 py-28 sm:px-8 lg:grid-cols-12 lg:gap-6 lg:py-40">
        <div className="flex flex-col gap-8 lg:col-span-4">
          <h2
            id="safety"
            className="scroll-mt-8 font-display text-[clamp(2.5rem,4.4vw,4rem)] leading-[1.02] font-medium tracking-[-0.02em]"
          >
            Safe by design
          </h2>
          <ul data-safe-list="" className="flex flex-col gap-6">
            {SAFETY_POINTS.map((point) => (
              <li key={point} data-safe="" className="flex gap-4 text-xl leading-snug font-semibold">
                <span aria-hidden="true" className="arch mt-1.5 inline-block h-[0.8em] w-[0.55em] shrink-0 bg-songket" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col lg:col-span-7 lg:col-start-6">
          <h2 id="faq" className="mb-10 scroll-mt-8 font-display text-[clamp(2.5rem,4.4vw,4rem)] leading-[1.02] font-medium tracking-[-0.02em]">
            Questions
          </h2>
          <div data-drawer="" className="flex flex-col">
            {FAQ.map((item, i) => {
              const bg = CARD_COLOURS[i % CARD_COLOURS.length];
              return (
                <div
                  key={item.q}
                  data-card-faq=""
                  className="relative pt-10"
                  style={{ marginTop: i === 0 ? 0 : "-28px", zIndex: i }}
                >
                  {/* The tab: an arch, stepping right card by card. */}
                  <span
                    aria-hidden="true"
                    className="arch absolute top-0 flex h-10 text-ink w-[7.5rem] items-center justify-center text-[15px] font-bold sm:w-[12rem]"
                    style={{ background: bg, left: `min(${i * 18}%, calc(100% - 12rem))` }}
                  >
                    {item.tab}
                  </span>
                  <details
                    name="faq"
                    open={i === 0}
                    className="faq-card group rounded-[6px] rounded-tl-none text-ink"
                    style={{ background: bg }}
                  >
                    <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left text-xl font-semibold [&::-webkit-details-marker]:hidden">
                      {item.q}
                      <span
                        aria-hidden="true"
                        className="arch inline-block h-4 w-3 shrink-0 bg-ink transition-transform duration-300 group-open:rotate-180"
                      />
                    </summary>
                    <p className="max-w-[50ch] px-6 pb-12 text-[17px] leading-relaxed">{item.a}</p>
                  </details>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
