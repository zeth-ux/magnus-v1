"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { PucukRebungBand } from "./motifs";

/**
 * The close: the product's first screen, already open. A full songket-gold
 * field with Bayu's real "List your first book" dialog at true size. The field
 * and the give/lend choice work; the button takes you to join the pilot.
 */
export function FirstStep() {
  const root = useRef<HTMLElement>(null);
  const [mode, setMode] = useState<"give" | "lend">("lend");
  const [title, setTitle] = useState("Klara and the Sun");

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // Scrubbed and never hidden: the dialog slides up and settles from a tilt,
        // like a card laid on the table, so the content is always on the page.
        const tl = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "top 25%", scrub: 0.6 },
          defaults: { ease: "power2.out" },
        });
        tl.from("[data-close-line] > * > *", { yPercent: 40, stagger: 0.1 })
          .from("[data-dialog]", { y: 140, rotation: 5 }, 0);
        // The songket band slides sideways as you scroll past, like cloth on a loom.
        gsap.fromTo(
          "[data-band]",
          { xPercent: 0 },
          { xPercent: -12, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } },
        );
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-labelledby="first-step" className="relative overflow-hidden bg-songket text-kayu">
      <div aria-hidden="true" className="overflow-hidden">
        <div data-band="" className="w-[130%]">
          <PucukRebungBand id="pucuk-close" className="block" />
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 items-end gap-12 px-4 pt-16 pb-20 sm:px-8 lg:grid-cols-12 lg:gap-6 lg:pt-24 lg:pb-16">
        <div className="flex flex-col justify-end gap-6 lg:col-span-5">
          <h2
            id="first-step"
            data-close-line=""
            className="font-display text-[clamp(3.5rem,6.6vw,6.5rem)] leading-[0.92] font-semibold tracking-[-0.03em]"
          >
            <span className="block overflow-hidden pb-[0.06em]">
              <span className="block">Jom,</span>
            </span>
            <span className="block overflow-hidden pb-[0.06em]">
              <span className="block">list one.</span>
            </span>
          </h2>
          <p className="max-w-[26rem] text-[17px] leading-relaxed font-medium">
            Join today. When the shelf opens on 9 November, your first book earns a starter credit.
          </p>
        </div>

        <div className="flex lg:col-span-5 lg:col-start-7">
          {/* taste-skill-ignore: a real dialog fragment (data-ui) keeps its own shadow */}
          {/* A preview, not a real form: nothing here is submitted or sent anywhere. */}
          <div
            role="group"
            aria-labelledby="first-book-title"
            data-ui=""
            data-dialog=""
            className="flex w-full max-w-[440px] flex-col gap-5 rounded-[10px] bg-bone p-7 text-ink dialog-shadow"
          >
            <h3 id="first-book-title" className="font-display text-2xl font-semibold">
              List your first book
            </h3>
            <label className="flex flex-col gap-2 text-[15px] font-semibold">
              Book title
              <input
                value={title}
                maxLength={120}
                onChange={(e) => setTitle(e.target.value)}
                className="h-12 rounded-lg border border-bone-deep bg-white px-4 text-[17px] font-normal outline-none focus-visible:border-pandan"
              />
            </label>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-[15px] font-semibold">I want to</legend>
              <div className="grid grid-cols-2 gap-1 rounded-full bg-bone-deep p-1">
                {(["give", "lend"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={mode === m}
                    onClick={() => setMode(m)}
                    className={`h-11 rounded-full text-[15px] font-semibold capitalize transition-colors duration-200 ${mode === m ? "bg-ink text-bone" : "text-ink hover:bg-bone"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </fieldset>
            <p className="text-[15px] leading-relaxed text-muted">
              {mode === "give"
                ? `${title || "Your book"} becomes the next reader's. You earn 1 credit once you both confirm the handover.`
                : `${title || "Your book"} comes back to you. The borrower's credit is held until it does.`}
            </p>
            <Link
              href="/login"
              className="btn-arch mt-1 bg-pandan pt-4 pb-3.5 text-center text-[17px] font-semibold text-white no-underline transition-[background-color,transform] duration-200 hover:bg-pandan-deep active:scale-[0.98]"
            >
              Join the pilot to list it
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
