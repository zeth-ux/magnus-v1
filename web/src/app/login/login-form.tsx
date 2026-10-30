"use client";

import { useActionState, useState } from "react";
import { sendMagicLink, type MagicLinkState } from "./actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { safeRedirectPath } from "@/lib/safe-redirect";

const initial: MagicLinkState = { status: "idle" };

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(sendMagicLink, initial);
  const [googleError, setGoogleError] = useState<string | null>(null);

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
        <p className="font-display text-2xl">Check your inbox.</p>
        <p className="text-base leading-relaxed">
          We sent a sign-in link to <strong>{state.email}</strong>. Open it on this phone or computer.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
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
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder="you@example.com"
          aria-describedby={state.status === "error" ? "email-error" : undefined}
          className="h-13 rounded-xl border border-bone-deep bg-white px-4 text-base outline-none focus-visible:border-pandan"
        />
        {state.status === "error" ? (
          <p id="email-error" role="alert" className="text-sm text-merah">
            {state.message}
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
