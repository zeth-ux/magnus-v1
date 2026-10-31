import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { AppShell, APP_VIEWPORT } from "@/components/app/app-shell";
import { getProfile, requireUser } from "@/lib/supabase/user";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { ProfileForm } from "./profile-form";
import { toStamps, type LedgerRow } from "@/lib/card/history";

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
    <div className="flex flex-col gap-16">
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
    {profile ? (
      <Suspense fallback={<p className="text-paper/70">Reading your stamps…</p>}>
        <CardHistory />
      </Suspense>
    ) : null}
    </div>
  );
}

/** Every credit movement, as stamps on the card (newest first). */
async function CardHistory() {
  const { supabase } = await requireUser("/me");
  const { data, error } = await supabase
    .from("credit_ledger")
    .select("id, kind, delta, locked_delta, ref_id, created_at")
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) return <p className="text-[15px] text-paper/70">Couldn&apos;t load your history just now.</p>;
  const rows = (data ?? []) as LedgerRow[];
  if (rows.length === 0) return null;

  // Titles: a starter grant points at the copy; everything else at the request.
  const copyIds = rows.filter((r) => r.kind === "starter_grant").map((r) => r.ref_id);
  const requestIds = rows.filter((r) => r.kind !== "starter_grant").map((r) => r.ref_id);
  const [copies, requests] = await Promise.all([
    copyIds.length ? supabase.from("copies").select("id, books(title)").in("id", copyIds) : Promise.resolve({ data: [] }),
    requestIds.length ? supabase.from("requests").select("id, copy:copies(books(title))").in("id", requestIds) : Promise.resolve({ data: [] }),
  ]);
  const titles = new Map<string, string>();
  for (const c of (copies.data ?? []) as unknown as { id: string; books: { title: string } | null }[]) if (c.books) titles.set(c.id, c.books.title);
  for (const r of (requests.data ?? []) as unknown as { id: string; copy: { books: { title: string } | null } | null }[])
    if (r.copy?.books) titles.set(r.id, r.copy.books.title);

  const stamps = toStamps(rows, (r) => titles.get(r.ref_id) ?? null);
  const tone = { plus: "border-pandan text-pandan", minus: "border-merah text-merah", held: "border-kopi text-kopi" } as const;

  return (
    <section aria-labelledby="history-heading" className="rounded-[10px] bg-paper p-7 text-malam">
      <h2 id="history-heading" className="font-display text-xl font-semibold">
        Stamps on your card
      </h2>
      <ol className="mt-5 flex flex-col divide-y divide-malam/10">
        {stamps.map((s) => (
          <li key={s.id} className="flex items-center gap-4 py-3">
            <span className={`w-20 shrink-0 -rotate-3 rounded-[4px] border-2 px-2 py-1 text-center font-display text-[15px] font-semibold ${tone[s.tone]}`}>
              {s.amount}
            </span>
            <span className="min-w-0 flex-1 text-[15px]">{s.text}</span>
            <span className="shrink-0 text-[15px] text-muted">{s.date}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
