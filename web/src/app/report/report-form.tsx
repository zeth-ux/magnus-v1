"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { sendReport, type ReportState } from "./actions";
import { inputClass } from "@/components/app/field";

export function ReportForm({ request, other }: { request: string | null; other: string | null }) {
  const [state, action, pending] = useActionState<ReportState, FormData>(sendReport, { status: "idle" });
  const done = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.status === "done") done.current?.focus();
  }, [state.status]);

  if (state.status === "done") {
    return (
      <div className="flex flex-col gap-4">
        <p ref={done} tabIndex={-1} role="status" className="rounded-[10px] bg-paper p-6 text-[17px] text-malam outline-none">
          Thanks for telling us. The pilot team will look at it{state.blocked && other ? `, and you've blocked ${other}` : ""}.
        </p>
        <Link href="/activity" className="self-start text-[17px] underline underline-offset-4">
          Back to Activity
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className="flex max-w-[34rem] flex-col gap-5">
      {request ? <input type="hidden" name="request" value={request} /> : null}
      <div className="flex flex-col gap-2">
        <label htmlFor="reason" className="text-[15px] font-semibold">
          What happened?
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={6}
          required
          minLength={5}
          maxLength={2000}
          defaultValue={state.status === "error" ? state.reason : ""}
          aria-describedby="reason-hint"
          className={`${inputClass} h-auto py-3`}
        />
        <p id="reason-hint" className="text-[15px] text-paper/70">
          Only the pilot team reads this{other ? `; ${other} isn't told who reported` : ""}.
        </p>
      </div>
      {request && other ? (
        <label className="flex items-start gap-3 text-[17px]">
          <input type="checkbox" name="block" className="mt-1 h-5 w-5 accent-songket" />
          <span>
            Also block {other}: no more requests between you, and open ones are cancelled.
          </span>
        </label>
      ) : null}
      {state.status === "error" ? (
        <p role="alert" className="text-[15px] text-merah-light">
          {state.message}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="h-13 self-start rounded-full bg-paper px-7 text-[17px] font-semibold text-malam disabled:opacity-60">
        {pending ? "Sending…" : "Send report"}
      </button>
    </form>
  );
}
