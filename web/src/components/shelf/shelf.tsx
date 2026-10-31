"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SHELF } from "@/content/shelf";
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { Book3D } from "./book-3d";
import { ShelfDialog } from "./shelf-dialog";

/**
 * The landing's first screen and main event: the Ansan shelf as a stack of 3D
 * books (after Stripe Press). The camera sits at the middle of the screen, so
 * books above it show their undersides and books below show their covers.
 * Scroll and the bayu blows through the stack: books drift and turn with your
 * speed, then settle. Pick a book: the page floods with its colour and it
 * turns to show its cover and who is sharing it.
 */
export function Shelf() {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<{ index: number; x: number; y: number } | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  // The breeze rests while a book is open (the dialog covers the stack).
  const resting = useRef(false);

  useEffect(() => {
    resting.current = open !== null;
    // Back on the shelf: focus the book you were last looking at. Runs after the
    // dialog's cleanup has lifted `inert`, so the focus always lands.
    if (!open) opener.current?.focus({ preventScroll: true });
  }, [open]);

  useGSAP(
    () => {
      const section = root.current;
      const stack = section?.querySelector<HTMLElement>("[data-stack]");
      if (!section || !stack) return;
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        const drops = gsap.utils.toArray<HTMLElement>("[data-drop]", section);
        const floats = gsap.utils.toArray<HTMLElement>("[data-float]", section);

        // Load: the stack builds itself, books falling into place from above.
        // Transforms only: opacity would flatten the 3D books mid-fall.
        gsap.from(drops, {
          y: () => -window.innerHeight * 0.8,
          rotationX: -70,
          rotationZ: () => gsap.utils.random(-14, 14),
          duration: 1.2,
          ease: "expo.out",
          stagger: { each: 0.06, from: "end" },
          delay: 0.1,
        });

        const set = floats.map((el) => ({
          x: gsap.quickSetter(el, "x", "px"),
          rz: gsap.quickSetter(el, "rotationZ", "deg"),
          ry: gsap.quickSetter(el, "rotationY", "deg"),
        }));

        // Where the stack sits on the page, re-measured whenever ScrollTrigger refreshes.
        let stackTop = 0;
        let stackHeight = 0;
        const measure = () => {
          const r = stack.getBoundingClientRect();
          stackTop = r.top + window.scrollY;
          stackHeight = r.height;
        };
        measure();
        ScrollTrigger.addEventListener("refresh", measure);

        let lastY = window.scrollY;
        let lastOrigin = "";
        let breeze = 0;
        let dir = 1;
        const tick = (time: number) => {
          if (resting.current) return;
          const y = window.scrollY;
          const top = stackTop - y;
          if (top + stackHeight < -200 || top > window.innerHeight + 200) {
            lastY = y;
            return;
          }

          // The camera stays at the middle of the screen as the stack scrolls past.
          const origin = `50% ${Math.round(window.innerHeight / 2 - top)}px`;
          if (origin !== lastOrigin) stack.style.perspectiveOrigin = lastOrigin = origin;

          // Scroll speed becomes wind: books drift and turn, then settle (with a faint idle sway).
          // deltaRatio keeps the feel the same on 60 Hz and 120 Hz screens.
          const ratio = gsap.ticker.deltaRatio(60);
          const v = (y - lastY) / ratio;
          lastY = y;
          if (Math.abs(v) > 0.5) dir = Math.sign(v);
          const target = Math.min(Math.abs(v) / 28, 1);
          const ease = (target > breeze ? 0.18 : 0.05) * ratio;
          breeze += (target - breeze) * Math.min(ease, 1);
          const w = window.innerWidth;
          set.forEach((s, i) => {
            const idle = Math.sin(time * 0.6 + i * 1.7);
            s.x((Math.sin(i * 1.9) * 0.6 + 0.4) * breeze * w * 0.06 * dir + idle * 3);
            s.rz(Math.sin(i * 2.7) * breeze * 5 * dir + idle * 0.4);
            s.ry(Math.cos(i * 1.3) * breeze * 14);
          });
        };
        gsap.ticker.add(tick);
        return () => {
          gsap.ticker.remove(tick);
          ScrollTrigger.removeEventListener("refresh", measure);
          gsap.set(floats, { clearProps: "transform" });
        };
      });

      // Reduced motion: a fixed camera a little above the stack, nothing moves.
      mm.add("(prefers-reduced-motion: reduce)", () => {
        stack.style.perspectiveOrigin = "50% 20%";
      });
    },
    { scope: root },
  );

  function bookButton(index: number) {
    return root.current?.querySelectorAll<HTMLButtonElement>("[data-book]")[index] ?? null;
  }

  function choose(index: number, button: HTMLButtonElement) {
    const r = button.getBoundingClientRect();
    opener.current = button;
    setOpen({ index, x: r.left + r.width / 2, y: r.top + r.height / 2 });
  }

  function navigate(index: number) {
    opener.current = bookButton(index);
    setOpen((o) => (o ? { ...o, index } : o));
  }

  return (
    <section ref={root} aria-labelledby="shelf-title" className="relative bg-malam text-paper">
      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-10 px-4 pb-32 sm:px-8 lg:grid-cols-12 lg:gap-6">
        {/* Intro: sticks beside the stack on a wide screen. */}
        <div className="pt-[8vh] lg:col-span-4 lg:pt-[6vh]">
          <div className="flex flex-col gap-6 lg:sticky lg:top-[22vh]">
            <h1 id="shelf-title" className="font-display text-[clamp(2.6rem,4.6vw,4.4rem)] leading-[1] font-medium tracking-[-0.02em]">
              Your next book is on a friend&rsquo;s shelf.
            </h1>
            <p className="max-w-[24rem] text-[17px] leading-relaxed text-paper/80">
              Give and lend English books with readers near you in Ansan. Credits keep every swap fair.
            </p>
            <div className="flex flex-wrap items-center gap-5">
              <Link
                href="/login"
                className="rounded-full bg-paper px-6 py-3 text-[17px] font-semibold text-malam no-underline transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
              >
                Join the Ansan pilot
              </Link>
              <span className="font-display text-[17px] italic text-paper/80">or pick a book &rarr;</span>
            </div>
            <p className="text-[15px] text-paper/60">Sample shelf until the pilot opens on 9 November.</p>
          </div>
        </div>

        {/* The stack. */}
        <div className="lg:col-span-8">
          <ol
            data-stack=""
            aria-label="Books on the Ansan shelf"
            className="shelf-stack flex flex-col items-center gap-[clamp(30px,4.6vw,56px)] pt-[6vh] [perspective:1800px] lg:pt-[14vh] lg:[perspective:2600px]"
          >
            {SHELF.map((copy, i) => (
              <li key={copy.slug}>
                <button
                  type="button"
                  data-book=""
                  aria-haspopup="dialog"
                  aria-label={`${copy.title} by ${copy.author}. ${copy.mode === "give" ? "To give" : `To lend, ${copy.lendFor}`}, from ${copy.owner}`}
                  onClick={(e) => choose(i, e.currentTarget)}
                  className="block cursor-pointer"
                >
                  <div data-drop="">
                    <div data-float="">
                      <div data-lift="">
                        <Book3D copy={copy} className="[--k:0.62] sm:[--k:0.8] lg:[--k:1]" />
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {open ? (
        <ShelfDialog
          index={open.index}
          origin={{ x: open.x, y: open.y }}
          onNavigate={navigate}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </section>
  );
}
