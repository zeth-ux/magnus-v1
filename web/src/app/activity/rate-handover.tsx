"use client";

import Link from "next/link";
import { useActionState } from "react";
import { rateHandover, type RateState } from "./rate-actions";

/**
 * After a book changed hands: how did it go? A thumbs up counts towards the
 * other reader's "readers had a smooth handover with them".
 * The buttons stay focusable while saving (aria-busy, not disabled), so focus
 * isn't dropped to the page; a second click just saves the same answer again.
 */
export function RateHandover({ request, title, other, rated }: { request: string; title: string; other: string; rated: boolean | null }) {
  const [state, action, pending] = useActionState<RateState, FormData>(rateHandover, { status: "idle" });
  const current = state.status === "done" ? state.up : rated;
  const groupLabel = `How was the handover with ${other}?`;
  return (
    <div className="flex flex-col gap-2">
      <form action={action} className="flex flex-wrap items-center gap-2" aria-busy={pending}>
        <input type="hidden" name="request" value={request} />
        <div role="group" aria-label={`${groupLabel} (${title})`} className="flex flex-wrap items-center gap-2">
          <span aria-hidden="true" className="text-[15px] text-paper/80">
            {groupLabel}
          </span>
          {([true, false] as const).map((up) => (
            <button
              key={String(up)}
              type="submit"
              name="up"
              value={String(up)}
              aria-pressed={current === up}
              className={`h-10 rounded-full px-4 text-[15px] font-semibold ${pending ? "opacity-60" : ""} ${current === up ? "bg-paper text-malam" : "border-[1.5px] border-paper/60"}`}
            >
              <span aria-hidden="true">{up ? "👍 " : "👎 "}</span>
              {up ? "Went well" : "Didn't go well"}
            </button>
          ))}
        </div>
      </form>
      <p role="status" className="text-[15px] text-paper/80">
        {state.status === "done" ? "Thanks, saved." : ""}
      </p>
      {state.status === "error" ? (
        <p role="alert" className="text-[15px] text-merah-light">
          {state.message}
        </p>
      ) : null}
      <Link href={`/report?request=${request}`} className="self-start text-[15px] text-paper/80 underline underline-offset-4">
        Report a problem<span className="sr-only"> with {title}</span>
      </Link>
    </div>
  );
}
