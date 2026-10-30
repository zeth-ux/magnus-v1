"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { smooth } from "@/lib/smooth";
import { SHELF } from "@/content/shelf";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { Book3D } from "./book-3d";

/**
 * A picked book. The page floods with the book's colour from where you
 * clicked, the book turns to show its cover, and the details arrive beside it.
 * A modal dialog: Esc or the close button returns you to the shelf; the rest
 * of the page is inert while it is open.
 */
export function ShelfDialog({
  index,
  origin,
  onNavigate,
  onClose,
}: {
  index: number;
  origin: { x: number; y: number };
  onNavigate: (index: number) => void;
  onClose: () => void;
}) {
  const copy = SHELF[index];
  const next = (index + 1) % SHELF.length;
  const root = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  const firstRun = useRef(true);
  const openTl = useRef<gsap.core.Timeline | null>(null);
  const closeTl = useRef<gsap.core.Timeline | null>(null);

  // Lock the page behind the dialog: everything else in <body> goes inert
  // (keeping whatever inert state it had, and leaving scripts and Next's route
  // announcer alone), the page stops scrolling and Lenis pauses.
  useEffect(() => {
    const behind = Array.from(document.body.children).filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement && !el.hasAttribute("data-shelf-dialog") && el.tagName !== "SCRIPT" && el.tagName !== "NEXT-ROUTE-ANNOUNCER",
    );
    const was = behind.map((el) => el.inert);
    behind.forEach((el) => (el.inert = true));
    const html = document.documentElement;
    const overflow = html.style.overflow;
    html.style.overflow = "hidden";
    smooth.lenis?.stop();
    return () => {
      behind.forEach((el, i) => (el.inert = was[i]));
      html.style.overflow = overflow;
      smooth.lenis?.start();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useGSAP(
    () => {
      // Each book (first open, or "Next") is announced by its title.
      root.current?.querySelector<HTMLElement>("#shelf-dialog-title")?.focus();
      const flood = firstRun.current;
      firstRun.current = false;
      const pose = { rotationX: -62, rotationZ: -11, rotationY: 6 };
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
        // The colour flood plays once, from the book you picked. "Next" only
        // re-poses the book; the background colour cross-fades in CSS.
        if (flood) {
          tl.fromTo(
            root.current,
            { clipPath: `circle(0% at ${origin.x}px ${origin.y}px)` },
            { clipPath: `circle(150% at ${origin.x}px ${origin.y}px)`, duration: 0.9, ease: "power3.inOut", clearProps: "clipPath" },
          );
        }
        tl.fromTo(
          "[data-pose]",
          { rotationX: 0, rotationZ: 0, rotationY: 0, y: 140, scale: 0.75 },
          { ...pose, y: 0, scale: 1, duration: 1.4 },
          flood ? 0.2 : 0,
          // opacity, not autoAlpha: hiding the focused title would drop keyboard focus.
        ).from("[data-detail]", { y: 36, opacity: 0, duration: 0.9, stagger: 0.07 }, flood ? 0.45 : 0.1);
        openTl.current = tl;
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set("[data-pose]", pose);
      });
      return () => closeTl.current?.kill();
    },
    { scope: root, dependencies: [index], revertOnUpdate: true },
  );

  function close() {
    if (closing.current) return;
    closing.current = true;
    const el = root.current;
    if (!el || !window.matchMedia(MOTION_OK).matches) return onClose();
    openTl.current?.kill();
    el.style.pointerEvents = "none";
    closeTl.current = gsap
      .timeline({ onComplete: onClose })
      .to(el.querySelectorAll("[data-detail]"), { y: 20, autoAlpha: 0, duration: 0.25, stagger: 0.02 })
      .fromTo(
        el,
        { clipPath: `circle(150% at ${origin.x}px ${origin.y}px)` },
        { clipPath: `circle(0% at ${origin.x}px ${origin.y}px)`, duration: 0.6, ease: "power3.inOut" },
        0.1,
      );
  }

  return createPortal(
    <div
      ref={root}
      data-shelf-dialog=""
      role="dialog"
      aria-modal="true"
      aria-labelledby="shelf-dialog-title"
      data-lenis-prevent=""
      className="fixed inset-0 z-50 overflow-y-auto motion-safe:transition-colors motion-safe:duration-700"
      style={{ background: copy.flood, color: copy.floodText }}
    >
      <button
        type="button"
        data-close=""
        onClick={close}
        aria-label="Back to the shelf"
        className="fixed top-5 right-4 grid h-12 w-12 place-items-center rounded-full border text-2xl leading-none sm:right-8"
        style={{ borderColor: `${copy.floodText}80`, background: copy.flood }}
      >
        &times;
      </button>
      <div className="mx-auto grid min-h-full w-full max-w-[1400px] grid-cols-1 items-center gap-10 px-4 py-20 sm:px-8 lg:grid-cols-12 lg:gap-6">
        <div className="flex min-h-[44svh] items-center justify-center pt-8 [perspective:1400px] lg:col-span-7 lg:min-h-0 lg:pt-0">
          <div data-pose="" aria-hidden="true" key={copy.slug} style={{ transformStyle: "preserve-3d" }}>
            <Book3D copy={copy} size="min(620px, 70vw)" className="[--k:0.8] lg:[--k:1.25]" />
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-5" key={`d-${copy.slug}`}>
          <p data-detail="" className="font-display text-[17px] italic opacity-90">
            On the Ansan shelf · sample
          </p>
          <h2 id="shelf-dialog-title" tabIndex={-1} data-detail="" className="font-display text-[clamp(2.4rem,4.4vw,4rem)] leading-[1.02] font-semibold tracking-[-0.02em]">
            {copy.title}
          </h2>
          <p data-detail="" className="font-display text-xl italic">
            {copy.author}
          </p>
          <dl data-detail="" className="grid grid-cols-2 gap-4 border-y py-5 text-[15px]" style={{ borderColor: `${copy.floodText}55` }}>
            <div>
              <dt className="opacity-90">{copy.mode === "give" ? "To give" : "To lend"}</dt>
              <dd className="text-[17px] font-semibold">{copy.mode === "give" ? "Yours to keep" : copy.lendFor}</dd>
            </div>
            <div>
              <dt className="opacity-90">From</dt>
              <dd className="text-[17px] font-semibold">
                {copy.owner}, {copy.area}
              </dd>
            </div>
          </dl>
          <figure data-detail="" className="flex flex-col gap-2">
            <figcaption className="text-[15px] font-semibold opacity-90">Warkah from {copy.owner}</figcaption>
            <blockquote className="font-display text-[clamp(1.25rem,1.8vw,1.6rem)] leading-snug italic">
              &ldquo;{copy.note}&rdquo;
            </blockquote>
          </figure>
          <div data-detail="" className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/login"
              className="rounded-full px-6 py-3 text-[17px] font-semibold no-underline transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
              style={{ background: copy.floodText, color: copy.flood }}
            >
              {copy.mode === "give" ? "Join to request it" : "Join to borrow it"}
            </Link>
            <button
              type="button"
              onClick={() => onNavigate(next)}
              className="rounded-full border px-5 py-3 text-[15px] font-semibold"
              style={{ borderColor: `${copy.floodText}80` }}
            >
              Next: {SHELF[next].title} &rarr;
            </button>
          </div>
          <p data-detail="" className="text-[15px] opacity-90">
            {copy.mode === "give"
              ? "Taking a book spends 1 credit. Your first listed book earns you a starter credit."
              : "Borrowing holds 1 credit until the book is back with its owner."}
          </p>
        </div>
      </div>

    </div>,
    document.body,
  );
}
