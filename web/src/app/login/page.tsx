import type { Metadata, Viewport } from "next";
import { OPEN_LINK_HINT } from "@/lib/auth/copy";
import { Suspense } from "react";
import { LoginForm, LoginFormPlaceholder } from "./login-form";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { AUTH_VIEWPORT, AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Join the pilot",
  description: "Sign in with a code from your email to give and lend English books with readers in Ansan.",
  alternates: { canonical: "/login" },
};
export const viewport: Viewport = AUTH_VIEWPORT;

/** Plain-language explanations for /login?error=… (set by /auth/callback). */
const NOTICES: Record<string, string> = {
  signout: "You're signed out here, but we couldn't sign out your other devices. Sign in and try \"Sign out everywhere\" again from Me.",
  link: `That sign-in link has expired or was already used. Get a new code below. ${OPEN_LINK_HINT}`,
  // Set by /auth/signout when "Sign out everywhere" couldn't reach every session.
  account:
    "You're already signed in as someone else on this browser. Sign out, then get a new code below.",
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthShell>
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <h1 className="page-title">Join the Ansan pilot</h1>
          <p className="max-w-[26rem] text-[17px] leading-relaxed text-ink/80">
            New or returning, it&apos;s the same step: we email you a code. List your first book and
            you get 1 starter credit.
          </p>
        </div>
        {/* searchParams are request data, so the form streams in behind a boundary. */}
        <Suspense fallback={<LoginFormPlaceholder />}>
          <LoginFormWithParams searchParams={searchParams} />
        </Suspense>
      </div>
    </AuthShell>
  );
}

async function LoginFormWithParams({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const params = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const errorKey = first(params.signout) === "failed" ? "signout" : first(params.error);
  return (
    <>
      <LoginForm
        next={safeRedirectPath(first(params.next))}
        notice={errorKey ? NOTICES[errorKey] : undefined}
      />
      {errorKey === "account" ? (
        <form action="/auth/signout" method="post">
          <input type="hidden" name="then" value="login" />
          <button
            type="submit"
            className="text-[15px] font-semibold text-ink/80 underline underline-offset-4 hover:text-ink"
          >
            Sign out of this browser
          </button>
        </form>
      ) : null}
    </>
  );
}
