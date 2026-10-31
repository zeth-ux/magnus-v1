"use client";

import { useActionState } from "react";
import { toggleWish, type WishState } from "./actions";
import { useAnnounce } from "../activity/announcer";

/**
 * "Add to wishlist" / "On your wishlist" for one book. The text says the
 * state (no aria-pressed on top of it). Results also go to the page's status
 * region, because on /wishlist removing a book removes this button.
 */
export function WishButton({ isbn, title, wished }: { isbn: string; title: string; wished: boolean }) {
  const announce = useAnnounce();
  const [state, action, pending] = useActionState<WishState, FormData>(async (prev, form) => {
    const next = await toggleWish(prev, form);
    if (next.status === "done") announce(`${title}: ${next.message}`);
    return next;
  }, { status: "idle" });
  const on = state.status === "done" ? state.wished : wished;
  const text = on ? "On your wishlist (remove)" : "Add to wishlist";
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="isbn" value={isbn} />
      <input type="hidden" name="op" value={on ? "remove" : "add"} />
      <button
        type="submit"
        disabled={pending}
        aria-label={`${text}: ${title}`}
        className={`h-11 self-start rounded-full px-5 text-[15px] font-semibold disabled:opacity-60 ${on ? "bg-songket text-kayu" : "border-[1.5px] border-paper/60"}`}
      >
        <span aria-hidden="true">{on ? "★ " : "☆ "}</span>
        {text}
      </button>
      {state.status === "error" ? (
        <p role="alert" className="text-[15px] text-merah-light">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
