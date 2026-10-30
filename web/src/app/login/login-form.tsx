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
      <div role="status" className="flex flex-col gap-3 rounded-md bg-sky-light p-6">
        <h2 ref={sentHeading} tabIndex={-1} className="font-display text-2xl font-medium outline-none">
          Check your inbox.
        </h2>
        <p className="text-base leading-relaxed">
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
        <p role="alert" className="rounded-md bg-bone-deep px-4 py-3 text-[15px] leading-relaxed">
          {notice}
        </p>
      ) : null}

      <button
        type="button"
        onClick={signInWithGoogle}
        className="h-13 rounded-full border-[1.5px] border-ink bg-transparent px-6 text-base font-semibold transition-colors duration-200 hover:bg-bone-deep active:scale-[0.98]"
      >
        Continue with Google
      </button>
      {googleError ? (
        <p role="alert" className="text-sm text-merah">
          {googleError}
        </p>
      ) : null}

      <div className="flex items-center gap-4 text-sm text-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-bone-deep" />
        or
        <span className="h-px flex-1 bg-bone-deep" />
      </div>

      <form action={formAction} className="flex flex-col gap-3" noValidate>
        <input type="hidden" name="next" value={next} />
        <label htmlFor="email" className="text-sm font-semibold">
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
          className="h-13 rounded-xl border border-bone-deep bg-white px-4 text-base outline-none focus-visible:border-pandan aria-invalid:border-merah"
        />
        {error ? (
          <p id="email-error" role="alert" className="text-sm text-merah">
            {error.message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-2 h-13 rounded-full bg-pandan px-6 text-base font-semibold text-white transition-colors duration-200 hover:bg-pandan-deep active:scale-[0.98] disabled:opacity-60"
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
      <div className="h-13 rounded-full border-[1.5px] border-bone-deep" />
      <div className="h-px" />
      <div className="flex flex-col gap-3">
        <span className="text-sm font-semibold text-muted">Email</span>
        <div className="h-13 rounded-xl border border-bone-deep bg-white" />
        <div className="mt-2 h-13 rounded-full bg-pandan/60" />
      </div>
    </div>
  );
}
