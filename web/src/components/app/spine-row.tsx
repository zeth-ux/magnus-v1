import Link from "next/link";
import type { ShelfCopy } from "@/content/shelf";
import { PrintCover } from "@/components/turning-shelf/print-art";

/**
 * One book in a list, like a line in a library catalogue: a small cover, the
 * title and author, and the facts that decide a request (give or lend, how
 * long, who has it and where).
 */
export function SpineRow({ copy, href, owner, mine }: { copy: ShelfCopy; href: string; owner: string; mine: boolean }) {
  const facts = copy.mode === "give" ? ["To give"] : ["To lend", ...(copy.lendFor ? [`Up to ${copy.lendFor}`] : [])];
  return (
    <li className="border-b border-ink/25">
      <Link href={href} className="group grid grid-cols-[52px_1fr] items-center gap-4 py-4 text-ink no-underline sm:grid-cols-[60px_1fr_auto] sm:gap-6">
        <span className="relative block aspect-[2/3] w-full overflow-hidden rounded-[2px] shadow-[0_10px_20px_-12px_rgb(20_16_10/0.6)] motion-safe:transition-transform motion-safe:duration-300 group-hover:-translate-y-1">
          <PrintCover copy={copy} />
        </span>
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="lbl truncate text-cobalt">{copy.author}</span>
          <span className="truncate font-display text-[21px] leading-[1.15] group-hover:underline">{copy.title}</span>
          <span className="text-[14px] text-muted">
            {mine ? "Yours" : `From ${owner}`}, {copy.area}
          </span>
        </span>
        <span className="col-start-2 flex flex-wrap sm:col-start-3">
          {facts.map((f) => (
            <span key={f} className="box lbl -ml-px first:ml-0">
              {f}
            </span>
          ))}
        </span>
      </Link>
    </li>
  );
}
