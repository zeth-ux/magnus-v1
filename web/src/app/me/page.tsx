import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { AppShell, APP_VIEWPORT } from "@/components/app/app-shell";
import { getProfile, requireUser } from "@/lib/supabase/user";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { ProfileForm } from "./profile-form";
import { UnblockButton } from "./unblock-button";

export const metadata: Metadata = { title: "Your profile" };
export const viewport: Viewport = APP_VIEWPORT;

export default function MePage({ searchParams }: PageProps<"/me">) {
  return (
    <AppShell>
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.04] font-medium tracking-[-0.02em]">
            Your library card.
          </h1>
          <p className="max-w-[32rem] text-[17px] leading-relaxed text-paper/80">
            Tell other readers who you are and roughly where you are in Ansan.
          </p>
        </div>
        <Suspense fallback={<p className="text-paper/70">Opening your card…</p>}>
          <Profile searchParams={searchParams} />
        </Suspense>
        <Suspense fallback={null}>
          <Blocked />
        </Suspense>
      </div>
    </AppShell>
  );
}

async function Profile({ searchParams }: Pick<PageProps<"/me">, "searchParams">) {
  const params = await searchParams;
  const nextRaw = Array.isArray(params.next) ? params.next[0] : params.next;
  const next = safeRedirectPath(nextRaw);
  const { supabase, user } = await requireUser("/me");
  const profile = await getProfile(supabase, user.id);
  const { data: contact } = await supabase.from("profile_contacts").select("whatsapp").eq("id", user.id).maybeSingle();
  const { data: credits, error: creditsError } = await supabase
    .rpc("my_credits")
    .maybeSingle<{ balance: number; locked: number; available: number }>();

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <ProfileForm
          next={next}
          initial={{
            displayName: profile?.display_name ?? "",
            area: profile?.area ?? "",
            whatsapp: (contact as { whatsapp: string | null } | null)?.whatsapp ?? "",
          }}
        />
      </div>
      {profile ? (
        <aside aria-label="Your credits" className="h-fit rounded-[10px] bg-paper p-7 text-malam lg:col-span-4 lg:col-start-9">
          <p className="font-display text-xl font-semibold">Credits</p>
          {creditsError ? (
            <p className="mt-4 text-[15px]">Couldn&apos;t load your credits just now. Refresh to try again.</p>
          ) : (
          <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
            {(
              [
                ["Available", credits?.available ?? 0],
                ["Held", credits?.locked ?? 0],
                ["Total", credits?.balance ?? 0],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex flex-col">
                <dt className="order-2 mt-1 text-[15px]">{label}</dt>
                <dd className="order-1 font-display text-[2.2rem] leading-none font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          )}
          <p className="mt-5 text-[15px] leading-relaxed">
            Give a book: +1. Take one: −1. Borrowing holds 1 until the book is back. Your first listed book earns a starter credit.
          </p>
        </aside>
      ) : null}
    </div>
  );
}

/** Readers you've blocked (only shown when there are any), with a way to undo it. */
async function Blocked() {
  const { supabase, user } = await requireUser("/me");
  const { data, error } = await supabase
    .from("blocks")
    .select("blocked_id, profiles!blocks_blocked_id_fkey(display_name)")
    .eq("blocker_id", user.id)
    .order("created_at", { ascending: false });
  if (error || !data || data.length === 0) return null;
  const rows = data as unknown as { blocked_id: string; profiles: { display_name: string } | null }[];
  return (
    <section className="flex max-w-[34rem] flex-col gap-4">
      <h2 className="font-display text-2xl font-semibold">Readers you&apos;ve blocked</h2>
      <p className="text-[15px] text-paper/80">You can&apos;t ask each other for books. They aren&apos;t told.</p>
      <ul className="flex flex-col gap-3">
        {rows.map((r) => {
          const name = r.profiles?.display_name ?? "A reader";
          return (
            <li key={r.blocked_id} className="flex items-center justify-between gap-4 rounded-[10px] bg-paper/[0.06] px-5 py-3">
              <span className="text-[17px]">{name}</span>
              <UnblockButton reader={r.blocked_id} name={name} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
