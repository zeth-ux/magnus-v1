"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import type { ShelfCopy } from "@/content/shelf";
import { TurningShelf } from "@/components/turning-shelf/turning-shelf";
import { growSheetThen } from "@/components/turning-shelf/sheet-navigate";

/** The browse results as a turning shelf. Opening a book grows a sheet from its cover into the book's page. */
export function BrowseShelf({ copies }: { copies: ShelfCopy[] }) {
  const router = useRouter();
  const wrap = useRef<HTMLDivElement>(null);
  const cancel = useRef<(() => void) | null>(null);

  // When this page goes away (the book page arrived, or the reader went elsewhere
  // mid-grow), stop the sheet: it must never navigate after the reader moved on.
  useEffect(
    () => () => {
      cancel.current?.();
      cancel.current = null;
      const shelf = wrap.current?.querySelector<HTMLElement>(".turning-shelf");
      if (shelf) shelf.dataset.paused = "0";
    },
    [],
  );

  return (
    <div ref={wrap} className="browse-shelf">
      <TurningShelf
        copies={copies}
        label="Books on the shelf"
        onOpen={(copy, from) => {
          // One book at a time: ignore a second open while the sheet grows.
          if (cancel.current || !copy.copyId) return;
          const shelf = wrap.current?.querySelector<HTMLElement>(".turning-shelf");
          if (shelf) shelf.dataset.paused = "1";
          const href = `/browse/${copy.copyId}`;
          router.prefetch(href);
          cancel.current = growSheetThen(from, () => router.push(href));
        }}
      />
    </div>
  );
}
