import Link from "next/link";
import { SpineArt } from "@/components/shelf/cover-art";
import type { ShelfCopy } from "@/content/shelf";

/**
 * One book in the browse list, drawn as its spine (the same look it has on
 * the landing shelf), with who has it and how they're sharing it.
 */
export function SpineRow({ copy, href, owner, mine }: { copy: ShelfCopy; href: string; owner: string; mine: boolean }) {
  return (
    <li>
      <Link
        href={href}
        aria-label={`${copy.title} by ${copy.author}. ${copy.mode === "give" ? "To give" : `To lend for up to ${copy.lendFor}`}, from ${mine ? "you" : owner} in ${copy.area}`}
        className="group flex flex-col gap-2 no-underline sm:flex-row sm:items-center sm:gap-6"
      >
        <span
          className="relative block h-14 w-full shrink-0 overflow-hidden rounded-[3px] motion-safe:transition-transform motion-safe:duration-300 group-hover:translate-x-2 group-focus-visible:translate-x-2 sm:w-[min(560px,60%)]"
          style={{ background: copy.colour, color: copy.text }}
        >
          <SpineArt copy={copy} />
          <span className="relative flex h-full w-[62%] min-w-0 items-center gap-4 px-4">
            <span className="w-[32%] shrink-0 truncate text-[13px] font-semibold">{copy.author}</span>
            <span className="min-w-0 flex-1 truncate font-display text-[17px] font-medium">{copy.title}</span>
          </span>
        </span>
        <span className="flex flex-wrap items-baseline gap-x-3 text-[15px] text-paper">
          <span className="font-semibold">{copy.mode === "give" ? "To give" : `To lend · ${copy.lendFor}`}</span>
          <span className="text-paper/70">
            {mine ? "Yours" : owner} · {copy.area}
          </span>
        </span>
      </Link>
    </li>
  );
}
