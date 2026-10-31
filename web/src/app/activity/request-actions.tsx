"use client";

import { useActionState, useEffect, useState } from "react";
import { act, type ActState } from "./actions";
import { useAnnounce } from "./announcer";
import type { Op } from "@/lib/activity/steps";

export type { Op };

/**
 * The buttons for one request. Each submits the request id and which step it
 * is. Reporting a book as not returned can't be undone, so it asks twice.
 */
export function RequestActions({ request, title, ops }: { request: string; title: string; ops: Op[] }) {
  const [state, action, pending] = useActionState<ActState, FormData>(act, { status: "idle" });
  const [confirmReport, setConfirmReport] = useState(false);
  const announce = useAnnounce();

  useEffect(() => {
    if (state.status === "done") announce(`${title}: ${state.message}`);
  }, [state, title, announce]);

  if (ops.length === 0) return null;
  return (
    <form action={action} aria-busy={pending} className="flex flex-col gap-2">
      <input type="hidden" name="request" value={request} />
      <div className="flex flex-wrap gap-3">
        {ops.map((o) =>
          o.op === "report" && !confirmReport ? (
            <button
              key={o.op}
              type="button"
              onClick={() => setConfirmReport(true)}
              aria-label={`${o.label}: ${title}`}
              className="h-11 rounded-full border-[1.5px] border-merah-light px-5 text-[15px] font-semibold text-merah-light"
            >
              {o.label}
            </button>
          ) : (
            <button
              key={o.op}
              type="submit"
              name="op"
              value={o.op}
              aria-label={`${o.op === "report" ? "Yes, report it" : o.label}: ${title}`}
              className={
                o.op === "report"
                  ? "h-11 rounded-full bg-merah-light px-5 text-[15px] font-semibold text-malam"
                  : o.primary
                    ? "h-11 rounded-full bg-paper px-5 text-[15px] font-semibold text-malam"
                    : "h-11 rounded-full border-[1.5px] border-paper/60 px-5 text-[15px] font-semibold"
              }
            >
              {o.op === "report" ? "Yes, report it" : o.label}
            </button>
          ),
        )}
      </div>
      {confirmReport ? (
        <p className="max-w-[30rem] text-[15px] text-paper/80">
          The borrower keeps the book and their held credit becomes yours. This can&apos;t be undone.
        </p>
      ) : null}
      <p role={state.status === "error" ? "alert" : undefined} className="text-[15px] text-merah-light">
        {pending ? <span className="text-paper/80">Working…</span> : state.status === "error" ? state.message : ""}
      </p>
    </form>
  );
}
