import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
      <Suspense fallback={<p className="text-paper/70">Opening your library card…</p>}>
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

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-[clamp(2.4rem,4vw,3.4rem)] leading-[1.02] font-medium tracking-[-0.02em]">
          You&apos;re in.
        </h1>
        <p className="text-[17px] leading-relaxed text-paper/80">
          Signed in as <strong className="text-paper">{email}</strong>. The shelf opens on{" "}
          <strong className="text-paper">9 November</strong>: that&apos;s when you can scan your first
          book and get your starter credit.
        </p>
      </div>
      {/* A library card, stamped with the day the shelf opens. */}
      <div className="relative rounded-[10px] bg-paper p-7 text-malam">
        <p className="font-display text-xl font-semibold">While you wait</p>
        <p className="mt-2 max-w-[30ch] text-[17px] leading-relaxed">
          Pick 3 to 5 English books you&apos;d give or lend, and think of a café or station near you
          that&apos;s easy for meet-ups.
        </p>
        <span
          aria-hidden="true"
          className="absolute -top-4 right-5 rotate-[8deg] rounded-[4px] border-[3px] border-merah bg-paper px-3 py-1 font-display text-[17px] font-semibold text-merah"
        >
          Opens 9 Nov
        </span>
      </div>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="text-[15px] font-semibold text-paper/80 underline underline-offset-4 hover:text-paper"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
