"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { sendMagicLink, verifyCode, type CodeState, type MagicLinkState } from "./actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { safeRedirectPath } from "@/lib/safe-redirect";

/**
 * Google sign-in shows only once it's enabled in Supabase (Authentication →
 * Providers → Google) and NEXT_PUBLIC_GOOGLE_SIGNIN=on is set in Vercel.
 * Until then the button led to Supabase's "provider is not enabled" error page.
 */
const GOOGLE_ON = process.env.NEXT_PUBLIC_GOOGLE_SIGNIN === "on";

/** Supabase won't send another email to the same address within 60 seconds. */
const RESEND_AFTER = 60;

const initialSend: MagicLinkState = { status: "idle" };
const initialCode: CodeState = { status: "idle" };

/**
 * Sign in or sign up in two steps: your email, then the code we email you.
 * Typing the code keeps you in this tab (or the installed app), which an
 * email link can't promise on a phone. The email also carries a link as a
 * backup (finished on the landing page).
 */
export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [sent, sendAction, sending] = useActionState(sendMagicLink, initialSend);
  // "Use a different email" hides the code step for this send; a new send shows it again.
  const [changedFrom, setChangedFrom] = useState<number | null>(null);

  if (sent.status === "sent" && changedFrom !== sent.sentAt) {
    return (
      <CodeStep
        key={sent.sentAt}
        email={sent.email}
        next={next}
        sentAt={sent.sentAt}
        sendAction={sendAction}
        sending={sending}
        onChangeEmail={() => setChangedFrom(sent.sentAt)}
      />
    );
  }

  const error = sent.status === "error" ? sent : null;
  const lastEmail = sent.status !== "idle" ? sent.email : undefined;

  return (
    <div className="flex flex-col gap-6">
      {notice ? (
        <p role="alert" className="card px-4 py-3 text-[15px] leading-relaxed">
          {notice}
        </p>
      ) : null}

      {GOOGLE_ON ? <GoogleButton next={next} /> : null}

      <form action={sendAction} className="flex flex-col gap-3" noValidate>
        <input type="hidden" name="next" value={next} />
        <label htmlFor="email" className="text-[15px] font-semibold">
          Email
        </label>
        {/* React resets the form after each action; re-mount with the typed
            email so people don't have to retype it. */}
        <input
          key={lastEmail ? `e-${lastEmail}-${sent.status}` : "fresh"}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={lastEmail}
          placeholder="you@example.com"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "email-error" : "email-hint"}
          className="field h-13 px-4 text-[17px] outline-none aria-invalid:border-vermilion"
        />
        {error ? (
          <p id="email-error" role="alert" className="text-[15px] text-vermilion">
            {error.message}
          </p>
        ) : (
          <p id="email-hint" className="text-[15px] text-muted">
            We&apos;ll email you a code. No password to remember.
          </p>
        )}
        <button type="submit" disabled={sending} className="btn-primary mt-2 disabled:opacity-60">
          {sending ? "Sending…" : "Email me a code"}
        </button>
      </form>
    </div>
  );
}

function CodeStep({
  email,
  next,
  sentAt,
  sendAction,
  sending,
  onChangeEmail,
}: {
  email: string;
  next: string;
  sentAt: number;
  sendAction: (fd: FormData) => void;
  sending: boolean;
  onChangeEmail: () => void;
}) {
  const [state, codeAction, checking] = useActionState(verifyCode, initialCode);
  const codeInput = useRef<HTMLInputElement>(null);
  const [now, setNow] = useState(sentAt);
  const wait = Math.max(0, Math.ceil(RESEND_AFTER - (now - sentAt) / 1000));

  // Put the cursor in the code box (its label is read out), then count down to "Send a new code".
  useEffect(() => {
    codeInput.current?.focus();
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const error = state.status === "error" ? state.message : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-[28px] leading-[1.1]">
          Check your email
        </h2>
        <p className="text-[16px] leading-relaxed text-ink/80" role="status">
          We sent a code to <strong className="text-ink">{email}</strong>. It works once and expires in an hour.
        </p>
      </div>

      <form action={codeAction} className="flex flex-col gap-3" noValidate>
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />
        <label htmlFor="code" className="text-[15px] font-semibold">
          Code from the email
        </label>
        <input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 \-]*"
          maxLength={10}
          required
          ref={codeInput}
          placeholder="123456"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "code-error code-hint" : "code-hint"}
          className="field code-input h-16 px-4 outline-none aria-invalid:border-vermilion"
        />
        {error ? (
          <p id="code-error" role="alert" className="text-[15px] text-vermilion">
            {error}
          </p>
        ) : null}
        <p id="code-hint" className="text-[15px] text-muted">
          No code in the email? Open its link on this device instead.
        </p>
        <button type="submit" disabled={checking} className="btn-primary mt-2 disabled:opacity-60">
          {checking ? "Checking…" : "Sign in"}
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-3 border-t border-ink/25 pt-5">
        <form action={sendAction}>
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="next" value={next} />
          <button type="submit" disabled={wait > 0 || sending} className="btn-quiet !min-h-11 disabled:cursor-not-allowed disabled:opacity-50">
            {sending ? "Sending…" : wait > 0 ? `Send a new code in ${wait}s` : "Send a new code"}
          </button>
        </form>
        <button type="button" onClick={onChangeEmail} className="text-[15px] font-semibold text-ink underline underline-offset-4">
          Use a different email
        </button>
      </div>
    </div>
  );
}

function GoogleButton({ next }: { next: string }) {
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
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(target)}` },
    });
    if (error) setGoogleError("Google sign-in isn't available right now. Use your email instead.");
  }
  return (
    <>
      <button type="button" onClick={signInWithGoogle} className="btn-quiet">
        Continue with Google
      </button>
      {googleError ? (
        <p role="alert" className="text-[15px] text-vermilion">
          {googleError}
        </p>
      ) : null}
      <div className="flex items-center gap-4 text-[15px] text-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-ink/25" />
        or
        <span className="h-px flex-1 bg-ink/25" />
      </div>
    </>
  );
}

/** Shown while the real form streams in: looks the same, but can't be typed into. */
export function LoginFormPlaceholder() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="flex flex-col gap-3">
        <span className="text-[15px] font-semibold text-muted">Email</span>
        <div className="field h-13" />
        <div className="mt-2 h-12 bg-ink/10" />
      </div>
    </div>
  );
}
