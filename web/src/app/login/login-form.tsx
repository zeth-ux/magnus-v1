"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { sendMagicLink, type MagicLinkState } from "./actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { safeRedirectPath } from "@/lib/safe-redirect";

const initial: MagicLinkState = { status: "idle" };

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [state, formAction, pending] = useActionState(sendMagicLink, initial);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const sentHeading = useRef<HTMLHeadingElement>(null);

  // When the form is replaced by "Check your inbox", move focus to the new
  // heading so keyboard and screen-reader users land on the confirmation.
  useEffect(() => {
    if (state.status === "sent") sentHeading.current?.focus();
  }, [state.status]);

  async function signInWithGoogle() {
    setGoogleError(null);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setGoogleError("Sign-in isn't set up yet. Try again soon.");
      return;
    }
    const target = safeRedirectPath(next);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(target)}`,
      },
    });
    if (error) setGoogleError("Google sign-in isn't available right now. Use your email instead.");
  }

  if (state.status === "sent") {
    return (
      <div role="status" className="flex flex-col gap-3 rounded-[10px] bg-paper p-7 text-malam">
        <h2 ref={sentHeading} tabIndex={-1} className="font-display text-2xl font-medium outline-none">
          Check your inbox.
        </h2>
        <p className="text-[17px] leading-relaxed">
          We sent a sign-in link to <strong>{state.email}</strong>. It works on any phone or
          computer, and expires in an hour.
        </p>
      </div>
    );
  }

  const error = state.status === "error" ? state : null;

  return (
    <div className="flex flex-col gap-6">
      {notice ? (
        <p role="alert" className="rounded-[10px] bg-paper/10 px-4 py-3 text-[15px] leading-relaxed">
          {notice}
        </p>
      ) : null}

      <button
        type="button"
        onClick={signInWithGoogle}
        className="h-13 rounded-full border-[1.5px] border-paper/70 bg-transparent px-6 text-[17px] font-semibold text-paper transition-colors duration-200 hover:bg-paper hover:text-malam active:scale-[0.98]"
      >
        Continue with Google
      </button>
      {googleError ? (
        <p role="alert" className="text-[15px] text-merah-light">
          {googleError}
        </p>
      ) : null}

      <div className="flex items-center gap-4 text-[15px] text-paper/70" aria-hidden="true">
        <span className="h-px flex-1 bg-paper/25" />
        or
        <span className="h-px flex-1 bg-paper/25" />
      </div>

      <form action={formAction} className="flex flex-col gap-3" noValidate>
        <input type="hidden" name="next" value={next} />
        <label htmlFor="email" className="text-[15px] font-semibold">
          Email
        </label>
        {/* React resets the form after each action; re-mount with the typed
            email on error so people don't have to retype it. */}
        <input
          key={error ? `err-${error.email}` : "fresh"}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={error?.email}
          placeholder="you@example.com"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "email-error" : undefined}
          className="field-dark h-13 rounded-xl px-4 text-[17px] outline-none aria-invalid:border-merah-light"
        />
        {error ? (
          <p id="email-error" role="alert" className="text-[15px] text-merah-light">
            {error.message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-2 h-13 rounded-full bg-paper px-6 text-[17px] font-semibold text-malam transition-transform duration-200 motion-safe:hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? "Sending…" : "Email me a sign-in link"}
        </button>
      </form>
    </div>
  );
}

/** Shown while the real form streams in: looks the same, but can't be typed into. */
export function LoginFormPlaceholder() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="h-13 rounded-full border-[1.5px] border-paper/30" />
      <div className="h-px" />
      <div className="flex flex-col gap-3">
        <span className="text-[15px] font-semibold text-paper/70">Email</span>
        <div className="field-dark h-13 rounded-xl" />
        <div className="mt-2 h-13 rounded-full bg-paper/40" />
      </div>
    </div>
  );
}
