"use client";

import { useActionState } from "react";
import { toggleWish, type WishState } from "./actions";
import { useAnnounce } from "../activity/announcer";
import { inputClass } from "@/components/app/field";

/** Add a book you'd love to read by its ISBN. */
export function AddWishForm() {
  const announce = useAnnounce();
  const [state, action, pending] = useActionState<WishState, FormData>(async (prev, form) => {
    const next = await toggleWish(prev, form);
    if (next.status === "done") announce(next.message);
    return next;
  }, { status: "idle" });
  return (
    <form action={action} className="flex max-w-[34rem] flex-col gap-3">
      <input type="hidden" name="op" value="add" />
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-[14rem] flex-1 flex-col gap-2">
          <label htmlFor="wish-isbn" className="text-[15px] font-semibold">
            ISBN of a book you want
          </label>
          <input
            id="wish-isbn"
            name="isbn"
            inputMode="numeric"
            maxLength={20}
            required
            // Keeps what was typed after an error (React resets forms after an action).
            key={state.status === "error" ? `err-${state.isbn}` : "fresh"}
            defaultValue={state.status === "error" ? state.isbn : ""}
            aria-invalid={state.status === "error" ? true : undefined}
            aria-describedby={state.status === "error" ? "wish-error" : undefined}
            placeholder="978…"
            className={inputClass}
          />
        </div>
        <button type="submit" disabled={pending} className="h-13 rounded-full bg-paper px-6 text-[17px] font-semibold text-malam disabled:opacity-60">
          {pending ? "Adding…" : "Add"}
        </button>
      </div>
      {state.status === "error" ? (
        <p id="wish-error" role="alert" className="text-[15px] text-merah-light">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
