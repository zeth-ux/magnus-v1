import Link from "next/link";
import { BayuMark } from "@/components/bayu-mark";
import { AuthBooks } from "./auth-books";

/**
 * The frame for sign-in and the first signed-in page: the same night shelf as
 * the landing, a few books on one side and the step you're on beside them.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-malam min-h-svh bg-malam text-paper on-dark">
      <header className="mx-auto flex w-full max-w-[1200px] items-center px-6 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3 text-paper no-underline">
          <BayuMark className="h-8 w-8" />
          <span className="flex flex-col leading-tight">
            <span className="font-display text-[17px] font-semibold">Bayu</span>
            <span className="font-display text-[15px] italic opacity-80">Books that breeze through</span>
          </span>
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
