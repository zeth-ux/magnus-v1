import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AppShell, APP_VIEWPORT } from "@/components/app/app-shell";
import { requireUser } from "@/lib/supabase/user";
import { LEND_MAX, CONDITIONS } from "@/lib/books/validate";
import { pretty } from "@/lib/activity/steps";
import { CopyControls } from "./copy-controls";
import { Announcer } from "../activity/announcer";

export const metadata: Metadata = { title: "My shelf" };
export const viewport: Viewport = APP_VIEWPORT;

type MyCopy = {
  id: string;
  mode: "give" | "lend";
  lend_max: keyof typeof LEND_MAX | null;
  condition: keyof typeof CONDITIONS;
  note: string | null;
  status: "available" | "paused" | "on_loan" | "withdrawn";
  books: { title: string; authors: string[] | null } | null;
};

type Borrowed = {
  id: string;
  return_by: string | null;
  copy: { id: string; books: { title: string } | null } | null;
  owner: { display_name: string } | null;
};

const STATUS: Record<MyCopy["status"], string> = {
  available: "On the shelf",
  paused: "Paused",
  on_loan: "Lent out",
  withdrawn: "Taken off",
};

export default function ShelfPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.04] font-medium tracking-[-0.02em]">My shelf.</h1>
          <Link href="/add" className="rounded-full bg-paper px-6 py-3 text-[17px] font-semibold text-malam no-underline">
            Add a book
          </Link>
        </div>
        <Announcer>
          <Suspense fallback={<p className="text-paper/70">Dusting the shelf…</p>}>
            <Shelf />
          </Suspense>
        </Announcer>
      </div>
    </AppShell>
  );
}

async function Shelf() {
  const { supabase, user } = await requireUser("/shelf");
  const [mine, borrowing] = await Promise.all([
    supabase
      .from("copies")
      .select("id, mode, lend_max, condition, note, status, books(title, authors)")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("requests")
      .select("id, return_by, copy:copies(id, books(title)), owner:profiles!requests_owner_id_fkey(display_name)")
      .eq("requester_id", user.id)
      .eq("status", "on_loan")
      .order("return_by", { ascending: true }),
  ]);
  if (mine.error || borrowing.error) {
    return (
      <p role="alert" className="text-[17px] text-merah-light">
        Couldn&apos;t load your shelf just now. Refresh to try again.
      </p>
    );
  }
  const copies = (mine.data ?? []) as unknown as MyCopy[];
  const current = copies.filter((c) => c.status !== "withdrawn");
  const removed = copies.filter((c) => c.status === "withdrawn");
  const borrowed = (borrowing.data ?? []) as unknown as Borrowed[];

  return (
    <div className="flex flex-col gap-14">
      <section aria-labelledby="mine-heading" className="flex flex-col gap-5">
        <h2 id="mine-heading" className="font-display text-2xl font-semibold">
          Your books ({current.length})
        </h2>
        {current.length === 0 ? (
          <p className="text-[17px] text-paper/80">
            Nothing yet. <Link href="/add" className="underline underline-offset-4">Add your first book</Link> and get a starter credit.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {current.map((c) => {
              const title = c.books?.title ?? "A book";
              return (
                <li key={c.id} className="flex flex-col gap-3 rounded-[10px] bg-paper/[0.06] p-5 sm:flex-row sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <p className="font-display text-xl font-semibold">
                      <Link href={`/browse/${c.id}`} className="no-underline hover:underline">
                        {title}
                      </Link>
                    </p>
                    <p className="text-[15px] text-paper/80">
                      {c.mode === "give"
                        ? "To give"
                        : c.lend_max === "flexible" || !c.lend_max
                          ? "To lend · flexible period"
                          : `To lend · up to ${LEND_MAX[c.lend_max].toLowerCase()}`}{" "}
                      · {CONDITIONS[c.condition]}
                    </p>
                    <p className="text-[15px] font-semibold">{STATUS[c.status]}</p>
                  </div>
                  <div className="sm:max-w-[26rem]">
                    <CopyControls copy={{ id: c.id, title, mode: c.mode, lend_max: c.lend_max, condition: c.condition, note: c.note, status: c.status }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="borrowing-heading" className="flex flex-col gap-5">
        <h2 id="borrowing-heading" className="font-display text-2xl font-semibold">
          Borrowing ({borrowed.length})
        </h2>
        {borrowed.length === 0 ? (
          <p className="text-[17px] text-paper/80">
            You&apos;re not borrowing anything. <Link href="/browse" className="underline underline-offset-4">Browse the shelf</Link>.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {borrowed.map((b) => (
              <li key={b.id} className="flex flex-wrap items-baseline justify-between gap-2 rounded-[10px] bg-paper/[0.06] p-5">
                <span className="font-display text-xl font-semibold">{b.copy?.books?.title ?? "A book"}</span>
                <span className="text-[15px] text-paper/80">
                  From {b.owner?.display_name ?? "a reader"} · back by {b.return_by ? pretty(b.return_by) : "—"} ·{" "}
                  <Link href="/activity" className="underline underline-offset-4">
                    Activity
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {removed.length > 0 ? (
        <details className="group">
          <summary className="cursor-pointer text-[17px] font-semibold">Taken off the shelf ({removed.length})</summary>
          <ul className="mt-4 flex flex-col gap-2 text-[15px] text-paper/80">
            {removed.map((c) => (
              <li key={c.id}>{c.books?.title ?? "A book"}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
