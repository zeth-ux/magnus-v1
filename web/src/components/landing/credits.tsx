"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { CREDIT_ROWS } from "@/content/landing";

/**
 * L4 · How credits work, as a library card. A quiet section: rows arrive in
 * reading order and each stamp presses in once. Content is visible by default.
 */
export function Credits() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: "[data-card]", start: "top 80%", once: true },
          defaults: { ease: "expo.out" },
        });
        tl.from("[data-heading] > *", { y: 28, autoAlpha: 0, duration: 0.8, stagger: 0.09 }, 0)
          .from("[data-row]", { y: 24, autoAlpha: 0, duration: 0.7, stagger: 0.07 }, 0.15)
          .from(
            "[data-stamp]",
            { scale: 1.35, autoAlpha: 0, duration: 0.35, ease: "back.out(2)", stagger: 0.12 },
            0.45,
          );
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="how"
      aria-labelledby="how-heading"
      className="on-dark scroll-mt-0 bg-kayu text-bone"
    >
      <div className="mx-auto grid w-full max-w-[1312px] grid-cols-1 gap-12 px-4 py-28 sm:px-8 lg:grid-cols-12 lg:gap-6 lg:py-40">
        <div data-heading="" className="flex flex-col gap-6 lg:col-span-5">
          <h2
            id="how-heading"
            className="font-display text-[clamp(2.5rem,6vw,4rem)] leading-[1.02] font-medium tracking-[-0.02em] text-songket"
          >
            Credits keep it fair.
          </h2>
          <p className="max-w-[28rem] text-lg leading-relaxed">
            Give a book and you earn a credit. Spend it on any book on the shelf. Nobody needs a
            perfect one-for-one match.
          </p>
        </div>

        <div data-card="" className="rounded-md bg-bone text-ink lg:col-span-6 lg:col-start-7">
          <div className="flex items-center justify-between px-6 pt-6 pb-3 sm:px-7">
            <span className="font-display text-xl font-semibold">Your library card</span>
            <span className="text-sm text-muted">Bayu · Ansan</span>
          </div>
          <ul className="pb-2">
            {CREDIT_ROWS.map((row, i) => (
              <li
                key={row.what}
                data-row=""
                className={`flex items-center justify-between gap-4 px-6 py-5 sm:px-7 ${i % 2 === 0 ? "bg-bone" : "bg-bone-deep"}`}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-lg font-bold">{row.what}</span>
                  <span className="text-[15px] text-muted">{row.note}</span>
                </div>
                <span
                  className="shrink-0"
                  style={{ transform: `rotate(${row.tilt}deg)` }}
                >
                  <span
                    data-stamp=""
                    className="block rounded-[4px] border-2 border-merah px-3 py-1.5 font-display text-lg font-semibold whitespace-nowrap text-merah"
                  >
                    {row.stamp}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
