import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AppShell, APP_VIEWPORT } from "@/components/app/app-shell";
import { InkPoster } from "@/components/turning-shelf/ink-poster";
import { Rise } from "@/components/motion/rise";
import { requireUser } from "@/lib/supabase/user";
import { dressCopy } from "@/lib/shelf/dress";
import { CONDITIONS } from "@/lib/books/validate";
import { RequestForm } from "./request-form";
import { WishButton } from "../../wishlist/wish-button";
import { seoulDate } from "@/lib/dates";
import { lendDays, type LendMax } from "@/lib/books/lend";

export const metadata: Metadata = { title: "A book on the shelf" };
export const viewport: Viewport = APP_VIEWPORT;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type CopyRow = {
  id: string;
  isbn: string;
  mode: "give" | "lend";
  lend_max: LendMax | null;
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
      <Link href="/browse" className="box lbl text-ink no-underline">
        Back to the shelf
      </Link>
      <Suspense fallback={<p className="mt-10 text-muted">Taking it off the shelf…</p>}>
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

  const [{ count: copies }, { data: mine }, { data: flexibleDays }, { data: smooth }] = await Promise.all([
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
    supabase.rpc("smooth_handovers", { p_user: copy.owner_id }),
  ]);
  const smoothCount = Number(smooth ?? 0);
  const [{ data: wishCount }, { data: myWish }] = await Promise.all([
    supabase.rpc("wish_count", { p_isbn: copy.isbn }),
    supabase.from("wishlist").select("isbn").eq("isbn", copy.isbn).eq("user_id", user.id).maybeSingle(),
  ]);
  const wanted = Number(wishCount ?? 0);
  const lendFor = lendDays(copy.lend_max, Number(flexibleDays ?? 183));

  const look = {
    ...dressCopy({
      copy_id: copy.id,
      isbn: copy.isbn,
      title: copy.books.title,
      authors: copy.books.authors,
      mode: copy.mode,
      lend_max: copy.lend_max,
      area: copy.profiles.area,
    }),
    note: copy.note ?? "",
  };
  const isMine = copy.owner_id === user.id;
  const myRequest = (mine?.[0] ?? null) as { id: string; status: string } | null;

  const facts = [copy.mode === "give" ? "To give" : "To lend", copy.mode === "give" ? "Yours to keep" : `Up to ${look.lendFor?.toLowerCase()}`, CONDITIONS[copy.condition]];

  return (
    <div className="mt-8 grid grid-cols-1 items-start gap-10 md:grid-cols-2 md:gap-[4vw]">
      <div className="flex justify-center md:order-2 md:sticky md:top-8">
        <InkPoster copy={look} delay={0.15} className="relative aspect-[2/3] h-[46svh] max-w-full md:h-[min(72vh,720px)]" />
      </div>

      <Rise className="flex max-w-[560px] flex-col gap-[18px] md:order-1 md:pt-6">
        <span className="mask">
          <span data-rise="" className="lbl block text-cobalt">
            {look.author}
          </span>
        </span>
        <h1 className="mask font-display text-[42px] leading-[1] font-normal tracking-[-0.025em] md:text-[clamp(44px,5vw,76px)]">
          <span data-rise="" className="block">
            {copy.books.title}
          </span>
        </h1>
        <span className="mask">
          <span data-rise="" className="flex flex-wrap">
            {facts.map((f) => (
              <span key={f} className="box lbl -ml-px first:ml-0">
                {f}
              </span>
            ))}
          </span>
        </span>
        <span className="mask">
          <span data-rise="" className="block text-[16px] leading-[1.5]">
            {isMine ? "Yours" : `From ${copy.profiles.display_name}`}, {copy.profiles.area}
            {smoothCount > 0 ? (
              <span className="block text-[14px] text-muted">
                {smoothCount === 1 ? "1 reader had a smooth handover with them" : `${smoothCount} readers had a smooth handover with them`}
              </span>
            ) : null}
          </span>
        </span>
        {copy.note ? (
          <figure className="mask">
            <span data-rise="" className="block border-l-2 border-cobalt pl-4">
              {/* Not "from <owner>": a given book keeps its note, so the owner may not be who wrote it. */}
              <figcaption className="lbl mb-2 text-muted">Warkah: the note that travels with this book</figcaption>
              <blockquote className="max-w-[42ch] font-display text-[19px] leading-[1.5] whitespace-pre-line italic">&ldquo;{copy.note}&rdquo;</blockquote>
            </span>
          </figure>
        ) : null}
        {wanted > 0 || (copies && copies > 1) ? (
          <span className="mask">
            <span data-rise="" className="block text-[14px] text-muted">
              {wanted > 0 ? (wanted === 1 ? "1 other reader wants this book. " : `${wanted} other readers want this book. `) : null}
              {copies && copies > 1 ? `${copies} copies of this book are on the shelf.` : null}
            </span>
          </span>
        ) : null}

        <div className="mt-2 flex flex-col gap-5 border-t border-ink/90 pt-6">
          {isMine ? (
            <p className="text-[16px] text-ink/80">This is your book. Requests for it appear in Activity.</p>
          ) : myRequest ? (
            <p role="status" className="card p-5 text-[16px] leading-[1.5]">
              {myRequest.status === "requested"
                ? "You've asked for this book. Waiting for the owner to answer."
                : myRequest.status === "accepted"
                  ? "The owner accepted. Agree where and when to meet, then confirm the handover in Activity."
                  : "You're borrowing this book."}
            </p>
          ) : copy.status !== "available" ? (
            <p className="text-[16px] text-ink/80">This book isn&apos;t available right now.</p>
          ) : (
            <RequestForm copyId={copy.id} mode={copy.mode} minDate={seoulDate(1)} maxDate={seoulDate(lendFor)} />
          )}
          {!isMine ? <WishButton isbn={copy.isbn} title={copy.books.title} wished={Boolean(myWish)} /> : null}
        </div>
      </Rise>
    </div>
  );
}
