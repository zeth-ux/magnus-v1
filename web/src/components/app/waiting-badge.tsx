import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * How many requests wait on the reader (my_waiting_count). Cached per request:
 * the top bar and the phone tab bar both show it, with one database call.
 */
const getWaitingCount = cache(async (): Promise<number> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return 0;
  const { data, error } = await supabase.rpc("my_waiting_count");
  if (error) {
    // A badge can quietly show nothing, but a broken count should show up in the logs.
    console.error("waiting badge: my_waiting_count", error.code);
    return 0;
  }
  const n = Number(data ?? 0);
  return Number.isFinite(n) && n > 0 ? n : 0;
});

/**
 * The count on the Activity link. Reads the session, so AppShell renders it
 * inside <Suspense>. The number is visual; screen readers hear
 * ", N waiting for you" after the link's visible name.
 * `corner` pins it to the label's top-right (the narrow phone tabs).
 */
export async function WaitingBadge({ corner = false }: { corner?: boolean }) {
  const n = await getWaitingCount();
  if (n === 0) return null;
  return (
    <>
      <span
        aria-hidden="true"
        className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cobalt px-1 text-[11px] leading-none font-bold text-ink ${
          corner ? "absolute -top-3.5 -right-5" : "ml-1.5"
        }`}
      >
        {n > 9 ? "9+" : n}
      </span>
      <span className="sr-only">, {n} waiting for you</span>
    </>
  );
}
