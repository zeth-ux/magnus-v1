"use client";

import { useRef, useState } from "react";
import type { ShelfCopy } from "@/content/shelf";
import { TurningShelf } from "@/components/turning-shelf/turning-shelf";
import { BookSheet } from "@/components/turning-shelf/book-sheet";

/**
 * The landing's first screen: the turning shelf, with the pitch in the corner.
 * Opening a book grows its page out of the cover (BookSheet).
 */
export function ShelfHero({ copies }: { copies: ShelfCopy[] }) {
  const [open, setOpen] = useState<{ copy: ShelfCopy; from: HTMLElement } | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const samples = copies.every((c) => c.sample);

  const pause = (on: boolean) => {
    const shelf = wrap.current?.querySelector<HTMLElement>(".turning-shelf");
    if (shelf) shelf.dataset.paused = on ? "1" : "0";
  };

  return (
    <div ref={wrap} className="relative">
      <TurningShelf
        copies={copies}
        label={samples ? "Sample shelf" : "Books on the Ansan shelf"}
        start={Math.min(2, copies.length - 1)}
        onOpen={(copy, from) => {
          pause(true);
          setOpen({ copy, from });
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[130] flex items-end justify-between gap-6 px-4 pb-5 sm:px-8 sm:pb-7">
        <h1 className="pointer-events-auto max-w-[24ch] font-display text-[17px] leading-snug sm:text-[20px]">
          Give and lend English books with readers near you in Ansan.
        </h1>
        <span className="lbl hidden shrink-0 text-muted sm:block">{samples ? "Sample shelf" : "Newest first"}</span>
      </div>
      {open ? (
        <BookSheet
          copy={open.copy}
          from={open.from}
          onClose={() => {
            setOpen(null);
            pause(false);
            wrap.current?.querySelector<HTMLElement>(".ts-shelf")?.focus({ preventScroll: true });
          }}
        />
      ) : null}
    </div>
  );
}
