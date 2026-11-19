import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AppShell, APP_VIEWPORT } from "@/components/app/app-shell";
import { SpineRow } from "@/components/app/spine-row";
import { getSessionUser } from "@/lib/supabase/user";
import { SignInStrip } from "@/components/app/sign-in-strip";
import { dressCopy } from "@/lib/shelf/dress";
import { inputClass } from "@/components/app/field";
import { BrowseShelf } from "./browse-shelf";
import { FirstSteps } from "@/components/app/first-steps";
import { EmptyState } from "@/components/app/empty-state";

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

/** What a signed-out visitor sees of a listing (public_search_shelf): no owner, no note. */
type PublicRow = Omit<SearchRow, "note" | "owner_id" | "owner_name">;

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
        <Suspense fallback={null}>
          <FirstSteps />
        </Suspense>
        <Suspense fallback={<p className="text-muted">Reading the shelf…</p>}>
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
  const { supabase, user } = await getSessionUser();
  if (!supabase) {
    return <EmptyState action={{ href: "/", label: "Back to the start" }}>The shelf isn&apos;t set up yet. Try again soon.</EmptyState>;
  }

  // Signed out: the open shelf. Anyone can look; asking for a book needs an account.
  if (!user) {
    if (wishOnly) {
      return (
        <EmptyState action={{ href: `/login?next=${encodeURIComponent("/browse?mode=wish")}`, label: "Sign in" }} secondary={{ href: "/browse", label: "Show all books" }}>
          Sign in to see which books on your wishlist are on the shelf.
        </EmptyState>
      );
    }
    const { data, error } = await supabase.rpc("public_search_shelf", { p_query: q || null, p_mode: mode });
    // No signed-in reader will report this one, so make sure it reaches the logs.
    if (error) console.error("[browse] public_search_shelf", error.code);
    const rows = ((data ?? []) as PublicRow[]).map((r) => ({ ...r, note: null, owner_id: "", owner_name: "a reader" }));
    return <ResultList rows={rows} error={!!error} q={q} mode={mode} wishOnly={false} me={null} />;
  }

  // "On my wishlist" asks the database directly (not a filter over the newest 100 listings).
  const { data, error } = wishOnly
    ? await supabase.rpc("wished_and_available")
    : await supabase.rpc("search_shelf", { p_query: q || null, p_mode: mode });
  let rows = (data ?? []) as SearchRow[];
  if (wishOnly && q) {
    const needle = q.toLowerCase();
    rows = rows.filter((r) => `${r.title} ${(r.authors ?? []).join(" ")}`.toLowerCase().includes(needle));
  }
  return <ResultList rows={rows} error={!!error} q={q} mode={mode} wishOnly={wishOnly} me={user.id} />;
}

/** The shelf and the list. `me` is null for a signed-out visitor (no owners, and a sign-in strip). */
function ResultList({ rows, error, q, mode, wishOnly, me }: { rows: SearchRow[]; error: boolean; q: string; mode: "give" | "lend" | null; wishOnly: boolean; me: string | null }) {
  return (
    <div className="flex flex-col gap-10">
      {error || rows.length === 0 ? <SearchForm q={q} value={wishOnly ? "wish" : (mode ?? "")} /> : null}
      {error ? (
        <p role="alert" className="text-[17px] text-vermilion">
          Couldn&apos;t read the shelf just now. Try again in a moment.
        </p>
      ) : rows.length === 0 ? (
        wishOnly ? (
          <EmptyState action={{ href: "/wishlist", label: "See your wishlist" }}>
            {q ? <>None of your wishlist books matching &ldquo;{q}&rdquo; are on the shelf yet.</> : "None of your wishlist books are on the shelf yet."} They show up here, and in Activity, when someone adds one.
          </EmptyState>
        ) : q ? (
          <EmptyState action={{ href: "/browse", label: "Clear search" }} secondary={{ href: "/wishlist", label: "Add to wishlist by ISBN" }}>
            Nothing on the shelf matches &ldquo;{q}&rdquo; yet. Put it on your wishlist and it shows up in Activity when someone adds it.
          </EmptyState>
        ) : mode ? (
          <EmptyState action={{ href: "/browse", label: "Show all books" }}>Nothing {mode === "give" ? "to give" : "to lend"} on the shelf right now.</EmptyState>
        ) : (
          <EmptyState action={{ href: "/add", label: "Add a book" }}>The shelf is empty so far. Be the first to put a book on it.</EmptyState>
        )
      ) : (
        <>
          {/* Three or more books: the turning shelf first (gives, then lends), the full list below. */}
          {rows.length >= 3 ? (
            <BrowseShelf copies={[...rows.filter((r) => r.mode === "give"), ...rows.filter((r) => r.mode === "lend")].map((r) => shelfCopy(r, me))} />
          ) : null}
          {me ? null : <SignInStrip next="/browse" />}
          <SearchForm q={q} value={wishOnly ? "wish" : (mode ?? "")} />
          <div className="flex flex-col gap-2">
            <h2 className="lbl text-muted">
              {rows.length} {rows.length === 1 ? "book" : "books"}
            </h2>
            <ul className="border-t border-ink/90">
              {rows.map((r) => (
                <SpineRow key={r.copy_id} href={`/browse/${r.copy_id}`} owner={r.owner_name} mine={me !== null && r.owner_id === me} copy={shelfCopy(r, me)} />
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

/** A search row dressed for the shelf, with the owner's name (signed-in readers see who has it). */
function shelfCopy(r: SearchRow, me: string | null) {
  return { ...dressCopy(r), owner: me !== null && r.owner_id === me ? "You" : r.owner_name, note: r.note ?? "" };
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
