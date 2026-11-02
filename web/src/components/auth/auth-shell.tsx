import type { Viewport } from "next";
import Link from "next/link";
import { BayuMark } from "@/components/bayu-mark";
import { AuthBooks } from "./auth-books";

/** Paper-coloured browser chrome for the sign-in pages. */
export const AUTH_VIEWPORT: Viewport = { themeColor: "#edebe6", colorScheme: "light" };

/**
 * The frame for sign-in and the first signed-in page: a still from the
 * landing shelf on one side and the step you're on beside it.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-paper text-ink">
      <header className="mx-auto flex w-full max-w-[1200px] items-center px-6 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2 text-cobalt no-underline" aria-label="Bayu, home">
          <BayuMark className="h-7 w-7" />
          <span className="font-display text-[21px] font-medium">Bayu</span>
        </Link>
      </header>
      <main className="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-12 px-6 pt-6 pb-20 sm:px-8 lg:min-h-[calc(100svh-84px)] lg:grid-cols-12 lg:gap-8 lg:pt-0">
        <div className="lg:order-2 lg:col-span-5 lg:col-start-8">{children}</div>
        <div className="hidden lg:order-1 lg:col-span-6 lg:block">
          <AuthBooks />
        </div>
      </main>
    </div>
  );
}
