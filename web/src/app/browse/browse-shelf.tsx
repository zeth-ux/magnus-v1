"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import type { ShelfCopy } from "@/content/shelf";
import { TurningShelf } from "@/components/turning-shelf/turning-shelf";
import { growSheetThen } from "@/components/turning-shelf/sheet-navigate";

/** The browse results as a turning shelf. Opening a book grows a sheet from its cover into the book's page. */
export function BrowseShelf({ copies }: { copies: ShelfCopy[] }) {
  const router = useRouter();
  const lift = useRef<(() => void) | null>(null);
  // When this page goes away (the book page has arrived), take the sheet off.
  useEffect(() => () => lift.current?.(), []);
  return (
    <div className="browse-shelf">
      <TurningShelf
        copies={copies}
        label="Books on the shelf"
        onOpen={(copy, from) => {
          if (!copy.copyId) return;
          const href = `/browse/${copy.copyId}`;
          router.prefetch(href);
          lift.current = growSheetThen(from, () => router.push(href)) ?? null;
        }}
      />
    </div>
  );
}
