import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AppShell, APP_VIEWPORT } from "@/components/app/app-shell";
import { SpineRow } from "@/components/app/spine-row";
import { requireUser } from "@/lib/supabase/user";
import { dressCopy } from "@/lib/shelf/dress";
import { inputClass } from "@/components/app/field";
import { BrowseShelf } from "./browse-shelf";

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
          <h1 className="page-title">
            The Ansan shelf
          </h1>
          <Link href="/wishlist" className="box lbl text-ink no-underline">
            Your wishlist
          </Link>
        </div>
        <Suspense fallback={<p className="text-ink/70">Reading the shelf…</p>}>
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

  // "On my wishlist" asks the database directly (not a filter over the newest 100 listings).
  const { data, error } = wishOnly
    ? await supabase.rpc("wished_and_available")
    : await supabase.rpc("search_shelf", { p_query: q || null, p_mode: mode });
  let rows = (data ?? []) as SearchRow[];
  if (wishOnly && q) {
    const needle = q.toLowerCase();
    rows = rows.filter((r) => `${r.title} ${(r.authors ?? []).join(" ")}`.toLowerCase().includes(needle));
  }

  return (
    <div className="flex flex-col gap-10">
      {error || rows.length === 0 ? <SearchForm q={q} value={wishOnly ? "wish" : (mode ?? "")} /> : null}
      {error ? (
        <p role="alert" className="text-[17px] text-vermilion">
          Couldn&apos;t read the shelf just now. Try again in a moment.
        </p>
      ) : rows.length === 0 ? (
        <p className="text-[17px] text-ink/80">
          {wishOnly && !q ? (
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
          {/* Three or more books: the turning shelf first (gives, then lends), the full list below. */}
          {rows.length >= 3 ? (
            <BrowseShelf copies={[...rows.filter((r) => r.mode === "give"), ...rows.filter((r) => r.mode === "lend")].map((r) => shelfCopy(r, user.id))} />
          ) : null}
          <SearchForm q={q} value={wishOnly ? "wish" : (mode ?? "")} />
          <div className="flex flex-col gap-2">
            <h2 className="lbl text-muted">
              {rows.length} {rows.length === 1 ? "book" : "books"}
            </h2>
            <ul className="border-t border-ink/90">
              {rows.map((r) => (
                <SpineRow key={r.copy_id} href={`/browse/${r.copy_id}`} owner={r.owner_name} mine={r.owner_id === user.id} copy={shelfCopy(r, user.id)} />
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

/** A search row dressed for the shelf, with the owner's name (signed-in readers see who has it). */
function shelfCopy(r: SearchRow, me: string) {
  return { ...dressCopy(r), owner: r.owner_id === me ? "You" : r.owner_name, note: r.note ?? "" };
}

/** A plain GET form: works without JavaScript and keeps the search in the URL. */
function SearchForm({ q, value }: { q: string; value: string }) {
  return (
    <form method="get" role="search" className="flex flex-wrap items-end gap-3 border-y border-ink/90 py-5">
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
        <select id="mode" name="mode" defaultValue={value} className={`${inputClass} w-auto`}>
          <option value="">All books</option>
          <option value="give">To give</option>
          <option value="lend">To lend</option>
          <option value="wish">On my wishlist</option>
        </select>
      </div>
      <button type="submit" className="btn-primary">
        Search
      </button>
    </form>
  );
}
