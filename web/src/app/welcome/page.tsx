import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/user";
import { AUTH_VIEWPORT, AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "You're in" };
export const viewport: Viewport = AUTH_VIEWPORT;

/**
 * The first signed-in page. The static shell (logo, layout) renders instantly;
 * the part that reads the session streams in behind a Suspense boundary,
 * which Cache Components requires for anything that reads cookies.
 */
export default function WelcomePage() {
  return (
    <AuthShell>
      <Suspense
        fallback={<p className="text-ink/70">Opening your library card…</p>}
      >
        <Welcome />
      </Suspense>
    </AuthShell>
  );
}

async function Welcome() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login");

  // getUser() asks Supabase to confirm the session is still valid.
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/welcome");

  const email = data.user.email ?? "you";
  const profile = await getProfile(supabase, data.user.id);
  // Returning readers go to the shelf, not "your first book". The starter
  // credit is once per account (R5), so having it means they've listed before,
  // even if they've since given every book away.
  const { count: starter } = profile
    ? await supabase
        .from("credit_ledger")
        .select("id", { count: "exact", head: true })
        .eq("user_id", data.user.id)
        .eq("kind", "starter_grant")
    : { count: 0 };
  const returning = Boolean(profile && (starter ?? 0) > 0);
  const step = !profile
    ? { href: "/me?next=/add", label: "Make your library card" }
    : returning
      ? { href: "/browse", label: "Go to the shelf" }
      : { href: "/add", label: "Add your first book" };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h1 className="page-title">
          {returning ? "Welcome back." : "You're in."}
        </h1>
        <p className="text-[17px] leading-relaxed text-ink/80">
          Signed in as <strong className="text-ink">{email}</strong>. Put a
          few books on the shelf now; the pilot opens for requests on{" "}
          <strong className="text-ink">9 November</strong>.
        </p>
      </div>
      <Link
        href={step.href}
        className="btn-primary self-start"
      >
        {step.label}
      </Link>
      {/* A library card, stamped with the day the shelf opens (for readers still setting up). */}
      {returning ? null : (
        <div className="relative card p-7 text-ink">
          <p className="font-display text-[22px] leading-[1.15]">
            Before 9 November
          </p>
          <p className="mt-2 max-w-[30ch] text-[17px] leading-relaxed">
            List 3 to 5 English books you&apos;d give or lend, and think of a
            café or station near you that&apos;s easy for meet-ups. Your first
            book earns a starter credit.
          </p>
          <span
            aria-hidden="true"
            className="stamp absolute -top-4 right-5 bg-sheet"
          >
            Opens 9 Nov
          </span>
        </div>
      )}
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="text-[15px] font-semibold text-ink/80 underline underline-offset-4 hover:text-ink"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
