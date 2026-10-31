import Link from "next/link";
import { BayuMark } from "@/components/bayu-mark";

/** The site bar: the mark and tagline (after Stripe Press's "Ideas for progress"), and the way in. */
export function SiteHeader() {
  return (
    <header className="bg-malam text-paper">
      <nav aria-label="Main" className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3 text-paper no-underline">
          <BayuMark className="h-8 w-8" />
          <span className="flex flex-col leading-tight">
            <span className="font-display text-[17px] font-semibold">Bayu</span>
            <span className="font-display text-[15px] italic opacity-80">Books that breeze through</span>
          </span>
        </Link>
        <div className="flex items-center gap-6 text-[15px]">
          <a href="#how" className="hidden text-paper no-underline hover:underline sm:inline">
            How it works
          </a>
          <a href="#faq" className="hidden text-paper no-underline hover:underline sm:inline">
            Questions
          </a>
          <Link
            href="/login"
            className="rounded-full border border-paper/60 px-4 py-2 font-semibold text-paper no-underline transition-colors duration-200 hover:bg-paper hover:text-malam"
          >
            Join the pilot
          </Link>
        </div>
      </nav>
    </header>
  );
}
