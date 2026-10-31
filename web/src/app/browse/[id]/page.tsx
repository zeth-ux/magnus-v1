import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AppShell, APP_VIEWPORT } from "@/components/app/app-shell";
import { Book3D } from "@/components/shelf/book-3d";
import { requireUser } from "@/lib/supabase/user";
import { dressCopy } from "@/lib/shelf/dress";
import { CONDITIONS } from "@/lib/books/validate";
import { RequestForm } from "./request-form";
import { seoulDate } from "@/lib/dates";

export const metadata: Metadata = { title: "A book on the shelf" };
export const viewport: Viewport = APP_VIEWPORT;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Mirrors public.lend_max_days(); "flexible" reads the max_flexible_lend_days setting.
const LEND_DAYS = { "2_weeks": 14, "4_weeks": 28, "2_months": 61 } as const;

type CopyRow = {
  id: string;
  isbn: string;
  mode: "give" | "lend";
  lend_max: keyof typeof LEND_DAYS | "flexible" | null;
  condition: keyof typeof CONDITIONS;
  note: string | null;
  status: string;
  owner_id: string;
  books: { title: string; authors: string[] | null; published_year: number | null } | null;
  profiles: { display_name: string; area: string } | null;
};


export default function CopyPage({ params }: PageProps<"/browse/[id]">) {
  return (
    <AppShell>
      <Link href="/browse" className="text-[15px] text-paper/80 underline underline-offset-4">
        &larr; Back to the shelf
      </Link>
      <Suspense fallback={<p className="mt-10 text-paper/70">Taking it off the shelf…</p>}>
        <CopyDetail params={params} />
      </Suspense>
    </AppShell>
  );
}

async function CopyDetail({ params }: Pick<PageProps<"/browse/[id]">, "params">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase, user } = await requireUser(`/browse/${id}`);

  const { data, error } = await supabase
    .from("copies")
    .select(
      "id, isbn, mode, lend_max, condition, note, status, owner_id, books(title, authors, published_year), profiles!copies_owner_id_fkey(display_name, area)",
    )
    .eq("id", id)
    .maybeSingle();
  // A failure is not a missing book: let the error page offer a retry.
  if (error) throw new Error(`copy ${id} could not be loaded (${error.code})`);
  const copy = data as CopyRow | null;
  if (!copy || !copy.books || !copy.profiles) notFound();

  const [{ count: copies }, { data: mine }, { data: flexibleDays }] = await Promise.all([
    supabase.from("copies").select("id", { count: "exact", head: true }).eq("isbn", copy.isbn).eq("status", "available"),
    supabase
      .from("requests")
      .select("id, status")
      .eq("copy_id", copy.id)
      .eq("requester_id", user.id)
      .in("status", ["requested", "accepted", "on_loan"])
      .order("created_at", { ascending: false })
      .limit(1),
    supabase.rpc("setting", { p_key: "max_flexible_lend_days" }),
  ]);
  const lendDays = copy.lend_max === "flexible" || copy.lend_max === null ? Number(flexibleDays ?? 183) : LEND_DAYS[copy.lend_max];

  const look = dressCopy({
    copy_id: copy.id,
    isbn: copy.isbn,
    title: copy.books.title,
    authors: copy.books.authors,
    mode: copy.mode,
    lend_max: copy.lend_max,
    area: copy.profiles.area,
  });
  const isMine = copy.owner_id === user.id;
  const myRequest = (mine?.[0] ?? null) as { id: string; status: string } | null;

  return (
    <div className="mt-10 grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-6">
      <div aria-hidden="true" className="flex min-h-[36svh] items-center justify-center [perspective:1400px] lg:col-span-6">
        <div style={{ transformStyle: "preserve-3d", transform: "rotateX(-62deg) rotateZ(-11deg) rotateY(6deg)" }}>
          <Book3D copy={look} size="min(520px, 74vw)" className="[--k:0.8] lg:[--k:1.1]" />
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-6">
        <h1 className="font-display text-[clamp(2.2rem,4vw,3.4rem)] leading-[1.04] font-semibold tracking-[-0.02em]">
          {copy.books.title}
        </h1>
        <p className="font-display text-xl italic">{look.author}</p>
        <dl className="grid grid-cols-2 gap-4 border-y border-paper/30 py-5 text-[15px] sm:grid-cols-3">
          <div>
            <dt className="text-paper/70">{copy.mode === "give" ? "To give" : "To lend"}</dt>
            <dd className="text-[17px] font-semibold">{copy.mode === "give" ? "Yours to keep" : `Up to ${look.lendFor?.toLowerCase()}`}</dd>
          </div>
          <div>
            <dt className="text-paper/70">From</dt>
            <dd className="text-[17px] font-semibold">
              {isMine ? "You" : copy.profiles.display_name}, {copy.profiles.area}
            </dd>
          </div>
          <div>
            <dt className="text-paper/70">Condition</dt>
            <dd className="text-[17px] font-semibold">{CONDITIONS[copy.condition]}</dd>
          </div>
        </dl>
        {copy.note ? (
          <figure className="flex flex-col gap-2">
            <figcaption className="text-[15px] font-semibold text-paper/80">
              {isMine ? "Your warkah" : `Warkah from ${copy.profiles.display_name}`}
            </figcaption>
            <blockquote className="font-display text-[clamp(1.2rem,1.8vw,1.5rem)] leading-snug whitespace-pre-line italic">
              &ldquo;{copy.note}&rdquo;
            </blockquote>
          </figure>
        ) : null}
        {copies && copies > 1 ? (
          <p className="text-[15px] text-paper/80">{copies} copies of this book are on the shelf.</p>
        ) : null}

        {isMine ? (
          <p className="text-[17px] text-paper/80">This is your book. Requests for it appear in Activity.</p>
        ) : myRequest ? (
          <p role="status" className="rounded-[10px] bg-paper p-6 text-[17px] text-malam">
            {myRequest.status === "requested"
              ? "You've asked for this book. Waiting for the owner to answer."
              : myRequest.status === "accepted"
                ? "The owner accepted. Agree where and when to meet, then confirm the handover in Activity."
                : "You're borrowing this book."}
          </p>
        ) : copy.status !== "available" ? (
          <p className="text-[17px] text-paper/80">This book isn&apos;t available right now.</p>
        ) : (
          <RequestForm
            copyId={copy.id}
            mode={copy.mode}
            minDate={seoulDate(1)}
            maxDate={seoulDate(lendDays)}
          />
        )}
      </div>
    </div>
  );
}
