import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AppShell, APP_VIEWPORT } from "@/components/app/app-shell";
import { requireUser } from "@/lib/supabase/user";
import { RequestActions, type Op } from "./request-actions";
import { Announcer } from "./announcer";
import { MeetupCard, type Meetup } from "./meetup-card";
import { seoulPickerMin } from "@/lib/activity/meetup-time";
import { ownerLine, ownerOps, requesterLine, requesterOps, seoulToday, STATUS_WORDS, type Row } from "@/lib/activity/steps";

export const metadata: Metadata = { title: "Activity" };
export const viewport: Viewport = APP_VIEWPORT;

const OPEN = ["requested", "accepted", "on_loan"];

export default function ActivityPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-12">
        <h1 className="font-display text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.04] font-medium tracking-[-0.02em]">Activity.</h1>
        <Announcer>
          <Suspense fallback={<p className="text-paper/70">Checking your requests…</p>}>
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
    "id, mode, status, return_by, owner_id, requester_id, owner_handed_over, requester_received, owner_got_back, requester_returned, updated_at, copy:copies(id, status, books(title)), owner:profiles!requests_owner_id_fkey(display_name), requester:profiles!requests_requester_id_fkey(display_name)";
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
      <p role="alert" className="text-[17px] text-merah-light">
        Couldn&apos;t load your requests just now. Refresh to try again.
      </p>
    );
  }
  // Shape set by the select above (not generated types yet).
  const openRows = (open.data ?? []) as unknown as Row[];
  // The live meet-up card for each open request.
  const meetupIds = openRows.filter((r) => r.status !== "requested").map((r) => r.id);
  const { data: meetupRows } = meetupIds.length
    ? await supabase
        .from("meetups")
        .select("id, request_id, proposed_by, place, meet_at, note, status")
        .in("request_id", meetupIds)
        .in("status", ["proposed", "agreed"])
    : { data: [] };
  const meetups = new Map(((meetupRows ?? []) as (Meetup & { request_id: string })[]).map((m) => [m.request_id, m]));
  const pastRows = (past.data ?? []) as unknown as Row[];
  const today = seoulToday();
  const minAt = seoulPickerMin();
  const incoming = openRows.filter((r) => r.owner_id === user.id);
  const outgoing = openRows.filter((r) => r.requester_id === user.id);
  // Copies already promised to someone (or not on the shelf): their other requests can't be accepted.
  const busy = new Set(
    incoming.filter((r) => r.status !== "requested" || (r.copy && r.copy.status !== "available")).map((r) => r.copy?.id),
  );

  return (
    <div className="flex flex-col gap-14">
      <Section title="Asked of you" empty="Nobody has asked for your books yet.">
        {incoming.map((r) => (
          <Item
            key={r.id}
            row={r}
            who={r.requester?.display_name ?? "A reader"}
            line={ownerLine(r, { today, copyBusy: busy.has(r.copy?.id) })}
            ops={ownerOps(r, { today, copyBusy: busy.has(r.copy?.id) })}
            meetup={{ me: user.id, card: meetups.get(r.id) ?? null, minAt }}
          />
        ))}
      </Section>
      <Section
        title="Your requests"
        empty={
          <>
            You haven&apos;t asked for any books. <Link href="/browse" className="underline underline-offset-4">Browse the shelf</Link>.
          </>
        }
      >
        {outgoing.map((r) => (
          <Item key={r.id} row={r} who={r.owner?.display_name ?? "A reader"} line={requesterLine(r, today)} ops={requesterOps(r, today)} meetup={{ me: user.id, card: meetups.get(r.id) ?? null, minAt }} />
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
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      {children.length === 0 ? <p className="text-[17px] text-paper/80">{empty}</p> : <ul className="flex flex-col gap-4">{children}</ul>}
    </section>
  );
}

function Item({
  row,
  who,
  line,
  ops,
  meetup,
}: {
  row: Row;
  who: string;
  line: string;
  ops: Op[];
  meetup?: { me: string; card: Meetup | null; minAt: string };
}) {
  const title = row.copy?.books?.title ?? "A book";
  return (
    <li className="flex flex-col gap-3 rounded-[10px] bg-paper/[0.06] p-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-1">
        <p className="font-display text-xl font-semibold">
          {row.copy ? (
            <Link href={`/browse/${row.copy.id}`} className="no-underline hover:underline">
              {title}
            </Link>
          ) : (
            title
          )}
        </p>
        <p className="text-[15px] text-paper/80">
          {row.mode === "give" ? "Give" : "Lend"} · {who}
        </p>
        <p className="text-[15px] text-paper">{line}</p>
      </div>
      <div className="flex flex-col gap-4 sm:max-w-[26rem]">
        <RequestActions request={row.id} title={title} ops={ops} />
        {meetup && (row.status === "accepted" || (row.status === "on_loan" && !row.owner_got_back && !row.requester_returned)) ? (
          <MeetupCard
            key={meetup.card?.id ?? "none"}
            request={row.id}
            meetup={meetup.card}
            me={meetup.me}
            other={who}
            title={title}
            purpose={row.status === "accepted" ? "handover" : "return"}
            minAt={meetup.minAt}
          />
        ) : null}
      </div>
    </li>
  );
}
