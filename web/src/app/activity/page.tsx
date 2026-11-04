import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { FirstSteps } from "@/components/app/first-steps";
import { EmptyState } from "@/components/app/empty-state";
import { Suspense } from "react";
import { AppShell, APP_VIEWPORT } from "@/components/app/app-shell";
import { requireUser } from "@/lib/supabase/user";
import { RequestActions, type Op } from "./request-actions";
import { RateHandover } from "./rate-handover";
import { Announcer } from "./announcer";
import { MeetupCard, type Meetup } from "./meetup-card";
import { ExtensionCard } from "./extension-card";
import { canExtend, extensionView, type Ask, type ExtensionView } from "@/lib/activity/extension";
import { lendDays } from "@/lib/books/lend";
import { formatSeoul, isPast, seoulPickerMax, seoulPickerMin } from "@/lib/activity/meetup-time";
import { ownerLine, ownerOps, requesterLine, requesterOps, seoulToday, STATUS_WORDS, type Row } from "@/lib/activity/steps";

export const metadata: Metadata = { title: "Activity" };
export const viewport: Viewport = APP_VIEWPORT;

const OPEN = ["requested", "accepted", "on_loan"];

export default function ActivityPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-12">
        <h1 className="page-title">Activity</h1>
        <Suspense fallback={null}>
          <FirstSteps />
        </Suspense>
        <Announcer>
          <Suspense fallback={<p className="text-ink/70">Checking your requests…</p>}>
            <Requests />
          </Suspense>
        </Announcer>
      </div>
    </AppShell>
  );
}

async function Requests() {
  const { supabase, user } = await requireUser("/activity");
  const columns =
    "id, mode, status, return_by, owner_id, requester_id, owner_handed_over, requester_received, owner_got_back, requester_returned, updated_at, copy:copies(id, status, lend_max, books(title)), owner:profiles!requests_owner_id_fkey(display_name), requester:profiles!requests_requester_id_fkey(display_name)";
  const mineOnly = `owner_id.eq.${user.id},requester_id.eq.${user.id}`;
  // Open requests are never cut off (a long loan must always show its return
  // button); only the history is limited.
  const [open, past] = await Promise.all([
    supabase.from("requests").select(columns).or(mineOnly).in("status", OPEN).order("updated_at", { ascending: false }),
    supabase
      .from("requests")
      .select(columns)
      .or(mineOnly)
      .not("status", "in", `(${OPEN.join(",")})`)
      .order("updated_at", { ascending: false })
      .limit(10),
  ]);
  if (open.error || past.error) {
    return (
      <p role="alert" className="text-[17px] text-vermilion">
        Couldn&apos;t load your requests just now. Refresh to try again.
      </p>
    );
  }
  // Shape set by the select above (not generated types yet).
  const openRows = (open.data ?? []) as unknown as Row[];
  // The live meet-up card for each open request.
  const meetupIds = openRows.filter((r) => r.status !== "requested").map((r) => r.id);
  const { data: meetupRows, error: meetupError } = meetupIds.length
    ? await supabase
        .from("meetups")
        .select("id, request_id, purpose, proposed_by, place, meet_at, note, status")
        .in("request_id", meetupIds)
        .in("status", ["proposed", "agreed"])
    : { data: [], error: null };
  type MeetupRow = Omit<Meetup, "when" | "expired"> & { request_id: string; purpose: "handover" | "return"; meet_at: string };
  // A card counts only for the step it was made for (an agreed handover card is not the return card).
  const meetups = new Map(
    ((meetupRows ?? []) as MeetupRow[])
      .filter((m) => {
        const row = openRows.find((r) => r.id === m.request_id);
        return row && m.purpose === (row.status === "accepted" ? "handover" : "return");
      })
      .map((m) => [m.request_id, { ...m, when: formatSeoul(m.meet_at), expired: isPast(m.meet_at) }]),
  );
  // "More time" asks on loans (borrower asks, lender decides).
  const loanIds = openRows.filter(canExtend).map((r) => r.id);
  const [{ data: askRows, error: askError }, { data: flexibleDays, error: flexibleError }] = loanIds.length
    ? await Promise.all([
        supabase.from("loan_extensions").select("id, request_id, new_return_by, status, created_at").in("request_id", loanIds),
        supabase.rpc("setting", { p_key: "max_flexible_lend_days" }),
      ])
    : [{ data: [], error: null }, { data: null, error: null }];
  // The database enforces the real limit; this only sizes the date picker.
  if (flexibleError) console.error("activity: max_flexible_lend_days", flexibleError.code);
  const asksFor = (id: string) => ((askRows ?? []) as (Ask & { request_id: string })[]).filter((a) => a.request_id === id);
  const pastRows = (past.data ?? []) as unknown as Row[];
  // My ratings for finished handovers (a thumbs up or down, once each).
  const changedHands = pastRows.filter((r) => ["handed_over", "returned", "forfeited"].includes(r.status)).map((r) => r.id);
  const { data: ratingRows } = changedHands.length
    ? await supabase.from("handover_ratings").select("request_id, thumbs_up").in("request_id", changedHands).eq("rater_id", user.id)
    : { data: [] };
  const myRatings = new Map<string, boolean>(((ratingRows ?? []) as { request_id: string; thumbs_up: boolean }[]).map((x) => [x.request_id, x.thumbs_up]));
  const today = seoulToday();
  const minAt = seoulPickerMin();
  const maxAt = seoulPickerMax();
  const incoming = openRows.filter((r) => r.owner_id === user.id);
  const outgoing = openRows.filter((r) => r.requester_id === user.id);
  const moreTime = (r: Row, other: string): ExtensionView | "unavailable" =>
    askError && canExtend(r) ? "unavailable" : extensionView(r, asksFor(r.id), { me: user.id, today, maxDays: lendDays(r.copy?.lend_max, Number(flexibleDays ?? 183)), other });
  // Copies already promised to someone (or not on the shelf): their other requests can't be accepted.
  const busy = new Set(
    incoming.filter((r) => r.status !== "requested" || (r.copy && r.copy.status !== "available")).map((r) => r.copy?.id),
  );

  const { data: wishedData } = await supabase.rpc("wished_and_available");
  const wished = (wishedData ?? []) as { copy_id: string; title: string; mode: "give" | "lend"; owner_name: string; area: string }[];

  return (
    <div className="flex flex-col gap-14">
      {wished.length > 0 ? (
        <section aria-labelledby="wished-heading" className="flex flex-col gap-4 border border-cobalt p-5">
          <h2 id="wished-heading" className="font-display text-[24px] leading-[1.15] text-cobalt">
            From your wishlist, on the shelf now
          </h2>
          <ul className="flex flex-col gap-2 text-[17px]">
            {wished.map((w) => (
              <li key={w.copy_id}>
                <Link href={`/browse/${w.copy_id}`} className="font-semibold underline underline-offset-4">
                  {w.title}
                </Link>{" "}
                <span className="text-ink/80">
                  · {w.mode === "give" ? "to give" : "to lend"} · {w.owner_name}, {w.area}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <Section title="Asked of you" empty={<EmptyState>Nobody has asked for your books yet. When someone does, you&apos;ll accept or decline here.</EmptyState>}>
        {incoming.map((r) => (
          <Item
            key={r.id}
            row={r}
            who={r.requester?.display_name ?? "A reader"}
            line={ownerLine(r, { today, copyBusy: busy.has(r.copy?.id) })}
            ops={ownerOps(r, { today, copyBusy: busy.has(r.copy?.id) })}
            meetup={{ me: user.id, card: meetups.get(r.id) ?? null, minAt, maxAt, unavailable: Boolean(meetupError) }}
            extension={moreTime(r, r.requester?.display_name ?? "the reader")}
          />
        ))}
      </Section>
      <Section
        title="Your requests"
        empty={<EmptyState action={{ href: "/browse", label: "Browse the shelf" }}>You haven&apos;t asked for any books yet. Pick a book someone is giving or lending, and your request shows up here.</EmptyState>}
      >
        {outgoing.map((r) => (
          <Item key={r.id} row={r} who={r.owner?.display_name ?? "A reader"} line={requesterLine(r, today)} ops={requesterOps(r, today)} meetup={{ me: user.id, card: meetups.get(r.id) ?? null, minAt, maxAt, unavailable: Boolean(meetupError) }} extension={moreTime(r, r.owner?.display_name ?? "the owner")} />
        ))}
      </Section>
      {pastRows.length > 0 ? (
        <Section title="Earlier" empty="">
          {pastRows.map((r) => (
            <Item
              key={r.id}
              row={r}
              who={(r.owner_id === user.id ? r.requester : r.owner)?.display_name ?? "A reader"}
              line={STATUS_WORDS[r.status]}
              ops={[]}
              after={
                ["handed_over", "returned", "forfeited"].includes(r.status) ? (
                  <RateHandover
                    request={r.id}
                    title={r.copy?.books?.title ?? "A book"}
                    other={(r.owner_id === user.id ? r.requester : r.owner)?.display_name ?? "the other reader"}
                    rated={myRatings.get(r.id) ?? null}
                  />
                ) : null
              }
            />
          ))}
        </Section>
      ) : null}
    </div>
  );
}

function Section({ title, empty, children }: { title: string; empty: React.ReactNode; children: React.ReactNode[] }) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="section-title">{title}</h2>
      {children.length === 0 ? (
        typeof empty === "string" ? <p className="text-[17px] text-ink/80">{empty}</p> : empty
      ) : (
        <ul className="flex flex-col gap-4">{children}</ul>
      )}
    </section>
  );
}

function Item({
  row,
  who,
  line,
  ops,
  meetup,
  extension,
  after,
}: {
  row: Row;
  who: string;
  line: string;
  ops: Op[];
  meetup?: { me: string; card: Meetup | null; minAt: string; maxAt: string; unavailable: boolean };
  extension?: ExtensionView | "unavailable";
  after?: React.ReactNode;
}) {
  const title = row.copy?.books?.title ?? "A book";
  return (
    <li className="flex flex-col gap-3 card p-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-1">
        <p className="font-display text-[22px] leading-[1.15]">
          {row.copy ? (
            <Link href={`/browse/${row.copy.id}`} className="no-underline hover:underline">
              {title}
            </Link>
          ) : (
            title
          )}
        </p>
        <p className="text-[15px] text-ink/80">
          {row.mode === "give" ? "Give" : "Lend"} · {who}
        </p>
        <p className="text-[15px] text-ink">{line}</p>
      </div>
      <div className="flex flex-col gap-4 sm:max-w-[26rem]">
        <RequestActions request={row.id} title={title} ops={ops} />
        {meetup?.unavailable ? (
          <p className="text-[15px] text-ink/70">Couldn&apos;t load the meet-up just now. Refresh to try again.</p>
        ) : meetup &&
          ((row.status === "accepted" && !(row.mode === "lend" && row.return_by !== null && row.return_by <= seoulToday())) ||
            (row.status === "on_loan" && !row.owner_got_back && !row.requester_returned)) ? (
          <MeetupCard
            key={meetup.card?.id ?? "none"}
            request={row.id}
            meetup={meetup.card}
            me={meetup.me}
            other={who}
            title={title}
            purpose={row.status === "accepted" ? "handover" : "return"}
            minAt={meetup.minAt}
            maxAt={meetup.maxAt}
          />
        ) : null}
        {extension === "unavailable" ? (
          <p className="text-[15px] text-ink/70">Couldn&apos;t load &ldquo;more time&rdquo; just now. Refresh to try again.</p>
        ) : extension && extension.kind !== "none" ? (
          <ExtensionCard
            key={(extension.kind === "borrower" ? extension.waiting?.id : extension.open?.id) ?? "none"}
            request={row.id}
            title={title}
            other={who}
            view={extension}
          />
        ) : null}
        {after ?? (
          // Rows with a rating card already link to the report page from there.
          <Link href={`/report?request=${row.id}`} className="self-start text-[15px] text-ink/80 underline underline-offset-4">
            Report a problem<span className="sr-only"> with {title}</span>
          </Link>
        )}
      </div>
    </li>
  );
}
