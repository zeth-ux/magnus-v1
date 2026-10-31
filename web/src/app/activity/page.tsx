import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AppShell, APP_VIEWPORT } from "@/components/app/app-shell";
import { requireUser } from "@/lib/supabase/user";
import { RequestActions, type Op } from "./request-actions";
import { RateHandover } from "./rate-handover";
import { Announcer } from "./announcer";
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
  const pastRows = (past.data ?? []) as unknown as Row[];
  // My ratings for finished handovers (a thumbs up or down, once each).
  const changedHands = pastRows.filter((r) => ["handed_over", "returned", "forfeited"].includes(r.status)).map((r) => r.id);
  const { data: ratingRows } = changedHands.length
    ? await supabase.from("handover_ratings").select("request_id, thumbs_up").in("request_id", changedHands).eq("rater_id", user.id)
    : { data: [] };
  const myRatings = new Map<string, boolean>(((ratingRows ?? []) as { request_id: string; thumbs_up: boolean }[]).map((x) => [x.request_id, x.thumbs_up]));
  const today = seoulToday();
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
          <Item key={r.id} row={r} who={r.owner?.display_name ?? "A reader"} line={requesterLine(r, today)} ops={requesterOps(r, today)} />
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
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      {children.length === 0 ? <p className="text-[17px] text-paper/80">{empty}</p> : <ul className="flex flex-col gap-4">{children}</ul>}
    </section>
  );
}

function Item({ row, who, line, ops, after }: { row: Row; who: string; line: string; ops: Op[]; after?: React.ReactNode }) {
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
      <RequestActions request={row.id} title={title} ops={ops} />
      {after}
    </li>
  );
}
