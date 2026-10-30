"use client";

import Link from "next/link";
import { useRef } from "react";
import { BayuMark } from "@/components/bayu-mark";
import { gsap, MOTION_OK, SplitText, useGSAP } from "@/lib/gsap";
import { GOLD_LINES } from "./motifs";

/**
 * L1 · Hero. The motif (the carved panel's arch) appears once at enormous
 * scale, cropped by the viewport, in kayu timber. Inside it, an open book.
 *
 * Load: the headline's lines rise from their masks (pure CSS, so it reads on
 * the first frame). Scroll: the wind blows the headline away letter by letter,
 * the book's pages turn, and the arch drifts up towards the next scene.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const split = SplitText.create("[data-headline]", {
          type: "words,chars",
          tag: "span",
          charsClass: "inline-block",
          wordsClass: "inline-block whitespace-nowrap",
        });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.5 },
        });

        // The breeze reaches the left of each line first: letters lift, spin and blow away to the right.
        tl.to(
          split.chars,
          {
            x: () => gsap.utils.random(120, 520),
            y: () => gsap.utils.random(-260, -40),
            rotation: () => gsap.utils.random(-75, 75),
            autoAlpha: 0,
            stagger: { each: 0.012, from: "start" },
            duration: 0.5,
          },
          0,
        )
          .to("[data-hero-copy]", { y: -60, autoAlpha: 0, duration: 0.35 }, 0.05)
          .to("[data-arch]", { xPercent: -14, scale: 1.12, duration: 1 }, 0)
          .to("[data-page]", { rotationY: -178, duration: 0.45, stagger: 0.12, ease: "power1.inOut" }, 0.05);

        // Idle: the wind lines inside the arch draw themselves once on load.
        gsap.from("[data-hero-gold]", { drawSVG: "0%", duration: 2.2, ease: "power2.out", stagger: 0.25, delay: 0.4 });

        return () => split.revert();
      });
    },
    { scope: root },
  );

  return (
    <header ref={root} className="relative isolate min-h-svh overflow-hidden bg-sky-light">
      <nav
        aria-label="Main"
        className="relative z-20 mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 pt-6 sm:px-8 sm:pt-8"
      >
        <Link href="/" className="flex items-center gap-2.5 text-ink no-underline">
          <BayuMark className="h-8 w-8" />
          <span className="font-display text-2xl font-semibold">Bayu</span>
        </Link>
        <div className="flex items-center gap-8 text-[15px] font-semibold">
          <a href="#how" className="hidden text-ink no-underline hover:text-pandan sm:inline">
            How it works
          </a>
          <a href="#safety" className="hidden text-ink no-underline hover:text-pandan sm:inline">
            Safety
          </a>
          <a href="#faq" className="hidden text-ink no-underline hover:text-pandan sm:inline">
            FAQ
          </a>
          <Link
            href="/login"
            className="btn-arch bg-ink px-5 py-3 text-bone no-underline transition-colors duration-200 hover:bg-kayu"
          >
            Join the pilot
          </Link>
        </div>
      </nav>

      {/* The giant arch: enters from the right, cropped by the viewport. */}
      <div
        data-arch=""
        aria-hidden="true"
        className="arch absolute -right-[18vw] bottom-[-38vh] z-0 h-[78vh] w-[118vw] origin-bottom overflow-hidden bg-kayu md:top-[10vh] md:-right-[10vw] md:bottom-auto md:h-[125vh] md:w-[56vw]"
      >
        <svg
          viewBox="700 60 560 560"
          preserveAspectRatio="xMidYMin slice"
          className="absolute inset-0 h-full w-full"
          fill="none"
          stroke="#c9a24a"
          strokeWidth={2}
          strokeLinecap="round"
        >
          {GOLD_LINES.map((d) => (
            <path key={d} d={d} data-hero-gold="" />
          ))}
          <path
            d="M700 330 C 780 270, 880 280, 940 330 C 980 364, 1040 360, 1052 322 C 1060 296, 1034 282, 1016 296"
            data-hero-gold=""
          />
        </svg>

        {/* An open book in 3D: four loose pages turn as the wind (scroll) arrives. */}
        <div className="absolute top-[18%] left-1/2 w-[min(64vw,420px)] -translate-x-1/2 [perspective:1400px] md:top-[30vh] md:left-[42%] md:w-[min(30vw,460px)]">
          <div className="relative aspect-[2/1.3] [transform:rotateX(18deg)] [transform-style:preserve-3d]">
            <div className="absolute inset-y-0 left-0 w-1/2 rounded-l-[6px] bg-bone-deep" />
            <div className="absolute inset-y-0 right-0 w-1/2 rounded-r-[6px] bg-bone" />
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                data-page=""
                className="absolute inset-y-0 right-0 w-1/2 origin-left rounded-r-[6px] bg-[#fbfaf6] [backface-visibility:hidden]"
                style={{ transform: `rotateY(${-2 - i * 2}deg)`, zIndex: 4 - i }}
              >
                <div className="mt-[16%] ml-[14%] flex w-[68%] flex-col gap-[9%]" style={{ height: "56%" }}>
                  {[0, 1, 2, 3].map((l) => (
                    <span key={l} className="block h-[3px] rounded-full bg-ink/25" />
                  ))}
                </div>
              </div>
            ))}
            <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-kayu/30" />
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-4 pt-[9vh] pb-[42vh] sm:px-8 md:pt-[16vh] md:pb-24">
        <h1
          data-headline=""
          className="split-ready font-display text-[clamp(2.5rem,6.6vw,6.5rem)] whitespace-nowrap leading-[0.94] font-medium tracking-[-0.03em] text-ink"
        >
          <span className="block overflow-hidden pb-[0.16em] -mb-[0.1em]">
            <span className="line-rise block" style={{ "--i": 0 } as React.CSSProperties}>
              Books that
            </span>
          </span>
          <span className="block overflow-hidden pb-[0.16em] -mb-[0.1em]">
            <span className="line-rise block" style={{ "--i": 1 } as React.CSSProperties}>
              breeze through.
            </span>
          </span>
        </h1>
        <div data-hero-copy="" className="flex max-w-[28rem] flex-col gap-8">
          <p className="fade-in text-[17px] leading-relaxed sm:text-xl">
            Give and lend English books with readers near you in Ansan. Credits keep every swap fair.
          </p>
          <div className="fade-in flex flex-wrap items-center gap-6">
            <Link
              href="/login"
              className="btn-arch bg-pandan px-8 pt-5 pb-4 text-[17px] font-semibold text-white no-underline transition-[background-color,transform] duration-200 hover:bg-pandan-deep active:scale-[0.97]"
            >
              Join the Ansan pilot
            </Link>
            <a href="#how" className="text-[17px] font-semibold text-ink hover:text-pandan">
              See how it works
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
