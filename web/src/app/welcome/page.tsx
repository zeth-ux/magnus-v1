import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BayuMark } from "@/components/bayu-mark";

export const metadata: Metadata = { title: "You're in" };

/**
 * The first signed-in page. The static shell (logo, layout) renders instantly;
 * the part that reads the session streams in behind a Suspense boundary,
 * which Cache Components requires for anything that reads cookies.
 */
export default function WelcomePage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-10 px-6 py-12">
      <Link href="/" className="flex items-center gap-2 self-start text-ink no-underline">
        <BayuMark className="h-8 w-8" />
        <span className="font-display text-2xl font-semibold">Bayu</span>
      </Link>
      <Suspense fallback={<p className="text-muted">Opening your library card…</p>}>
        <Welcome />
      </Suspense>
    </main>
  );
}

async function Welcome() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login");

  // getUser() asks Supabase to confirm the session is still valid.
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/welcome");

  const email = data.user.email ?? "you";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-4xl leading-tight font-medium">You&apos;re in.</h1>
        <p className="text-base leading-relaxed">
          Signed in as <strong>{email}</strong>. The shelf opens on <strong>9 November</strong>:
          that&apos;s when you can scan your first book and get your starter credit.
        </p>
      </div>
      <div className="rounded-md bg-kayu p-6 text-bone">
        <p className="font-display text-xl text-songket">While you wait</p>
        <p className="mt-2 leading-relaxed">
          Pick 3 to 5 English books you&apos;d give or lend, and think of a café or station near you
          that&apos;s easy for meet-ups.
        </p>
      </div>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="text-sm font-semibold text-muted underline underline-offset-4 hover:text-ink"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
