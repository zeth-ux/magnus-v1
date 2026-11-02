import type { Viewport } from "next";
import Link from "next/link";
import { BayuMark } from "@/components/bayu-mark";
import { Suspense } from "react";
import { NavLink } from "./nav-link";
import { WaitingBadge } from "./waiting-badge";

// viewportFit "cover" lets the phone tab bar sit above the home indicator (safe-area padding).
export const APP_VIEWPORT: Viewport = { themeColor: "#edebe6", colorScheme: "light", viewportFit: "cover" };

// The app's five places (docs/user-flow.md): a top bar on wide screens, a tab bar at the bottom on phones.
const NAV = [
  { href: "/browse", label: "Browse", short: "Browse" },
  { href: "/shelf", label: "My shelf", short: "Shelf" },
  { href: "/add", label: "Add a book", short: "Add" },
  { href: "/activity", label: "Activity", short: "Activity" },
  { href: "/me", label: "Me", short: "Me" },
];

/** The count on Activity: streamed in, so the frame never waits for it. */
const badgeFor = (href: string, corner = false) =>
  href === "/activity" ? (
    <Suspense fallback={null}>
      <WaitingBadge corner={corner} />
    </Suspense>
  ) : null;

/** The signed-in app frame: the night ground, the mark, and the main places. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-tabs on-dark min-h-svh bg-paper text-ink">
      <header className="mx-auto flex w-full max-w-[1100px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3 text-ink no-underline">
          <BayuMark className="h-8 w-8" />
          <span className="font-display text-[17px] font-semibold">Bayu</span>
        </Link>
        <nav aria-label="App" className="hidden items-center gap-5 text-[15px] whitespace-nowrap sm:flex">
          {NAV.map((item) => (
            <NavLink key={item.href} href={item.href} className="text-ink hover:underline" badge={badgeFor(item.href)}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-[1100px] px-5 pt-6 pb-12 sm:px-8">{children}</main>
      {/* pb-28 on phones clears the fixed tab bar below. */}
      <footer className="mx-auto flex w-full max-w-[1100px] flex-wrap gap-x-6 gap-y-2 px-5 pb-28 text-[15px] text-ink/70 sm:px-8 sm:pb-12">
        <Link href="/feedback" className="text-ink/80 underline underline-offset-4">
          Send feedback
        </Link>
        <Link href="/report" className="text-ink/80 underline underline-offset-4">
          Report a problem
        </Link>
        <Link href="/privacy" className="text-ink/80 underline underline-offset-4">
          Privacy
        </Link>
      </footer>
      <nav
        aria-label="App, tab bar"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-ink/15 bg-paper pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        {NAV.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            badge={badgeFor(item.href, true)}
            className={`flex h-14 items-center justify-center text-[13px] font-semibold ${item.href === "/add" ? "text-cobalt" : "text-ink"}`}
          >
            {item.short}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
