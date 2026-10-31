"use client";

import { useActionState } from "react";
import { requestCopy, type RequestState } from "../actions";
import { inputClass } from "@/components/app/field";

/** Ask for a copy. For a lend, pick a return date within the owner's limit. */
export function RequestForm({
  copyId,
  mode,
  minDate,
  maxDate,
}: {
  copyId: string;
  mode: "give" | "lend";
  minDate: string;
  maxDate: string;
}) {
  const [state, action, pending] = useActionState<RequestState, FormData>(requestCopy, { status: "idle" });

  if (state.status === "requested") {
    return (
      <p role="status" className="rounded-[10px] bg-paper p-6 text-[17px] leading-relaxed text-malam">
        Request sent. The owner will accept or decline; you&apos;ll agree a meet-up once they accept.
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="copyId" value={copyId} />
      {mode === "lend" ? (
        <div className="flex max-w-[18rem] flex-col gap-2">
          <label htmlFor="returnBy" className="text-[15px] font-semibold">
            I&apos;ll return it by
          </label>
          <input id="returnBy" name="returnBy" type="date" required min={minDate} max={maxDate} defaultValue={minDate} className={inputClass} />
        </div>
      ) : null}
      {state.status === "error" ? (
        <p role="alert" className="text-[15px] text-merah-light">
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="h-13 self-start rounded-full bg-paper px-7 text-[17px] font-semibold text-malam motion-safe:transition-transform motion-safe:hover:scale-[1.02] disabled:opacity-60"
      >
        {pending ? "Sending…" : mode === "give" ? "Request this book" : "Ask to borrow it"}
      </button>
      <p className="text-[15px] text-paper/70">
        {mode === "give"
          ? "Taking it spends 1 credit, at the handover."
          : "Borrowing holds 1 credit from the handover until you bring it back."}
      </p>
    </form>
  );
}
