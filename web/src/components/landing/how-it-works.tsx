"use client";

import { useRef, useState } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { HOW_STAGES } from "@/content/landing";

/**
 * How it works, as a horizontal accordion of four stages that read dark to
 * light: kayu timber through to songket gold. Open a stage and its library
 * stamp slams onto it. On a phone the accordion stacks vertically.
 */
export function HowItWorks() {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(0);

  // The stamp lands hard: big and tilted, then pressed flat with a little jolt.
  function slam(index: number) {
    if (!window.matchMedia(MOTION_OK).matches) return;
    const stamp = root.current?.querySelector(`[data-stamp="${index}"]`);
    const stage = root.current?.querySelector(`[data-stage="${index}"]`);
    if (!stamp || !stage) return;
    gsap
      .timeline()
      .fromTo(
        stamp,
        { scale: 2.6, rotation: -18, autoAlpha: 0 },
        { scale: 1, rotation: -6, autoAlpha: 1, duration: 0.32, ease: "power4.in" },
      )
      .fromTo(stage, { x: 0 }, { x: 6, duration: 0.05, yoyo: true, repeat: 3, ease: "none" })
      .set(stage, { x: 0 });
  }

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: "[data-accordion]", start: "top 80%", once: true },
        });
        tl.from("[data-how-heading] > *", { y: 40, autoAlpha: 0, duration: 0.9, ease: "expo.out", stagger: 0.1 })
          .from(
            "[data-stage]",
            { yPercent: 30, autoAlpha: 0, duration: 0.9, ease: "expo.out", stagger: 0.08 },
            0.15,
          )
          .add(() => slam(0), 0.75);
      });
    },
    { scope: root },
  );

  function choose(index: number) {
    if (index === open) return;
    setOpen(index);
    // Let the panel widen first, then stamp it.
    window.setTimeout(() => slam(index), 260);
  }

  return (
    <section ref={root} id="how" aria-labelledby="how-heading" className="scroll-mt-0 bg-bone text-ink">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-28 sm:px-8 lg:py-40">
        <div data-how-heading="" className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <h2
            id="how-heading"
            className="font-display text-[clamp(2.5rem,4.4vw,4rem)] leading-[1.02] font-medium tracking-[-0.02em] lg:col-span-5"
          >
            Four steps, one fair rule.
          </h2>
          <p className="max-w-[34rem] text-[17px] leading-relaxed lg:col-span-5 lg:col-start-7">
            Give a book and you earn a credit; spend it on any book on the shelf. Nobody needs a
            perfect one-for-one match. Open each step to see how it works.
          </p>
        </div>

        <div data-accordion="" className="mt-16 flex flex-col overflow-hidden rounded-[6px] lg:h-[520px] lg:flex-row">
          {HOW_STAGES.map((stage, i) => {
            const isOpen = open === i;
            return (
              <div
                key={stage.name}
                data-stage={i}
                className="relative flex min-w-0 flex-col transition-[flex-grow,flex-basis] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:basis-0"
                style={{ background: stage.bg, color: stage.ink, flexGrow: isOpen ? 5.5 : 1 }}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`stage-${i}`}
                  onClick={() => choose(i)}
                  className="flex h-16 w-full items-center justify-between px-6 text-left lg:absolute lg:inset-0 lg:h-full lg:items-start lg:justify-start lg:p-7"
                >
                  <span
                    className={`font-display font-medium ${isOpen ? "text-[clamp(1.75rem,2.6vw,2.5rem)]" : "text-[17px] lg:absolute lg:bottom-7 lg:left-7 lg:origin-bottom-left lg:-rotate-90 lg:text-xl lg:whitespace-nowrap"}`}
                  >
                    {stage.name}
                  </span>
                  <span aria-hidden="true" className="text-2xl lg:hidden">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                <div
                  id={`stage-${i}`}
                  hidden={!isOpen}
                  className="relative px-6 pb-8 lg:absolute lg:inset-x-0 lg:bottom-0 lg:px-7 lg:pb-8"
                >
                  <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                    <p className="max-w-[36ch] text-[17px] leading-relaxed">{stage.text}</p>
                    <span
                      data-stamp={i}
                      className="self-start rounded-[4px] border-[3px] px-4 py-2 font-display text-[clamp(1.25rem,2vw,1.75rem)] font-semibold whitespace-nowrap lg:self-end"
                      style={{ borderColor: stage.ink, color: stage.ink, transform: "rotate(-6deg)" }}
                    >
                      {stage.stamp}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
