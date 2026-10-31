"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useAnnounce } from "../activity/announcer";
import { updateCopy, type CopyState } from "./actions";
import { CONDITIONS, LEND_MAX } from "@/lib/books/validate";
import { inputClass } from "@/components/app/field";

type Copy = {
  id: string;
  title: string;
  mode: "give" | "lend";
  lend_max: keyof typeof LEND_MAX | null;
  condition: keyof typeof CONDITIONS;
  note: string | null;
  status: "available" | "paused" | "on_loan" | "withdrawn";
};

/** Pause / put back / take off the shelf, and edit the note, condition and lend period. */
export function CopyControls({ copy }: { copy: Copy }) {
  const announce = useAnnounce();
  // Results go to the page's status region too: after taking a book off, this row moves away.
  const [state, action, pending] = useActionState<CopyState, FormData>(async (prev, form) => {
    const next = await updateCopy(prev, form);
    if (next.status === "done") announce(`${copy.title}: ${next.message}`);
    return next;
  }, { status: "idle" });
  const [editing, setEditing] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const keepButton = useRef<HTMLButtonElement>(null);
  const canToggle = copy.status === "available" || copy.status === "paused";
  const toggleText = copy.status === "available" ? "Pause" : "Put back on the shelf";
  const editText = editing ? "Close" : "Edit";

  // When the confirmation opens, the safe choice gets focus.
  useEffect(() => {
    if (confirmWithdraw) keepButton.current?.focus();
  }, [confirmWithdraw]);

  return (
    <div className="flex flex-col gap-3">
      <form action={action} className="flex flex-wrap gap-3">
        <input type="hidden" name="copy" value={copy.id} />
        {canToggle ? (
          <button
            type="submit"
            name="op"
            value={copy.status === "available" ? "pause" : "resume"}
            disabled={pending}
            aria-label={`${toggleText}: ${copy.title}`}
            className="h-11 rounded-full border-[1.5px] border-paper/60 px-5 text-[15px] font-semibold disabled:opacity-60"
          >
            {toggleText}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setEditing((e) => !e)}
          aria-expanded={editing}
          aria-label={`${editText}: ${copy.title}`}
          className="h-11 rounded-full border-[1.5px] border-paper/60 px-5 text-[15px] font-semibold"
        >
          {editText}
        </button>
        {canToggle && !confirmWithdraw ? (
          <button
            key="ask-withdraw"
            type="button"
            onClick={() => setConfirmWithdraw(true)}
            aria-label={`Take off the shelf: ${copy.title}`}
            className="h-11 px-2 text-[15px] font-semibold text-merah-light underline underline-offset-4"
          >
            Take off the shelf
          </button>
        ) : null}
      </form>
      {/* A separate form, so no double-click on the first button can land on "Yes". */}
      {confirmWithdraw && canToggle ? (
        <form action={action} className="flex flex-col gap-2 rounded-[8px] border border-merah-light/60 p-4">
          <input type="hidden" name="copy" value={copy.id} />
          <p id={`withdraw-warning-${copy.id}`} className="text-[15px] text-paper/80">
            It disappears from the shelf for good and open requests for it are cancelled. Your credits don&apos;t change.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              ref={keepButton}
              type="button"
              onClick={() => setConfirmWithdraw(false)}
              className="h-11 rounded-full border-[1.5px] border-paper/60 px-5 text-[15px] font-semibold"
            >
              Keep it
            </button>
            <button
              key="confirm-withdraw"
              type="submit"
              name="op"
              value="withdraw"
              disabled={pending}
              aria-describedby={`withdraw-warning-${copy.id}`}
              aria-label={`Yes, take it off: ${copy.title}`}
              className="h-11 rounded-full bg-merah-light px-5 text-[15px] font-semibold text-malam disabled:opacity-60"
            >
              Yes, take it off
            </button>
          </div>
        </form>
      ) : null}

      {editing ? (
        <form action={action} className="flex max-w-[30rem] flex-col gap-4 rounded-[8px] bg-paper/[0.06] p-4">
          <input type="hidden" name="copy" value={copy.id} />
          <input type="hidden" name="op" value="save" />
          {copy.mode === "lend" ? (
            <div className="flex flex-col gap-2">
              <label htmlFor={`lendMax-${copy.id}`} className="text-[15px] font-semibold">
                Lend it for up to
              </label>
              <select id={`lendMax-${copy.id}`} name="lendMax" defaultValue={copy.lend_max ?? "4_weeks"} className={inputClass}>
                {Object.entries(LEND_MAX).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <label htmlFor={`condition-${copy.id}`} className="text-[15px] font-semibold">
              Condition
            </label>
            <select id={`condition-${copy.id}`} name="condition" defaultValue={copy.condition} className={inputClass}>
              {Object.entries(CONDITIONS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor={`note-${copy.id}`} className="text-[15px] font-semibold">
              Your warkah
            </label>
            <textarea id={`note-${copy.id}`} name="note" rows={3} maxLength={280} defaultValue={copy.note ?? ""} className={`${inputClass} h-auto py-3`} />
          </div>
          <button type="submit" disabled={pending} className="h-11 self-start rounded-full bg-paper px-5 text-[15px] font-semibold text-malam disabled:opacity-60">
            {pending ? "Saving…" : "Save"}
          </button>
        </form>
      ) : null}

      <p role={state.status === "error" ? "alert" : "status"} className={`text-[15px] ${state.status === "error" ? "text-merah-light" : "text-paper/80"}`}>
        {state.status === "idle" ? "" : state.message}
      </p>
    </div>
  );
}
