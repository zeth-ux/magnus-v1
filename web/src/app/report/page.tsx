import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { AppShell, APP_VIEWPORT } from "@/components/app/app-shell";
import { requireUser } from "@/lib/supabase/user";
import { ReportForm } from "./report-form";

export const metadata: Metadata = { title: "Report a problem" };
export const viewport: Viewport = APP_VIEWPORT;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ReportPage({ searchParams }: PageProps<"/report">) {
  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <h1 className="font-display text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.04] font-medium tracking-[-0.02em]">Report a problem.</h1>
        <Suspense fallback={<p className="text-paper/70">One moment…</p>}>
          <Report searchParams={searchParams} />
        </Suspense>
      </div>
    </AppShell>
  );
}

async function Report({ searchParams }: Pick<PageProps<"/report">, "searchParams">) {
  const params = await searchParams;
  const raw = Array.isArray(params.request) ? params.request[0] : params.request;
  const { supabase, user } = await requireUser("/report");
  let request: string | null = null;
  let other: string | null = null;
  if (raw && UUID.test(raw)) {
    const { data } = await supabase
      .from("requests")
      .select("id, owner_id, owner:profiles!requests_owner_id_fkey(display_name), requester:profiles!requests_requester_id_fkey(display_name)")
      .eq("id", raw)
      .maybeSingle();
    const r = data as unknown as { id: string; owner_id: string; owner: { display_name: string } | null; requester: { display_name: string } | null } | null;
    if (r) {
      request = r.id;
      other = (r.owner_id === user.id ? r.requester : r.owner)?.display_name ?? null;
    }
  }
  return <ReportForm request={request} other={other} />;
}
