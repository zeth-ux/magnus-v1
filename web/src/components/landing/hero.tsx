import Link from "next/link";
import { BayuMark } from "@/components/bayu-mark";
import { BOOK_LEFT, BOOK_RIGHT, WIND_LINES } from "./motifs";

/**
 * L1 · Hero. Pure server markup: readable on the first frame.
 * The headline's lines rise from behind a mask with CSS (no JavaScript needed),
 * and the wind lines drift slowly. Both stop for reduced motion.
 */
export function Hero() {
  return (
    <header className="relative isolate min-h-svh overflow-hidden bg-sky-light">
      <svg
        viewBox="0 0 1280 800"
        preserveAspectRatio="xMidYMid slice"
        className="wind-drift pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-25"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
        aria-hidden="true"
      >
        {WIND_LINES.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>

      <nav
        aria-label="Main"
        className="mx-auto flex w-full max-w-[1312px] items-center justify-between px-4 pt-6 sm:px-8 sm:pt-8"
      >
        <Link href="/" className="flex items-center gap-2.5 text-ink no-underline">
          <BayuMark className="h-8 w-8" />
          <span className="font-display text-2xl font-semibold">Bayu</span>
        </Link>
        <div className="flex items-center gap-8 text-[15px] font-semibold">
          <a href="#how" className="hidden text-ink no-underline hover:text-pandan sm:inline">
            How it works
          </a>
          <a href="#safety" className="hidden text-ink no-underline hover:text-pandan sm:inline">
            Safety
          </a>
          <a href="#faq" className="hidden text-ink no-underline hover:text-pandan sm:inline">
            FAQ
          </a>
          <Link
            href="/login"
            className="rounded-full bg-ink px-5 py-3 text-bone no-underline transition-colors duration-200 hover:bg-kayu"
          >
            Join the pilot
          </Link>
        </div>
      </nav>

      <div className="mx-auto grid w-full max-w-[1312px] grid-cols-1 items-end gap-12 px-4 pt-[12vh] pb-16 sm:px-8 lg:grid-cols-12 lg:pt-[18vh]">
        <div className="flex flex-col gap-7 lg:col-span-7">
          <h1 className="font-display text-[clamp(2.75rem,11vw,6rem)] leading-[0.98] font-medium tracking-[-0.02em]">
            <span className="block overflow-hidden pb-[0.08em]">
              <span className="line-rise block" style={{ "--i": 0 } as React.CSSProperties}>
                Books that
              </span>
            </span>
            <span className="block overflow-hidden pb-[0.08em]">
              <span className="line-rise block" style={{ "--i": 1 } as React.CSSProperties}>
                breeze through.
              </span>
            </span>
          </h1>
          <p className="fade-in max-w-[30rem] text-lg leading-relaxed sm:text-xl">
            Give and lend English books with readers near you in Ansan. Credits keep every swap
            fair.
          </p>
          <div className="fade-in flex flex-wrap items-center gap-6">
            <Link
              href="/login"
              className="rounded-full bg-pandan px-7 py-4 text-[17px] font-semibold text-white no-underline transition-[background-color,transform] duration-200 hover:bg-pandan-deep active:scale-[0.98]"
            >
              Join the Ansan pilot
            </Link>
            <a href="#how" className="text-base font-semibold text-ink hover:text-pandan">
              See how it works
            </a>
          </div>
        </div>

        <svg
          viewBox="500 600 280 160"
          className="mx-auto w-full max-w-[420px] lg:col-span-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          role="img"
          aria-label="An open book resting, its pages about to catch the breeze"
        >
          <path d={BOOK_LEFT} fill="#f1efea" />
          <path d={BOOK_RIGHT} fill="#f1efea" />
          <path
            d="M540 660 C 575 650, 610 652, 628 660 M540 682 C 575 672, 610 674, 628 682 M540 704 C 570 696, 600 698, 620 704"
            strokeWidth={1.2}
            opacity={0.5}
          />
          <path
            d="M652 660 C 670 652, 705 650, 740 660 M652 682 C 670 674, 705 672, 740 682"
            strokeWidth={1.2}
            opacity={0.5}
          />
        </svg>
      </div>
    </header>
  );
}
