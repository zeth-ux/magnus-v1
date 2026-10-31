"use client";

import { useActionState } from "react";
import { toggleWish, type WishState } from "./actions";
import { inputClass } from "@/components/app/field";

/** Add a book you'd love to read by its ISBN (asks for the title if nobody knows it). */
export function AddWishForm() {
  const [state, action, pending] = useActionState<WishState, FormData>(toggleWish, { status: "idle" });
  const needTitle = state.status === "needTitle";
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
            defaultValue={needTitle ? state.isbn : ""}
            placeholder="978…"
            className={inputClass}
          />
        </div>
        <button type="submit" disabled={pending} className="h-13 rounded-full bg-paper px-6 text-[17px] font-semibold text-malam disabled:opacity-60">
          {pending ? "Adding…" : "Add"}
        </button>
      </div>
      {needTitle ? (
        <div className="flex flex-col gap-2">
          <label htmlFor="wish-title" className="text-[15px] font-semibold">
            We couldn&apos;t find it. What&apos;s the title?
          </label>
          <input id="wish-title" name="title" required maxLength={300} autoFocus className={inputClass} />
        </div>
      ) : null}
      <p role={state.status === "error" ? "alert" : "status"} className={`text-[15px] ${state.status === "error" ? "text-merah-light" : "text-paper/80"}`}>
        {state.status === "error" || state.status === "done" ? state.message : ""}
      </p>
    </form>
  );
}
