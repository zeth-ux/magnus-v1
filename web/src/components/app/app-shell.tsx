import type { Viewport } from "next";
import Link from "next/link";
import { BayuMark } from "@/components/bayu-mark";

export const APP_VIEWPORT: Viewport = { themeColor: "#1c1614", colorScheme: "dark" };

const NAV = [
  { href: "/add", label: "Add a book" },
  { href: "/me", label: "Me" },
];

/** The signed-in app frame: the night ground, the mark, and the main places. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-malam on-dark min-h-svh bg-malam text-paper">
      <header className="mx-auto flex w-full max-w-[1100px] items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3 text-paper no-underline">
          <BayuMark className="h-8 w-8" />
          <span className="font-display text-[17px] font-semibold">Bayu</span>
        </Link>
        <nav aria-label="App" className="flex items-center gap-5 text-[15px]">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-paper no-underline hover:underline">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-[1100px] px-5 pt-6 pb-24 sm:px-8">{children}</main>
    </div>
  );
}
