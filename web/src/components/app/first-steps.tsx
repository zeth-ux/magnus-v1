import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { firstSteps } from "@/lib/onboarding/steps";

/**
 * A strip of the three first steps, shown on the main app pages until a new
 * reader has done all three. Reads the session, so it sits inside <Suspense>
 * on every page that uses it; it renders nothing for anyone who's finished
 * (or if the checks fail: never a reason to block the page).
 */
export async function FirstSteps() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  const me = data.user?.id;
  if (!me) return null;
  const [card, books, asks] = await Promise.all([
    supabase.from("profiles").select("id").eq("id", me).maybeSingle(),
    supabase.from("copies").select("id", { count: "exact", head: true }).eq("owner_id", me),
    supabase.from("requests").select("id", { count: "exact", head: true }).eq("requester_id", me),
  ]);
  if (card.error || books.error || asks.error) return null;
  const result = firstSteps({ card: Boolean(card.data), book: (books.count ?? 0) > 0, ask: (asks.count ?? 0) > 0 });
  if (!result) return null;

  return (
    <nav aria-label="Your first steps" className="border-y border-ink/90 py-4">
      <ol className="grid gap-3 sm:grid-cols-3 sm:gap-0">
        {result.steps.map((step, i) => {
          const now = i === result.current;
          return (
            <li key={step.key} className="flex items-center gap-3 sm:border-l sm:border-ink/25 sm:px-4 sm:first:border-l-0 sm:first:pl-0">
              <span
                aria-hidden="true"
                className={`grid h-7 w-7 shrink-0 place-items-center border text-[13px] font-semibold ${
                  step.done ? "border-cobalt bg-cobalt text-white" : now ? "border-cobalt text-cobalt" : "border-ink/40 text-muted"
                }`}
              >
                {step.done ? "✓" : i + 1}
              </span>
              {step.done ? (
                <span className="text-[15px] text-muted line-through decoration-1">
                  {step.label}
                  <span className="sr-only"> (done)</span>
                </span>
              ) : now ? (
                <Link href={step.href} aria-current="step" className="text-[15px] font-semibold text-cobalt underline underline-offset-4">
                  {step.label}
                </Link>
              ) : (
                <Link href={step.href} className="text-[15px] text-ink no-underline hover:underline">
                  {step.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
