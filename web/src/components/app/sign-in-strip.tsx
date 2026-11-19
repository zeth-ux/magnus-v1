import Link from "next/link";

/**
 * For signed-out visitors on the open shelf: anyone can look, and this says
 * what an account is for. Signing in brings them back to `next`.
 */
export function SignInStrip({ next }: { next: string }) {
  return (
    <aside aria-label="Sign in" className="card flex flex-wrap items-center justify-between gap-4 bg-sheet px-5 py-4">
      <p className="text-[16px] leading-relaxed">
        <strong className="font-semibold">Want one of these books?</strong> Sign in to ask its owner. No password: we email you a code.
      </p>
      <Link href={`/login?next=${encodeURIComponent(next)}`} className="btn-primary !min-h-11 shrink-0">
        Sign in
      </Link>
    </aside>
  );
}
