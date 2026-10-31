import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AppShell, APP_VIEWPORT } from "@/components/app/app-shell";
import { requireUser } from "@/lib/supabase/user";
import { AddWishForm } from "./add-wish-form";
import { WishButton } from "./wish-button";

export const metadata: Metadata = { title: "Your wishlist" };
export const viewport: Viewport = APP_VIEWPORT;

type Wish = { isbn: string; books: { title: string; authors: string[] | null } | null };
type Available = { copy_id: string; isbn: string; title: string; mode: "give" | "lend"; owner_name: string; area: string };

export default function WishlistPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.04] font-medium tracking-[-0.02em]">Your wishlist.</h1>
          <p className="max-w-[34rem] text-[17px] leading-relaxed text-paper/80">
            Books you&apos;d love to read. When someone puts one on the shelf, it shows up here and in Activity.
          </p>
        </div>
        <AddWishForm />
        <Suspense fallback={<p className="text-paper/70">Reading your wishlist…</p>}>
          <Wishes />
        </Suspense>
      </div>
    </AppShell>
  );
}

async function Wishes() {
  const { supabase } = await requireUser("/wishlist");
  const [wishes, available] = await Promise.all([
    supabase.from("wishlist").select("isbn, books(title, authors)").order("created_at", { ascending: false }),
    supabase.rpc("wished_and_available"),
  ]);
  if (wishes.error) {
    return (
      <p role="alert" className="text-[17px] text-merah-light">
        Couldn&apos;t load your wishlist just now. Refresh to try again.
      </p>
    );
  }
  const rows = (wishes.data ?? []) as unknown as Wish[];
  const onShelf = new Map<string, Available>();
  for (const a of (available.data ?? []) as Available[]) if (!onShelf.has(a.isbn)) onShelf.set(a.isbn, a);
  if (rows.length === 0) return <p className="text-[17px] text-paper/80">Nothing yet. Add a book above, or tap ☆ on any book page.</p>;

  return (
    <ul className="flex flex-col gap-4">
      {rows.map((w) => {
        const title = w.books?.title ?? "A book";
        const copy = onShelf.get(w.isbn);
        return (
          <li key={w.isbn} className="flex flex-col gap-3 rounded-[10px] bg-paper/[0.06] p-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className="font-display text-xl font-semibold">{title}</p>
              {w.books?.authors?.length ? <p className="text-[15px] text-paper/80">{w.books.authors.join(", ")}</p> : null}
              {copy ? (
                <p className="text-[15px] font-semibold text-songket">
                  On the shelf now: {copy.mode === "give" ? "to give" : "to lend"}, from {copy.owner_name} ·{" "}
                  <Link href={`/browse/${copy.copy_id}`} className="text-songket underline underline-offset-4">
                    See it
                  </Link>
                </p>
              ) : (
                <p className="text-[15px] text-paper/70">Not on the shelf yet.</p>
              )}
            </div>
            <WishButton isbn={w.isbn} title={title} wished />
          </li>
        );
      })}
    </ul>
  );
}
