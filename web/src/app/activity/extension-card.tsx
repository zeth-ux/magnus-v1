"use client";

import { useActionState, useRef, useState } from "react";
import { answerExtension, askExtension, type ExtensionState } from "./extension-actions";
import { useAnnounce } from "./announcer";
import { inputClass } from "@/components/app/field";
import type { ExtensionView } from "@/lib/activity/extension";

/**
 * "More time" on a loan. The borrower picks a later date; the lender says yes
 * or no. The parent keys it by the open ask's id, so a new ask starts fresh;
 * results go through the page's Announcer, which outlives this card.
 */
export function ExtensionCard({ request, title, other, view }: { request: string; title: string; other: string; view: ExtensionView }) {
  const announce = useAnnounce();
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const wrap = (fn: typeof askExtension) => async (prev: ExtensionState, form: FormData) => {
    const next = await fn(prev, form);
    if (next.status === "done") announce(`${title}: ${next.message}`);
    return next;
  };
  const [askState, ask, asking] = useActionState<ExtensionState, FormData>(wrap(askExtension), { status: "idle" });
  const [answerState, answer, answering] = useActionState<ExtensionState, FormData>(wrap(answerExtension), { status: "idle" });
  if (view.kind === "none") return null;

  const error = askState.status === "error" ? askState.message : answerState.status === "error" ? answerState.message : "";
  const dateId = `more-time-date-${request}`;
  const errorId = `more-time-error-${request}`;
  const showForm = view.kind === "borrower" && view.pick && open;
  const book = <span className="sr-only">: {title}</span>;

  return (
    <div className="flex flex-col gap-3 rounded-[8px] bg-paper/[0.06] p-4">
      <h3 className="text-[15px] font-semibold">More time</h3>
      {view.lastAnswer ? <p className="text-[15px] text-paper/80">{view.lastAnswer}</p> : null}

      {view.kind === "lender" ? (
        view.open ? (
          <form action={answer} aria-busy={answering} className="flex flex-col gap-3">
            <input type="hidden" name="extension" value={view.open.id} />
            <p className="text-[17px]">
              {other} asks to keep it until <strong>{view.open.date}</strong> (now due {view.open.due}).
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                name="answer"
                value="yes"
                disabled={answering}
                className="h-10 rounded-full bg-paper px-4 text-[15px] font-semibold text-malam disabled:opacity-60"
              >
                Yes, that&apos;s fine{book}
              </button>
              <button
                type="submit"
                name="answer"
                value="no"
                disabled={answering}
                className="h-10 rounded-full border-[1.5px] border-paper/60 px-4 text-[15px] font-semibold disabled:opacity-60"
              >
                No, keep {view.open.due}
                {book}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-[15px] text-paper/70">If {other} needs longer, they can ask here.</p>
        )
      ) : (
        <>
          {view.waiting ? (
            <p className="text-[17px]">
              You asked to keep it until <strong>{view.waiting.date}</strong>. Waiting for {other}.
            </p>
          ) : null}
          {showForm && view.pick ? (
            <form action={ask} aria-busy={asking} className="flex flex-col gap-3">
              <input type="hidden" name="request" value={request} />
              <div className="flex flex-col gap-2">
                <label htmlFor={dateId} className="text-[15px] font-semibold">
                  Keep it until
                </label>
                <input
                  id={dateId}
                  type="date"
                  name="date"
                  required
                  min={view.pick.min}
                  max={view.pick.max}
                  autoFocus={open}
                  defaultValue={askState.status === "error" ? askState.date : view.pick.min}
                  aria-invalid={askState.status === "error" || undefined}
                  aria-describedby={askState.status === "error" ? errorId : undefined}
                  className={`${inputClass} max-w-[14rem]`}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={asking} className="h-10 rounded-full bg-paper px-4 text-[15px] font-semibold text-malam disabled:opacity-60">
                  {asking ? "Sending…" : `Ask ${other}`}
                  {book}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    // Give focus back to the button that opened the form.
                    requestAnimationFrame(() => opener.current?.focus());
                  }}
                  className="h-10 px-2 text-[15px] font-semibold underline underline-offset-4"
                >
                  Never mind
                </button>
              </div>
            </form>
          ) : view.pick ? (
            <button
              ref={opener}
              type="button"
              onClick={() => setOpen(true)}
              className="h-10 self-start rounded-full border-[1.5px] border-paper/60 px-4 text-[15px] font-semibold"
            >
              {view.waiting ? "Ask for a different date" : "Ask for more time"}
              {book}
            </button>
          ) : view.blocked === "limit" ? (
            <p className="text-[15px] text-paper/70">You&apos;ve asked 5 times on this loan. Talk to {other} if you need longer.</p>
          ) : !view.waiting ? (
            <p className="text-[15px] text-paper/70">This is as long as {other} lends it for. Talk to them if you need longer.</p>
          ) : null}
        </>
      )}
      <p id={errorId} role={error ? "alert" : undefined} className="text-[15px] text-merah-light">
        {error}
      </p>
    </div>
  );
}
