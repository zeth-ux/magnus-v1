"use client";

import { useActionState } from "react";
import { unblockReader, type UnblockState } from "./unblock-actions";

export function UnblockButton({ reader, name }: { reader: string; name: string }) {
  const [state, action, pending] = useActionState<UnblockState, FormData>(unblockReader, { status: "idle" });
  return (
    <form action={action} className="flex flex-col items-end gap-1" aria-busy={pending}>
      <input type="hidden" name="reader" value={reader} />
      <button type="submit" className={`h-10 rounded-full border-[1.5px] border-paper/60 px-4 text-[15px] font-semibold ${pending ? "opacity-60" : ""}`}>
        Unblock<span className="sr-only"> {name}</span>
      </button>
      {state.status === "error" ? (
        <p role="alert" className="text-[15px] text-merah-light">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
