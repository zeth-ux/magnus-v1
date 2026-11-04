"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sendMagicLink, type MagicLinkState } from "./actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { checkCodeInput, codeErrorMessage } from "@/lib/auth/otp";

/**
 * Google sign-in shows only once it's enabled in Supabase (Authentication →
 * Providers → Google) and NEXT_PUBLIC_GOOGLE_SIGNIN=on is set in Vercel.
 * Until then the button led to Supabase's "provider is not enabled" error page.
 */
const GOOGLE_ON = process.env.NEXT_PUBLIC_GOOGLE_SIGNIN === "on";

/** Supabase won't send another email to the same address within 60 seconds. */
const RESEND_AFTER = 60;

const initialSend: MagicLinkState = { status: "idle" };

/**
 * Sign in or sign up in two steps: your email, then the code we email you.
 * Typing the code keeps you in this tab (or the installed app), which an
 * email link can't promise on a phone. The email also carries a link as a
 * backup (finished on the landing page).
 */
export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [sent, sendAction, sending] = useActionState(sendMagicLink, initialSend);
  // The code step belongs to the last email that really went out; "Use a
  // different email" leaves it until the next one does.
  const [changedFrom, setChangedFrom] = useState<number | null>(null);
  const emailInput = useRef<HTMLInputElement>(null);

  // Back on the email step after "Use a different email": put the cursor in the box.
  useEffect(() => {
    if (changedFrom !== null) emailInput.current?.focus();
  }, [changedFrom]);

  if (sent.status === "sent" && changedFrom !== sent.sentAt) {
    return <CodeStep key={sent.sentAt} email={sent.email} next={next} onChangeEmail={() => setChangedFrom(sent.sentAt)} />;
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
          ref={emailInput}
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

/**
 * Step two. The code is checked from the browser, so Supabase's per-address
 * limit on tries applies to this reader's own connection (checked from our
 * server, every reader would share one limit and an attacker's guesses would
 * be spread over many). Supabase still does every check that matters.
 */
function CodeStep({ email, next, onChangeEmail }: { email: string; next: string; onChangeEmail: () => void }) {
  const router = useRouter();
  const codeInput = useRef<HTMLInputElement>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<{ message: string; attempt: number } | null>(null);
  // Resends stay on this step: a refused resend (busy email) mustn't take away the box for the code already sent.
  const [resent, resendAction, resending] = useActionState(sendMagicLink, initialSend);
  const lastSentAt = resent.status === "sent" ? resent.sentAt : null;
  const wait = useCountdown(RESEND_AFTER, lastSentAt);

  useEffect(() => {
    codeInput.current?.focus();
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = new FormData(e.currentTarget).get("code");
    const checked = checkCodeInput(email, typeof code === "string" ? code : "");
    const fail = (message: string) => {
      setError((prev) => ({ message, attempt: (prev?.attempt ?? 0) + 1 }));
      codeInput.current?.focus();
    };
    if (!checked.ok) return fail(checked.message);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return fail("Sign-in isn't set up yet. Try again soon.");
    setChecking(true);
    const { error: err } = await supabase.auth.verifyOtp({ email: checked.email, token: checked.token, type: "email" });
    if (err) {
      setChecking(false);
      return fail(codeErrorMessage(err.code));
    }
    // Signed in (the session cookies are set). Replace, so Back doesn't return to the code form.
    router.replace(safeRedirectPath(next));
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-[28px] leading-[1.1]">Check your email</h2>
        <p id="code-sent" className="text-[16px] leading-relaxed text-ink/80">
          We sent a code to <strong className="text-ink">{email}</strong>. It works once and expires soon.
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
        <label htmlFor="code" className="text-[15px] font-semibold">
          Code from the email
        </label>
        <input
          ref={codeInput}
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={20}
          required
          placeholder="123456"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "code-error code-sent code-hint" : "code-sent code-hint"}
          className="field code-input h-16 px-4 outline-none aria-invalid:border-vermilion"
        />
        {/* Keyed by attempt, so the same message is read out again after another wrong try. */}
        {error ? (
          <p key={error.attempt} id="code-error" role="alert" className="text-[15px] text-vermilion">
            {error.message}
          </p>
        ) : null}
        <p id="code-hint" className="text-[15px] text-muted">
          No code in the email? Open its link on this device instead.
        </p>
        <button type="submit" disabled={checking} className="btn-primary mt-2 disabled:opacity-60">
          {checking ? "Checking…" : "Sign in"}
        </button>
      </form>

      <div className="flex flex-col gap-3 border-t border-ink/25 pt-5">
        <div className="flex flex-wrap items-center gap-3">
          <form action={resendAction}>
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="next" value={next} />
            <button type="submit" disabled={wait > 0 || resending} className="btn-quiet !min-h-11 disabled:cursor-not-allowed disabled:opacity-50">
              {resending ? "Sending…" : wait > 0 ? `Send a new code in ${wait}s` : "Send a new code"}
            </button>
          </form>
          <button type="button" onClick={onChangeEmail} className="text-[15px] font-semibold text-ink underline underline-offset-4">
            Use a different email
          </button>
        </div>
        <p role="status" className="text-[15px] text-ink/80 empty:sr-only">
          {resent.status === "sent" ? "New code sent. Use the newest email." : ""}
        </p>
        {resent.status === "error" ? (
          <p role="alert" className="text-[15px] text-vermilion">
            {resent.message} The code you already have still works.
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Seconds left until another email may be sent, measured on this device's own
 * clock (the server's may differ) from when the step appeared or the last
 * resend went out. Works from timestamps, not by counting ticks, so a phone
 * that pauses timers in the background still shows the right number.
 */
function useCountdown(seconds: number, restart: unknown) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const remaining = Math.max(0, Math.ceil(seconds - (Date.now() - start) / 1000));
      setLeft(remaining);
      if (remaining === 0) window.clearInterval(t);
    };
    const t = window.setInterval(tick, 1000);
    tick();
    return () => window.clearInterval(t);
  }, [seconds, restart]);
  return left;
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
