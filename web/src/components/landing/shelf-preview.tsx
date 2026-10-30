"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { SAMPLE_SHELF } from "@/content/landing";

/**
 * L5 · "Breezing in Ansan right now": the live thing. An index with a preview:
 * hover or focus a title and its cover appears beside the list (desktop).
 * Uses SAMPLE books until the pilot shelf opens; then it reads Supabase.
 */
export function ShelfPreview() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const book = SAMPLE_SHELF[active];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from("[data-shelf-row]", {
          y: 20,
          autoAlpha: 0,
          duration: 0.6,
          ease: "expo.out",
          stagger: 0.06,
          scrollTrigger: { trigger: "[data-shelf-list]", start: "top 85%", once: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-labelledby="shelf-heading" className="bg-bone text-ink">
      <div className="mx-auto grid w-full max-w-[1312px] grid-cols-1 gap-12 px-4 py-28 sm:px-8 lg:grid-cols-12 lg:gap-6 lg:py-40">
        <div className="flex flex-col gap-3 lg:col-span-7">
          <h2
            id="shelf-heading"
            className="font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.04] font-medium tracking-[-0.02em]"
          >
            Breezing in Ansan right now
          </h2>
          <p className="mb-6 max-w-[34rem] text-lg leading-relaxed">
            Join, list one book, and request any of these. These are sample books until the pilot
            shelf opens on 9 November.
          </p>

          <ul data-shelf-list="" className="flex flex-col">
            {SAMPLE_SHELF.map((b, i) => (
              <li key={b.title} data-shelf-row="">
                <Link
                  href="/login"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className={`grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-4 rounded-sm px-3 py-4 text-ink no-underline transition-colors duration-200 sm:grid-cols-[minmax(0,1fr)_9rem_8rem] sm:items-baseline lg:grid-cols-[minmax(0,1fr)_9rem_9rem] ${active === i ? "bg-bone-deep" : "hover:bg-bone-deep"}`}
                >
                  <span
                    aria-hidden="true"
                    className="h-12 w-9 rounded-[2px] sm:hidden"
                    style={{ background: b.cover }}
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="font-display text-2xl font-semibold">{b.title}</span>
                    <span className="text-sm text-muted">
                      {b.author}
                      <span className="sm:hidden">
                        {" · "}
                        {b.mode === "give" ? "Give" : `Lend · ${b.lendFor}`}
                      </span>
                    </span>
                  </span>
                  <span
                    className={`hidden text-sm font-bold sm:block ${b.mode === "give" ? "text-pandan-deep" : "text-kopi"}`}
                  >
                    {b.mode === "give" ? "Give" : `Lend · ${b.lendFor}`}
                  </span>
                  <span className="hidden text-right text-sm text-muted sm:block">
                    {b.readers === 1 ? "1 reader has it" : `${b.readers} readers have it`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <figure className="hidden flex-col gap-4 self-center lg:col-span-4 lg:col-start-9 lg:flex" aria-hidden="true">
          <div
            className="flex h-[26rem] flex-col justify-between rounded-[4px] p-8 transition-colors duration-300"
            style={{ background: book.cover }}
          >
            <span
              className="font-display text-[2.5rem] leading-[1.05] font-semibold"
              style={{ color: book.coverInk }}
            >
              {book.title}
            </span>
            <span className="text-[13px] tracking-[0.04em]" style={{ color: book.coverInk }}>
              {book.author}
            </span>
          </div>
          <figcaption className="text-[15px] leading-relaxed">
            {book.owner}
            {book.note ? <>: &ldquo;{book.note}&rdquo;</> : null}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
