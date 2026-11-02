import Link from "next/link";
import { BayuMark } from "@/components/bayu-mark";

/** The last word and the footer: one invitation, the links, the small print. */
export function Closing() {
  return (
    <footer className="border-t border-ink/90 px-4 pt-14 pb-8 sm:px-8 sm:pt-20">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-14">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <p className="max-w-[16ch] font-display text-[clamp(2.4rem,5vw,4.4rem)] leading-[1] tracking-[-0.03em]">
            Finished a book? Let it breeze on.
          </p>
          <Link href="/login" className="btn-primary">
            Join the pilot
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-6 border-t border-ink/25 pt-6">
          <span className="flex items-center gap-2 text-cobalt">
            <BayuMark className="h-6 w-6" />
            <span className="font-display text-[19px]">Bayu</span>
          </span>
          <nav aria-label="Footer" className="flex flex-wrap">
            <a href="#how" className="box lbl text-ink no-underline">
              How it works
            </a>
            <a href="#safety" className="box lbl -ml-px text-ink no-underline">
              Safety
            </a>
            <a href="#faq" className="box lbl -ml-px text-ink no-underline">
              Questions
            </a>
            <Link href="/privacy" className="box lbl -ml-px text-ink no-underline">
              Privacy
            </Link>
          </nav>
          <span className="lbl text-muted">Made in Ansan, 2026</span>
        </div>
      </div>
    </footer>
  );
}
