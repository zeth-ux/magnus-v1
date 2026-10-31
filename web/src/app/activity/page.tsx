import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AppShell, APP_VIEWPORT } from "@/components/app/app-shell";
import { requireUser } from "@/lib/supabase/user";
import { RequestActions, type Op } from "./request-actions";
import { ownerLine, ownerOps, requesterLine, requesterOps, seoulToday, STATUS_WORDS, type Row } from "@/lib/activity/steps";

export const metadata: Metadata = { title: "Activity" };
export const viewport: Viewport = APP_VIEWPORT;

const OPEN = ["requested", "accepted", "on_loan"];

export default function ActivityPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-12">
        <h1 className="font-display text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.04] font-medium tracking-[-0.02em]">Activity.</h1>
        <Suspense fallback={<p className="text-paper/70">Checking your requests…</p>}>
          <Requests />
        </Suspense>
      </div>
    </AppShell>
  );
}

async function Requests() {
  const { supabase, user } = await requireUser("/activity");
  const { data, error } = await supabase
    .from("requests")
    .select(
      "id, mode, status, return_by, owner_id, requester_id, owner_handed_over, requester_received, owner_got_back, requester_returned, updated_at, copy:copies(id, books(title)), owner:profiles!requests_owner_id_fkey(display_name), requester:profiles!requests_requester_id_fkey(display_name)",
    )
    .order("updated_at", { ascending: false })
    .limit(60);
  if (error) {
    return (
      <p role="alert" className="text-[17px] text-merah-light">
        Couldn&apos;t load your requests just now. Refresh to try again.
      </p>
    );
  }
  const rows = (data ?? []) as unknown as Row[];
  const today = seoulToday();
  const incoming = rows.filter((r) => r.owner_id === user.id && OPEN.includes(r.status));
  const outgoing = rows.filter((r) => r.requester_id === user.id && OPEN.includes(r.status));
  const past = rows.filter((r) => !OPEN.includes(r.status)).slice(0, 10);

  return (
    <div className="flex flex-col gap-14">
      <Section title="Asked of you" empty="Nobody has asked for your books yet.">
        {incoming.map((r) => (
          <Item key={r.id} row={r} who={r.requester?.display_name ?? "A reader"} line={ownerLine(r, today)} ops={ownerOps(r, today)} />
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
          <Item key={r.id} row={r} who={r.owner?.display_name ?? "A reader"} line={requesterLine(r)} ops={requesterOps(r)} />
        ))}
      </Section>
      {past.length > 0 ? (
        <Section title="Earlier" empty="">
          {past.map((r) => (
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

function Item({ row, who, line, ops }: { row: Row; who: string; line: string; ops: Op[] }) {
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
      <RequestActions request={row.id} ops={ops} />
    </li>
  );
}
