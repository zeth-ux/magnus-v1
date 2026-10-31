"use client";

import { useActionState } from "react";
import { toggleWish, type WishState } from "./actions";

/** "Add to wishlist" / "On your wishlist" for one book (by ISBN). */
export function WishButton({ isbn, title, wished }: { isbn: string; title: string; wished: boolean }) {
  const [state, action, pending] = useActionState<WishState, FormData>(toggleWish, { status: "idle" });
  const on = state.status === "done" && state.wished !== undefined ? state.wished : wished;
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="isbn" value={isbn} />
      <input type="hidden" name="op" value={on ? "remove" : "add"} />
      <button
        type="submit"
        disabled={pending}
        aria-pressed={on}
        aria-label={`${on ? "On your wishlist" : "Add to wishlist"}: ${title}`}
        className={`h-11 self-start rounded-full px-5 text-[15px] font-semibold disabled:opacity-60 ${on ? "bg-songket text-kayu" : "border-[1.5px] border-paper/60"}`}
      >
        {on ? "★ On your wishlist" : "☆ Add to wishlist"}
      </button>
      <p role={state.status === "error" ? "alert" : "status"} className={`text-[15px] ${state.status === "error" ? "text-merah-light" : "text-paper/80"}`}>
        {state.status === "error" ? state.message : state.status === "done" ? state.message : ""}
      </p>
    </form>
  );
}
