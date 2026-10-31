import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { LoginForm, LoginFormPlaceholder } from "./login-form";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Join the pilot" };
export const viewport: Viewport = { themeColor: "#1c1614", colorScheme: "dark" };

/** Plain-language explanations for /login?error=… (set by /auth/callback). */
const NOTICES: Record<string, string> = {
  link: "That sign-in link has expired or was already used. Send yourself a new one below.",
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthShell>
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-[clamp(2.4rem,4vw,3.4rem)] leading-[1.02] font-medium tracking-[-0.02em]">
            Join the Ansan pilot.
          </h1>
          <p className="max-w-[26rem] text-[17px] leading-relaxed text-paper/80">
            New or returning, it&apos;s the same step. List your first book and you get 1 starter
            credit.
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
  const errorKey = first(params.error);
  return (
    <LoginForm
      next={safeRedirectPath(first(params.next))}
      notice={errorKey ? NOTICES[errorKey] : undefined}
    />
  );
}
