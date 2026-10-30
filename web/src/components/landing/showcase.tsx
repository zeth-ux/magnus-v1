"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { SAMPLE_SHELF } from "@/content/landing";

/**
 * "On the shelf in Ansan": the live thing. A tall arch (the motif) in one
 * palette colour, with the chosen book's cover standing in front of it and
 * breaking its outline at the top. Choose a title: the cover swaps and the
 * arch changes colour. SAMPLE books until the pilot shelf opens.
 */
export function Showcase() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const book = SAMPLE_SHELF[active];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: "top 70%", once: true },
          defaults: { ease: "expo.out" },
        });
        tl.fromTo(
          "[data-show-arch]",
          { clipPath: "inset(100% 0% 0% 0% round 999px 999px 0 0)" },
          { clipPath: "inset(0% 0% 0% 0% round 999px 999px 0 0)", duration: 1.3 },
        )
          // The cover drops in on its own element; the sway below owns the wrapper's rotation.
          .from("[data-show-drop]", { yPercent: -40, rotation: -14, autoAlpha: 0, duration: 1.1 }, 0.35)
          .from("[data-show-item]", { y: 30, autoAlpha: 0, duration: 0.7, stagger: 0.06 }, 0.2);

        // While the section passes, the cover sways gently in the breeze.
        gsap.fromTo(
          "[data-show-cover]",
          { rotation: -3 },
          {
            rotation: 3,
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 1 },
          },
        );
      });
      return () => {
        const face = root.current?.querySelector("[data-show-face]");
        if (face) gsap.killTweensOf(face);
      };
    },
    { scope: root },
  );

  function choose(i: number) {
    if (i === active) return;
    setActive(i);
    if (!window.matchMedia(MOTION_OK).matches) return;
    gsap.fromTo(
      root.current?.querySelector("[data-show-face]") ?? null,
      { rotationY: -90, autoAlpha: 0.4 },
      { rotationY: 0, autoAlpha: 1, duration: 0.55, ease: "expo.out", overwrite: "auto" },
    );
  }

  return (
    <section ref={root} aria-labelledby="shelf-heading" className="overflow-hidden bg-bone text-ink">
      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-12 px-4 py-24 sm:px-8 lg:min-h-svh lg:grid-cols-12 lg:items-end lg:gap-6 lg:py-32">
        {/* The stage: arch + cover. Comes first on a phone. */}
        <div className="relative flex justify-center lg:order-2 lg:col-span-6 lg:col-start-7 lg:justify-start">
          <div
            data-show-arch=""
            aria-hidden="true"
            className="arch h-[min(64vh,560px)] w-[min(86vw,440px)] transition-colors duration-500"
            style={{ background: book.stage }}
          />
          <div
            data-show-cover=""
            className="absolute top-[-6%] left-1/2 w-[min(52vw,270px)] -translate-x-1/2 [perspective:1000px] lg:left-[min(220px,25vw)]"
          >
            <div data-show-drop="">
            <div
              data-show-face=""
              className="flex aspect-[2/3] flex-col justify-between rounded-[4px] p-6 transition-colors duration-300"
              style={{ background: book.cover, color: book.coverInk }}
            >
              <span className="font-display text-[clamp(1.6rem,2.6vw,2.4rem)] leading-[1.05] font-semibold">
                {book.title}
              </span>
              <span className="text-[15px] tracking-[0.02em]">{book.author}</span>
            </div>
            </div>
          </div>
          <p aria-live="polite" className="absolute bottom-6 hidden max-w-[13rem] text-[17px] leading-snug lg:left-[calc(min(86vw,440px)+32px)] lg:block">
            <strong>{book.mode === "give" ? "Give" : `Lend · ${book.lendFor}`}</strong>
            <br />
            {book.owner}
            {book.note ? (
              <>
                <br />
                <span className="text-muted">&ldquo;{book.note}&rdquo;</span>
              </>
            ) : null}
          </p>
        </div>

        {/* The list: heading as its first line, then the titles. */}
        <div className="flex flex-col lg:order-1 lg:col-span-6">
          <h2
            id="shelf-heading"
            data-show-item=""
            className="font-display text-[clamp(1.75rem,2.9vw,2.75rem)] leading-[1.15] font-medium text-muted"
          >
            On the shelf in Ansan
          </h2>
          <ul className="flex flex-col">
            {SAMPLE_SHELF.map((b, i) => (
              <li key={b.title} data-show-item="">
                <button
                  type="button"
                  aria-current={active === i ? "true" : undefined}
                  onClick={() => choose(i)}
                  onMouseEnter={() => choose(i)}
                  onFocus={() => choose(i)}
                  className={`flex items-center gap-4 py-1 text-left font-display text-[clamp(1.75rem,2.9vw,2.75rem)] leading-[1.15] font-medium transition-colors duration-200 ${active === i ? "text-ink" : "text-muted hover:text-ink"}`}
                >
                  <span
                    aria-hidden="true"
                    className="arch inline-block h-[0.55em] w-[0.38em] transition-transform duration-300"
                    style={{ background: b.stage, transform: active === i ? "scale(1)" : "scale(0.4)", opacity: active === i ? 1 : 0 }}
                  />
                  {b.title}
                </button>
              </li>
            ))}
          </ul>
          <p aria-live="polite" className="mt-6 text-[17px] lg:hidden">
            <strong>{book.mode === "give" ? "Give" : `Lend · ${book.lendFor}`}</strong> · {book.owner}
          </p>
          <p className="mt-8 max-w-[30rem] text-[15px] leading-relaxed text-muted">
            Sample books until the pilot shelf opens on 9 November.{" "}
            <Link href="/login" className="font-semibold text-pandan-deep">
              Join to request one
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
