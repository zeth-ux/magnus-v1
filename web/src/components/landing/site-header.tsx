import Link from "next/link";
import { BayuMark } from "@/components/bayu-mark";

/** The site bar over the shelf: a way to the explanations, the mark, and the way in. */
export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-[140]">
      <nav aria-label="Main" className="grid h-16 grid-cols-[1fr_auto_1fr] items-center px-4 sm:h-[84px] sm:px-8">
        <span className="flex items-center gap-1 justify-self-start">
          <a href="#how" className="box lbl text-ink no-underline">
            How it works
          </a>
          <a href="#faq" className="box lbl -ml-px hidden text-ink no-underline sm:inline-flex">
            Questions
          </a>
        </span>
        <Link href="/" className="flex flex-col items-center gap-1 text-cobalt no-underline" aria-label="Bayu, home">
          <span className="flex items-center gap-2">
            <BayuMark className="h-6 w-6 sm:h-7 sm:w-7" />
            <span className="font-display text-[20px] font-medium tracking-[0.01em] sm:text-[23px]">Bayu</span>
          </span>
          <span className="lbl hidden !text-[9px] !tracking-[0.3em] sm:block">Books that breeze through</span>
        </Link>
        <Link href="/login" className="box lbl justify-self-end bg-cobalt !border-cobalt text-white no-underline">
          Join
        </Link>
      </nav>
    </header>
  );
}
