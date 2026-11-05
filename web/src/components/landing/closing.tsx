import Link from "next/link";
import { BayuMark } from "@/components/bayu-mark";

/**
 * The back cover: the page ends on ink, with one invitation, the links, and
 * the name printed big in mustard, cut off by the bottom edge like a book's
 * title running off its jacket.
 */
export function Closing() {
  return (
    <footer className="overflow-hidden bg-ink px-4 pt-16 text-cream sm:px-8 sm:pt-24">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-14">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <p className="max-w-[16ch] font-display text-[clamp(2.4rem,5vw,4.4rem)] leading-[1] tracking-[-0.03em]">
            Finished a book? Let it breeze on.
          </p>
          <Link href="/login" className="btn-light">
            Join the pilot
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-6 border-t border-cream/25 pt-6">
          <nav aria-label="Footer" className="flex flex-wrap">
            <a href="#how" className="box lbl !border-cream/60 text-cream no-underline">
              How it works
            </a>
            <a href="#safety" className="box lbl -ml-px !border-cream/60 text-cream no-underline">
              Safety
            </a>
            <a href="#faq" className="box lbl -ml-px !border-cream/60 text-cream no-underline">
              Questions
            </a>
            <Link href="/privacy" className="box lbl -ml-px !border-cream/60 text-cream no-underline">
              Privacy
            </Link>
          </nav>
          <span className="lbl text-cream-muted">Made in Ansan, 2026</span>
        </div>
      </div>
      <p
        aria-hidden="true"
        className="mx-auto mt-[clamp(3rem,9vw,8rem)] flex max-w-[1280px] items-end gap-[2vw] font-display text-[clamp(7rem,30vw,26rem)] leading-[0.72] tracking-[-0.05em] text-mustard select-none"
      >
        <BayuMark className="mb-[3vw] h-[16vw] max-h-[13rem] w-[16vw] max-w-[13rem] shrink-0" />
        Bayu
      </p>
    </footer>
  );
}
