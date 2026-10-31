"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendFeedback, type FeedbackState } from "./actions";
import { inputClass } from "@/components/app/field";

export function FeedbackForm() {
  const [state, action, pending] = useActionState<FeedbackState, FormData>(sendFeedback, { status: "idle" });
  const done = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.status === "done") done.current?.focus();
  }, [state.status]);
  if (state.status === "done") {
    return (
      <p ref={done} tabIndex={-1} role="status" className="max-w-[34rem] rounded-[10px] bg-paper p-6 text-[17px] text-malam outline-none">
        Thank you! Zarith reads every one.
      </p>
    );
  }
  return (
    <form action={action} className="flex max-w-[34rem] flex-col gap-4">
      <label htmlFor="message" className="text-[15px] font-semibold">
        What would make Bayu better? Anything confusing or broken?
      </label>
      <textarea
        id="message"
        name="message"
        rows={6}
        required
        minLength={3}
        maxLength={2000}
        defaultValue={state.status === "error" ? state.text : ""}
        className={`${inputClass} h-auto py-3`}
      />
      {state.status === "error" ? (
        <p role="alert" className="text-[15px] text-merah-light">
          {state.message}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="h-13 self-start rounded-full bg-paper px-7 text-[17px] font-semibold text-malam disabled:opacity-60">
        {pending ? "Sending…" : "Send feedback"}
      </button>
    </form>
  );
}
