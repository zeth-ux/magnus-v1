"use client";

import Link from "next/link";
import { useActionState } from "react";
import { rateHandover, type RateState } from "./rate-actions";

/** After a book changed hands: how did it go? (A thumbs up counts towards "smooth handovers".) */
export function RateHandover({ request, title, other, rated }: { request: string; title: string; other: string; rated: boolean | null }) {
  const [state, action, pending] = useActionState<RateState, FormData>(rateHandover, { status: "idle" });
  const current = state.status === "done" ? state.up : rated;
  return (
    <div className="flex flex-col gap-2">
      <form action={action} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="request" value={request} />
        <span className="text-[15px] text-paper/80">How was the handover with {other}?</span>
        {([true, false] as const).map((up) => (
          <button
            key={String(up)}
            type="submit"
            name="up"
            value={String(up)}
            disabled={pending}
            aria-pressed={current === up}
            aria-label={`${up ? "Went well" : "Didn't go well"}: ${title}`}
            className={`h-10 rounded-full px-4 text-[15px] font-semibold disabled:opacity-60 ${current === up ? "bg-paper text-malam" : "border-[1.5px] border-paper/60"}`}
          >
            {up ? "👍 Went well" : "👎 Didn't"}
          </button>
        ))}
      </form>
      <p role={state.status === "error" ? "alert" : "status"} className={`text-[15px] ${state.status === "error" ? "text-merah-light" : "text-paper/80"}`}>
        {state.status === "error" ? state.message : state.status === "done" ? "Thanks!" : ""}
      </p>
      <Link href={`/report?request=${request}`} className="self-start text-[15px] text-paper/80 underline underline-offset-4">
        Report a problem
      </Link>
    </div>
  );
}
