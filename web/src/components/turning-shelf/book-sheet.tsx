"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { ShelfCopy } from "@/content/shelf";
import { smooth } from "@/lib/smooth";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { BayuMark } from "@/components/bayu-mark";
import { InkPoster } from "./ink-poster";

/**
 * An opened book. A sheet of paper the size and tilt of the cover grows out of
 * it and straightens until it fills the screen; each line of text rises out of
 * its own mask; the cover bleeds in like ink spreading on paper.
 * Closing folds the sheet back into the cover. A modal dialog: Esc or Close
 * returns to the shelf, and the page behind is inert.
 */

function insetFrom(rect: DOMRect) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  return `inset(${rect.top}px ${W - rect.right}px ${H - rect.bottom}px ${rect.left}px round 3px)`;
}

export function BookSheet({ copy, from, onClose }: { copy: ShelfCopy; from: HTMLElement; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  const joinHref = copy.copyId ? `/login?next=${encodeURIComponent(`/browse/${copy.copyId}`)}` : "/login";

  // Lock the page behind: everything else in <body> goes inert, no scrolling.
  useEffect(() => {
    const behind = Array.from(document.body.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && !el.hasAttribute("data-book-sheet") && el.tagName !== "SCRIPT" && el.tagName !== "NEXT-ROUTE-ANNOUNCER",
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
      const el = root.current!;
      el.querySelector<HTMLElement>("#book-sheet-title")?.focus({ preventScroll: true });
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const rect = from.getBoundingClientRect();
        gsap.set(el, { transformOrigin: `${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px` });
        const tl = gsap.timeline();
        tl.fromTo(
          el,
          { clipPath: insetFrom(rect), rotation: -4.5 },
          { clipPath: "inset(0px 0px 0px 0px round 0px)", rotation: 0, duration: 1.05, ease: "sheet", clearProps: "clipPath,transform" },
        );
        tl.fromTo("[data-rise]", { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: "paper", stagger: 0.075 }, 0.62);

      });
      return () => mm.revert();
    },
    { scope: root },
  );

  function close() {
    if (closing.current) return;
    closing.current = true;
    const el = root.current;
    if (!el || !window.matchMedia(MOTION_OK).matches) return onClose();
    el.style.pointerEvents = "none";
    gsap.killTweensOf(el);
    const rect = from.getBoundingClientRect();
    gsap.set(el, { transformOrigin: `${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px` });
    gsap.fromTo(
      el,
      { clipPath: "inset(0px 0px 0px 0px round 0px)", rotation: 0 },
      { clipPath: insetFrom(rect), rotation: -4.5, duration: 0.85, ease: "sheet", onComplete: onClose },
    );
  }

  const facts = copy.mode === "give" ? ["To give", "Yours to keep"] : ["To lend", ...(copy.lendFor ? [`Up to ${copy.lendFor}`] : [])];

  return createPortal(
    <div
      ref={root}
      data-book-sheet=""
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-sheet-title"
      data-lenis-prevent=""
      className="book-sheet fixed inset-0 z-[300] overflow-y-auto bg-sheet text-ink"
    >
      <div className="sticky top-0 z-10 grid h-16 grid-cols-[1fr_auto_1fr] items-center px-4 sm:h-[84px] sm:px-8">
        <button type="button" onClick={close} className="box lbl justify-self-start bg-sheet">
          Close
        </button>
        <span className="flex items-center gap-2 text-cobalt">
          <BayuMark className="h-6 w-6" />
          <span className="font-display text-[19px] font-medium">Bayu</span>
        </span>
        <span className="lbl hidden justify-self-end text-muted sm:block">{copy.sample ? "Sample book" : "On the Ansan shelf"}</span>
      </div>

      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-8 px-[22px] pb-12 md:min-h-[calc(100svh-84px)] md:grid-cols-2 md:gap-[4vw] md:px-[6vw] md:pb-14">
        <div className="flex justify-center md:order-2">
          <InkPoster copy={copy} delay={0.52} className="relative aspect-[2/3] h-[46svh] max-w-full md:h-[min(78vh,780px)]" />
        </div>

        <div className="flex max-w-[520px] flex-col gap-[18px] md:order-1">
          <span className="mask">
            <span data-rise="" className="lbl block text-cobalt">
              {copy.author}
            </span>
          </span>
          <h2 id="book-sheet-title" tabIndex={-1} className="mask font-display text-[42px] leading-[1] font-normal tracking-[-0.025em] outline-none md:text-[clamp(44px,5.4vw,84px)]">
            <span data-rise="" className="block">
              {copy.title}
            </span>
          </h2>
          <span className="mask">
            <span data-rise="" className="flex flex-wrap">
              {facts.map((f) => (
                <span key={f} className="box lbl -ml-px first:ml-0">
                  {f}
                </span>
              ))}
              <span className="box lbl -ml-px">{copy.area}</span>
            </span>
          </span>
          {copy.note ? (
            <span className="mask">
              <span data-rise="" className="block">
                <span className="lbl mb-2 block text-muted">{copy.sample ? `Warkah from ${copy.owner}` : "The owner's warkah"}</span>
                <span className="block max-w-[42ch] font-display text-[17px] leading-[1.5] italic md:text-[19px]">&ldquo;{copy.note}&rdquo;</span>
              </span>
            </span>
          ) : null}
          <span className="mask">
            <span data-rise="" className="block max-w-[42ch] font-display text-[16px] leading-[1.5] text-muted md:text-[17px]">
              {copy.mode === "give"
                ? "Taking a book spends 1 credit. Your first listed book earns you a starter credit."
                : "Borrowing holds 1 credit until the book is back with its owner."}
            </span>
          </span>
          <span className="mask">
            <span data-rise="" className="mt-2 flex flex-wrap gap-3">
              <Link href={joinHref} className="btn-primary">
                {copy.mode === "give" ? "Join to request it" : "Join to borrow it"}
              </Link>
            </span>
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
