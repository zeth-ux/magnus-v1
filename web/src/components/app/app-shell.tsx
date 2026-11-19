import type { Viewport } from "next";
import Link from "next/link";
import { BayuMark } from "@/components/bayu-mark";
import { Suspense } from "react";
import { NavLink } from "./nav-link";
import { WaitingBadge } from "./waiting-badge";
import { getSessionUser } from "@/lib/supabase/user";
import { SignInLink } from "./sign-in-link";

// viewportFit "cover" lets the phone tab bar sit above the home indicator (safe-area padding).
export const APP_VIEWPORT: Viewport = { themeColor: "#141414", colorScheme: "light", viewportFit: "cover" };

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

/** The app frame: the mark, the main places as catalogue tabs, and the small print. Signed out (the open shelf) it offers Sign in. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-tabs flex min-h-svh flex-col bg-paper text-ink">
      {/* The app bar: ink, like the spine of the book you're in. */}
      <div className="on-dark bg-ink text-cream">
        <header className="mx-auto flex w-full max-w-[1100px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2 text-mustard no-underline" aria-label="Bayu, home">
            <BayuMark className="h-7 w-7" />
            <span className="font-display text-[22px] font-medium text-cream">Bayu</span>
          </Link>
          <nav aria-label="App" className="app-nav hidden items-center whitespace-nowrap sm:flex">
            {NAV.map((item) => (
              <NavLink key={item.href} href={item.href} className="app-tab box lbl -ml-px" badge={badgeFor(item.href)}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          {/* Signed out (the open shelf): a way in. Reads the session, so it streams in. */}
          <Suspense fallback={null}>
            <SignInButton />
          </Suspense>
        </header>
      </div>
      <main className="mx-auto w-full max-w-[1100px] flex-1 px-5 pt-8 pb-12 sm:px-8 sm:pt-12">{children}</main>
      {/* pb-28 on phones clears the fixed tab bar below. */}
      <footer className="on-dark mt-8 bg-ink text-cream">
        <div className="mx-auto flex w-full max-w-[1100px] flex-wrap items-center justify-between gap-4 px-5 pt-8 pb-28 sm:px-8 sm:pb-10">
          <div className="flex flex-wrap">
            <Link href="/feedback" className="box lbl border-cream/60 text-cream no-underline">
              Send feedback
            </Link>
            <Link href="/report" className="box lbl -ml-px border-cream/60 text-cream no-underline">
              Report a problem
            </Link>
            <Link href="/privacy" className="box lbl -ml-px border-cream/60 text-cream no-underline">
              Privacy
            </Link>
          </div>
          <span className="flex items-center gap-2 text-mustard">
            <BayuMark className="h-5 w-5" />
            <span className="lbl text-cream-muted">Books that breeze through</span>
          </span>
        </div>
      </footer>
      <nav
        aria-label="App, tab bar"
        className="on-dark fixed inset-x-0 bottom-0 z-[45] grid grid-cols-5 bg-ink pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        {NAV.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            badge={badgeFor(item.href, true)}
            className="app-tab-phone lbl flex h-14 items-center justify-center text-cream"
          >
            {item.short}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

/** Only for a visitor who isn't signed in: the paper button on the ink bar. */
async function SignInButton() {
  const { supabase, user } = await getSessionUser();
  if (!supabase || user) return null;
  return <SignInLink />;
}
