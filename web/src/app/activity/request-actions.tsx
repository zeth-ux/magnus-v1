"use client";

import { useActionState } from "react";
import { act, type ActState } from "./actions";

import type { Op } from "@/lib/activity/steps";
export type { Op };

/** The buttons for one request. Each submits the request id and which step it is. */
export function RequestActions({ request, ops }: { request: string; ops: Op[] }) {
  const [state, action, pending] = useActionState<ActState, FormData>(act, { status: "idle" });
  if (ops.length === 0) return null;
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="request" value={request} />
      <div className="flex flex-wrap gap-3">
        {ops.map((o) => (
          <button
            key={o.op}
            type="submit"
            name="op"
            value={o.op}
            disabled={pending}
            className={
              o.primary
                ? "h-11 rounded-full bg-paper px-5 text-[15px] font-semibold text-malam disabled:opacity-60"
                : "h-11 rounded-full border-[1.5px] border-paper/60 px-5 text-[15px] font-semibold disabled:opacity-60"
            }
          >
            {o.label}
          </button>
        ))}
      </div>
      <p aria-live="polite" className={`text-[15px] ${state.status === "error" ? "text-merah-light" : "text-paper/80"}`}>
        {state.status === "idle" ? "" : state.message}
      </p>
    </form>
  );
}
