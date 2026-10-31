import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AppShell, APP_VIEWPORT } from "@/components/app/app-shell";
import { SpineRow } from "@/components/app/spine-row";
import { requireUser } from "@/lib/supabase/user";
import { dressCopy } from "@/lib/shelf/dress";
import { inputClass } from "@/components/app/field";

export const metadata: Metadata = { title: "Browse the shelf" };
export const viewport: Viewport = APP_VIEWPORT;

type SearchRow = {
  copy_id: string;
  isbn: string;
  title: string;
  authors: string[] | null;
  mode: "give" | "lend";
  lend_max: "2_weeks" | "4_weeks" | "2_months" | "flexible" | null;
  note: string | null;
  owner_id: string;
  owner_name: string;
  area: string;
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default function BrowsePage({ searchParams }: PageProps<"/browse">) {
  return (
    <AppShell>
      <div className="flex flex-col gap-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.04] font-medium tracking-[-0.02em]">
            The Ansan shelf.
          </h1>
          <Link href="/wishlist" className="text-[17px] font-semibold text-paper underline underline-offset-4">
            ☆ Your wishlist
          </Link>
        </div>
        <Suspense fallback={<p className="text-paper/70">Reading the shelf…</p>}>
          <Results searchParams={searchParams} />
        </Suspense>
      </div>
    </AppShell>
  );
}

async function Results({ searchParams }: Pick<PageProps<"/browse">, "searchParams">) {
  const params = await searchParams;
  const q = first(params.q).trim().slice(0, 100);
  const modeParam = first(params.mode);
  const mode = modeParam === "give" || modeParam === "lend" ? modeParam : null;
  const wishOnly = modeParam === "wish";
  const { supabase, user } = await requireUser("/browse");

  const { data, error } = await supabase.rpc("search_shelf", { p_query: q || null, p_mode: mode });
  let rows = (data ?? []) as SearchRow[];
  if (wishOnly) {
    const { data: wishes } = await supabase.from("wishlist").select("isbn");
    const wanted = new Set(((wishes ?? []) as { isbn: string }[]).map((w) => w.isbn));
    rows = rows.filter((r) => wanted.has(r.isbn));
  }

  return (
    <div className="flex flex-col gap-10">
      {/* A plain GET form: works without JavaScript and keeps the search in the URL. */}
      <form method="get" role="search" className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-[14rem] flex-1 flex-col gap-2">
          <label htmlFor="q" className="text-[15px] font-semibold">
            Title or author
          </label>
          <input id="q" name="q" defaultValue={q} maxLength={100} className={inputClass} placeholder="Murakami, Circe…" />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="mode" className="text-[15px] font-semibold">
            Show
          </label>
          <select id="mode" name="mode" defaultValue={wishOnly ? "wish" : (mode ?? "")} className={`${inputClass} w-auto`}>
            <option value="">All books</option>
            <option value="give">To give</option>
            <option value="lend">To lend</option>
            <option value="wish">On my wishlist</option>
          </select>
        </div>
        <button type="submit" className="h-13 rounded-full bg-paper px-6 text-[17px] font-semibold text-malam">
          Search
        </button>
      </form>

      {error ? (
        <p role="alert" className="text-[17px] text-merah-light">
          Couldn&apos;t read the shelf just now. Try again in a moment.
        </p>
      ) : rows.length === 0 ? (
        <p className="text-[17px] text-paper/80">
          {wishOnly ? (
            <>
              None of your wishlist books are on the shelf yet. <Link href="/wishlist" className="underline underline-offset-4">See your wishlist</Link>.
            </>
          ) : q || mode ? (
            "Nothing matches yet. Try another search."
          ) : (
            "The shelf is empty so far. Add the first book!"
          )}
        </p>
      ) : (
        <>
          <p className="text-[15px] text-paper/70">
            {rows.length} {rows.length === 1 ? "book" : "books"}
          </p>
          <ul className="flex flex-col gap-5">
            {rows.map((r) => (
              <SpineRow
                key={r.copy_id}
                href={`/browse/${r.copy_id}`}
                owner={r.owner_name}
                mine={r.owner_id === user.id}
                copy={dressCopy(r)}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
