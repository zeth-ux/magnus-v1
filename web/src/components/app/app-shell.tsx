import type { Viewport } from "next";
import Link from "next/link";
import { BayuMark } from "@/components/bayu-mark";
import { NavLink } from "./nav-link";

// viewportFit "cover" lets the phone tab bar sit above the home indicator (safe-area padding).
export const APP_VIEWPORT: Viewport = { themeColor: "#1c1614", colorScheme: "dark", viewportFit: "cover" };

// The app's five places (docs/user-flow.md): a top bar on wide screens, a tab bar at the bottom on phones.
const NAV = [
  { href: "/browse", label: "Browse", short: "Browse" },
  { href: "/shelf", label: "My shelf", short: "Shelf" },
  { href: "/add", label: "Add a book", short: "Add" },
  { href: "/activity", label: "Activity", short: "Activity" },
  { href: "/me", label: "Me", short: "Me" },
];

/** The signed-in app frame: the night ground, the mark, and the main places. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-malam app-tabs on-dark min-h-svh bg-malam text-paper">
      <header className="mx-auto flex w-full max-w-[1100px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3 text-paper no-underline">
          <BayuMark className="h-8 w-8" />
          <span className="font-display text-[17px] font-semibold">Bayu</span>
        </Link>
        <nav aria-label="App" className="hidden items-center gap-5 text-[15px] whitespace-nowrap sm:flex">
          {NAV.map((item) => (
            <NavLink key={item.href} href={item.href} className="text-paper hover:underline">
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-[1100px] px-5 pt-6 pb-32 sm:px-8 sm:pb-24">{children}</main>
      <nav
        aria-label="App, tab bar"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-paper/15 bg-malam pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        {NAV.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            className={`flex h-14 items-center justify-center text-[13px] font-semibold ${item.href === "/add" ? "text-songket" : "text-paper"}`}
          >
            {item.short}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
